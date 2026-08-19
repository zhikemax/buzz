import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchProjects,
  type Project,
  projectsQueryKey,
} from "@/features/projects/hooks";
import {
  buildInitialProjectEventTemplates,
  isUnsupportedProjectKindError,
} from "@/features/projects/projectCreation";
import { addProjectToSidebar } from "@/features/projects/lib/projectSidebarMembership";
import { buildProjectReadModels } from "@/features/projects/projectModels";
import { relayClient } from "@/shared/api/relayClient";
import { getCachedRelayOrigin } from "@/shared/lib/mediaUrl";
import { signRelayEvent } from "@/shared/api/tauri";
import { getIdentity } from "@/shared/api/tauriIdentity";
import { detectLocale, translate } from "@/shared/i18n";

export type CreateProjectInput = {
  accessChannelId: string;
  name: string;
  description?: string;
  cloneUrl?: string;
  webUrl?: string;
};

export type CreateProjectResult = {
  project: Project;
  compatibilityWarning?: string;
};

/** Publishes a project announcement and its initial NIP-34 repository. */
async function createProject(
  input: CreateProjectInput,
  resumableProjectIds: Set<string>,
): Promise<CreateProjectResult> {
  const identity = await getIdentity();
  const templates = buildInitialProjectEventTemplates({
    ...input,
    ownerPubkey: identity.pubkey,
  });
  const existing = await fetchProjects();
  const ownerPubkey = identity.pubkey.toLowerCase();
  const existingProject = existing.find(
    (project) =>
      project.owner.toLowerCase() === ownerPubkey &&
      project.dtag === templates.dtag,
  );
  const projectId = `${ownerPubkey}:${templates.dtag}`;
  const canResume = resumableProjectIds.has(projectId);
  if (existingProject && !canResume) {
    throw new Error(
      translate(detectLocale(), "projects.create.alreadyNamed", {
        name: templates.dtag,
      }),
    );
  }
  if (existingProject && !existingProject.legacy) {
    if (
      existingProject.repositories.some(
        (repository) => repository.repoAddress === templates.repositoryAddress,
      )
    ) {
      resumableProjectIds.delete(projectId);
      return { project: existingProject };
    }
    throw new Error(
      translate(detectLocale(), "projects.create.alreadyNamed", {
        name: templates.dtag,
      }),
    );
  }

  resumableProjectIds.add(projectId);
  const projectEvent = await signRelayEvent(templates.project);

  let repositoryEvent = null;
  if (!existingProject) {
    repositoryEvent = await signRelayEvent(templates.repository);
    await relayClient.publishEvent(
      repositoryEvent,
      translate(detectLocale(), "projects.create.repoTimeout"),
      translate(detectLocale(), "projects.create.repoFailed"),
    );
  }

  try {
    await relayClient.publishEvent(
      projectEvent,
      translate(detectLocale(), "projects.create.timeout"),
      translate(detectLocale(), "projects.create.failed"),
    );
  } catch (error) {
    if (!isUnsupportedProjectKindError(error)) throw error;

    const [legacyProject] = existingProject?.legacy
      ? [existingProject]
      : buildProjectReadModels({
          projectEvents: [],
          repositoryEvents: repositoryEvent ? [repositoryEvent] : [],
          relayOrigin: getCachedRelayOrigin(),
        });
    if (!legacyProject) throw error;

    resumableProjectIds.delete(projectId);
    return {
      project: legacyProject,
      compatibilityWarning: translate(
        detectLocale(),
        "projects.create.compatWarning",
      ),
    };
  }

  const [project] = repositoryEvent
    ? buildProjectReadModels({
        projectEvents: [projectEvent],
        repositoryEvents: [repositoryEvent],
        relayOrigin: getCachedRelayOrigin(),
      })
    : (await fetchProjects()).filter(
        (candidate) =>
          candidate.owner.toLowerCase() === ownerPubkey &&
          candidate.dtag === templates.dtag &&
          !candidate.legacy,
      );
  if (!project) {
    throw new Error(translate(detectLocale(), "projects.create.readFailed"));
  }
  resumableProjectIds.delete(projectId);
  return { project };
}

/** Mutation that creates a project and inserts it into the projects cache. */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const resumableProjectIdsRef = React.useRef(new Set<string>());

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      createProject(input, resumableProjectIdsRef.current),
    onSuccess: ({ project }) => {
      addProjectToSidebar(
        project.projectAddress,
        getCachedRelayOrigin(),
        project.owner,
      );
      queryClient.setQueryData<Project[]>(projectsQueryKey, (current = []) => [
        project,
        ...current.filter(
          (candidate) =>
            candidate.id !== project.id &&
            !(
              candidate.legacy &&
              candidate.owner === project.owner &&
              candidate.dtag === project.dtag
            ),
        ),
      ]);
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}
