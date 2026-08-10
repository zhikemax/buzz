import { toast } from "sonner";

import { personaManagedAgentUpdate } from "@/features/profile/ui/UserProfilePanelUtils";
import type {
  AcpRuntimeCatalogEntry,
  AgentPersona,
  CreateManagedAgentResponse,
  CreatePersonaInput,
  ManagedAgent,
  UpdateManagedAgentInput,
  UpdatePersonaInput,
} from "@/shared/api/types";
import type { TranslateFn } from "@/shared/i18n";

type SubmitProfilePersonaDialogOptions = {
  createManagedAgentForPersona: (
    persona: AgentPersona,
  ) => Promise<CreateManagedAgentResponse>;
  createPersona: (input: CreatePersonaInput) => Promise<AgentPersona>;
  input: CreatePersonaInput | UpdatePersonaInput;
  managedAgent: ManagedAgent | undefined;
  onDone: () => void;
  previousPersona?: AgentPersona;
  runtimes?: readonly AcpRuntimeCatalogEntry[];
  t: TranslateFn;
  updateManagedAgent: (
    input: UpdateManagedAgentInput,
  ) => Promise<{ agent: ManagedAgent; profileSyncError: string | null }>;
  updatePersona: (input: UpdatePersonaInput) => Promise<AgentPersona>;
};

type ValidateLinkedAgentRuntimeEditOptions = {
  input: UpdatePersonaInput;
  managedAgent: ManagedAgent | undefined;
  previousPersona?: AgentPersona;
  runtimes?: readonly AcpRuntimeCatalogEntry[];
};

function normalizeRuntimePreference(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export type LinkedAgentRuntimeEditError = {
  kind: "runtimeUnavailable";
  runtimeLabel: string | null;
};

export function validateLinkedAgentRuntimeEdit({
  input,
  managedAgent,
  previousPersona,
  runtimes,
}: ValidateLinkedAgentRuntimeEditOptions): LinkedAgentRuntimeEditError | null {
  if (!managedAgent || !previousPersona) {
    return null;
  }

  const previousRuntime = normalizeRuntimePreference(previousPersona.runtime);
  const nextRuntime = normalizeRuntimePreference(input.runtime);
  if (previousRuntime === nextRuntime) {
    return null;
  }

  const runtime = runtimes?.find((candidate) => candidate.id === nextRuntime);
  if (runtime?.availability === "available" && runtime.command) {
    return null;
  }

  return {
    kind: "runtimeUnavailable",
    runtimeLabel: runtime?.label ?? null,
  };
}

export async function submitProfilePersonaDialog({
  createManagedAgentForPersona,
  createPersona,
  input,
  managedAgent,
  onDone,
  previousPersona,
  runtimes,
  t,
  updateManagedAgent,
  updatePersona,
}: SubmitProfilePersonaDialogOptions) {
  try {
    if ("id" in input) {
      const runtimeEditError = validateLinkedAgentRuntimeEdit({
        input,
        managedAgent,
        previousPersona,
        runtimes,
      });
      if (runtimeEditError) {
        toast.error(
          t("agents.runtimeUnavailableInstall", {
            name:
              runtimeEditError.runtimeLabel ??
              t("agents.thisProviderCapitalized"),
          }),
        );
        return;
      }

      const persona = await updatePersona(input);
      const agentUpdate = managedAgent
        ? personaManagedAgentUpdate(managedAgent, persona, {
            previousPersona,
            runtimes,
          })
        : null;
      const result = agentUpdate ? await updateManagedAgent(agentUpdate) : null;
      if (result?.profileSyncError) {
        toast.warning(
          t("agents.updatedButProfileSyncFailed", {
            name: result.agent.name,
            error: result.profileSyncError,
          }),
        );
      }
      toast.success(t("agents.updatedNamed", { name: input.displayName }));
    } else {
      const persona = await createPersona(input);
      try {
        const created = await createManagedAgentForPersona(persona);
        if (created.spawnError) {
          toast.error(
            t("agents.createdButDidNotStart", {
              name: persona.displayName,
              message: created.spawnError,
            }),
          );
        } else {
          toast.success(
            t("agents.createdAndStartedNamed", { name: created.agent.name }),
          );
        }
        if (created.profileSyncError) {
          toast.warning(
            t("agents.createdButProfileSyncFailed", {
              name: created.agent.name,
              message: created.profileSyncError,
            }),
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? t("agents.createdButInstanceFailed", {
                name: persona.displayName,
                message: error.message,
              })
            : t("agents.createdButInstanceFailedGeneric", {
                name: persona.displayName,
              }),
        );
      }
    }

    onDone();
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : t("agents.failedSaveAgent"),
    );
  }
}
