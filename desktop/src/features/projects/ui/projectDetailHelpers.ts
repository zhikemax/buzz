import type {
  ProjectRepoSnapshot,
  Repository as Project,
} from "@/features/projects/hooks";
import type { MessageKey, TranslateFn } from "@/shared/i18n";
import { normalizePubkey } from "@/shared/lib/pubkey";

const PROJECT_TAB_CRUMB_KEYS: Record<string, MessageKey> = {
  files: "projects.tab.files",
  activity: "projects.tab.commits",
  issues: "projects.tab.issues",
  prs: "projects.tab.pullRequests",
  contributors: "projects.tab.contributors",
};

export function projectTabCrumbLabel(tab: string, t: TranslateFn): string {
  const key = PROJECT_TAB_CRUMB_KEYS[tab];
  return key ? t(key) : tab;
}

/** Tooltip for the push/pull sync buttons, e.g. "Pull 2 remote commits". */
export function pushPullTitle(
  verb: "Push" | "Pull",
  count: number | undefined,
  side: "local" | "remote",
  t: TranslateFn,
) {
  const verbLabel =
    verb === "Push" ? t("projects.sync.pushVerb") : t("projects.sync.pullVerb");
  const sideLabel =
    side === "local"
      ? t("projects.sync.sideLocal")
      : t("projects.sync.sideRemote");
  if (!count) {
    return t("projects.sync.pushPullVerb", { verb: verbLabel, side: sideLabel });
  }
  const key =
    count === 1
      ? "projects.sync.pushPullCountOne"
      : "projects.sync.pushPullCountMany";
  return t(key, { verb: verbLabel, count, side: sideLabel });
}

/** Returns the normalized owner and contributor pubkeys for a project. */
export function projectPeople(project: Project) {
  return [
    ...new Set(
      [project.owner, ...project.contributors]
        .filter(Boolean)
        .map(normalizePubkey),
    ),
  ];
}

/** Reports whether a repository snapshot contains any displayable content. */
export function snapshotHasContent(
  snapshot: ProjectRepoSnapshot | null | undefined,
) {
  return Boolean(
    snapshot &&
      (snapshot.latestCommit ||
        snapshot.commits.length > 0 ||
        snapshot.files.length > 0 ||
        snapshot.contributors.length > 0),
  );
}
