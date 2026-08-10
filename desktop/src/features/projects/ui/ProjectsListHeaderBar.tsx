import type {
  ProjectsFilter,
  ProjectsRepositoryScope,
  ProjectsSort,
  ProjectsViewMode,
  ProjectsWorkItemScope,
} from "@/features/projects/lib/projectsViewHelpers";
import { ProjectsListScopeDropdown } from "@/features/projects/ui/ProjectsListScopeDropdown";
import { ProjectsViewModeToggle } from "@/features/projects/ui/ProjectsToolbar";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

type ProjectsListHeaderBarProps = {
  filter: ProjectsFilter;
  issueScope: ProjectsWorkItemScope;
  onIssueScopeChange: (scope: ProjectsWorkItemScope) => void;
  onPullRequestScopeChange: (scope: ProjectsWorkItemScope) => void;
  onRepositoryScopeChange: (scope: ProjectsRepositoryScope) => void;
  onSortChange: (sort: ProjectsSort) => void;
  onViewModeChange: (viewMode: ProjectsViewMode) => void;
  pullRequestScope: ProjectsWorkItemScope;
  repositoryScope: ProjectsRepositoryScope;
  sort: ProjectsSort;
  /**
   * "row" renders as the first row of the list table (no chrome of its own —
   * the surrounding container provides border and rounding); "bar" renders as
   * a standalone rounded bar with identical proportions for the card grid.
   */
  variant: "bar" | "row";
  viewMode: ProjectsViewMode;
};

/**
 * Header for the Projects lists: scope selector on the left, sort + view
 * toggle on the right.
 */
export function ProjectsListHeaderBar({
  filter,
  issueScope,
  onIssueScopeChange,
  onPullRequestScopeChange,
  onRepositoryScopeChange,
  onSortChange,
  onViewModeChange,
  pullRequestScope,
  repositoryScope,
  sort,
  variant,
  viewMode,
}: ProjectsListHeaderBarProps) {
  const t = useT();

  const projectScopeOptions = [
    { label: t("projects.scope.all"), value: "all" as const },
    { label: t("projects.scope.accessible"), value: "accessible" as const },
    { label: t("projects.scope.myProjects"), value: "mine" as const },
    { label: t("projects.scope.local"), value: "local" as const },
  ];
  const repositoryScopeOptions = [
    { label: t("projects.scope.all"), value: "all" as const },
    { label: t("projects.scope.accessible"), value: "accessible" as const },
    { label: t("projects.scope.myRepositories"), value: "mine" as const },
    { label: t("projects.scope.local"), value: "local" as const },
    { label: t("projects.scope.buzzHosted"), value: "buzz" as const },
    { label: t("projects.scope.linked"), value: "linked" as const },
  ];
  const pullRequestScopeOptions = [
    { label: t("projects.scope.all"), value: "all" as const },
    { label: t("projects.scope.myPullRequests"), value: "mine" as const },
  ];
  const issueScopeOptions = [
    { label: t("projects.scope.all"), value: "all" as const },
    { label: t("projects.scope.myIssues"), value: "mine" as const },
  ];

  const scopeDropdown =
    filter === "prs" ? (
      <ProjectsListScopeDropdown
        label={t("projects.filter.pullRequests")}
        onChange={onPullRequestScopeChange}
        options={pullRequestScopeOptions}
        value={pullRequestScope}
      />
    ) : filter === "issues" ? (
      <ProjectsListScopeDropdown
        label={t("projects.filter.issues")}
        onChange={onIssueScopeChange}
        options={issueScopeOptions}
        value={issueScope}
      />
    ) : filter === "projects" ? (
      <ProjectsListScopeDropdown
        label={t("projects.filter.projects")}
        onChange={onRepositoryScopeChange}
        options={projectScopeOptions}
        value={repositoryScope}
      />
    ) : (
      <ProjectsListScopeDropdown
        label={t("projects.filter.repositories")}
        onChange={onRepositoryScopeChange}
        options={repositoryScopeOptions}
        value={repositoryScope}
      />
    );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 bg-muted/20 px-3 py-1.5",
        variant === "bar"
          ? "rounded-xl border border-border/60"
          : "border-b border-border/60",
      )}
      data-testid="projects-list-header"
    >
      {scopeDropdown}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="sr-only">{t("projects.sort.label")}</span>
          <select
            className="h-8 rounded-md bg-transparent px-2 text-xs text-foreground outline-hidden hover:bg-muted/50 focus:ring-1 focus:ring-ring"
            onChange={(event) =>
              onSortChange(event.target.value as ProjectsSort)
            }
            value={sort}
          >
            <option value="updated">{t("projects.sort.recentActivity")}</option>
            <option value="created">{t("projects.sort.createdDate")}</option>
            <option value="name">{t("projects.sort.name")}</option>
          </select>
        </label>
        <ProjectsViewModeToggle
          onViewModeChange={onViewModeChange}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}
