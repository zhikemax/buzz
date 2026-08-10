import {
  BookOpen,
  CircleAlert,
  CloudOff,
  DownloadCloud,
  ExternalLink,
  GitBranch,
  Globe,
  Loader2,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import { useAppNavigation } from "@/app/navigation/useAppNavigation";
import { useChannelsQuery } from "@/features/channels/hooks";
import type { ProjectRepoFile } from "@/features/projects/hooks";
import type { ProjectRepoUnavailableReason } from "@/features/projects/lib/projectRepoAvailability";
import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Markdown, SyntaxHighlightedCode } from "@/shared/ui/markdown";
import {
  baseName,
  formatLastChangedAt,
  languageForPath,
} from "./ProjectRepositoryPanel";
import {
  type RepoSourceHeaderControls,
  RepoSourceDropdown,
  RepoSyncActionButton,
  RepositoryBranchDropdown,
} from "./ProjectRepositorySource";
import { GitHubMark } from "./GitHubMark";

export function findReadmeFile(files: ProjectRepoFile[]) {
  const readmes = files.filter((file) =>
    /^readme(?:\.(?:md|markdown|mdx|txt))?$/i.test(baseName(file.path)),
  );

  return readmes.find((file) => !file.path.includes("/")) ?? readmes[0] ?? null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlInlineToMarkdown(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<img\b([^>]*)>/gi, (_match: string, attrs: string) => {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      const alt = attrs.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "";
      return src ? `![${alt}](${src})` : "";
    })
    .replace(
      /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_match: string, href: string, label: string) =>
        `[${htmlInlineToMarkdown(label).trim()}](${href})`,
    )
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "$1")
    .replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeReadmeMarkdown(content: string) {
  return content
    .replace(
      /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
      (_match, depth: string, value: string) =>
        `${"#".repeat(Number(depth))} ${htmlInlineToMarkdown(value)}\n\n`,
    )
    .replace(
      /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
      (_match, value: string) => `${htmlInlineToMarkdown(value)}\n\n`,
    )
    .replace(
      /<div\b[^>]*>([\s\S]*?)<\/div>/gi,
      (_match, value: string) => `${htmlInlineToMarkdown(value)}\n\n`,
    )
    .replace(
      /<center\b[^>]*>([\s\S]*?)<\/center>/gi,
      (_match, value: string) => `${htmlInlineToMarkdown(value)}\n\n`,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Description for the access-restricted state. Links to the bound channel
 * when it is visible to the viewer (public channels appear in the channel
 * list even before joining); private channels fall back to generic copy.
 */
function AccessRestrictedDescription({
  accessChannelId,
}: {
  accessChannelId: string;
}) {
  const t = useT();
  const { goChannel } = useAppNavigation();
  const channelsQuery = useChannelsQuery();
  const channel = channelsQuery.data?.find(
    (candidate) => candidate.id === accessChannelId,
  );

  if (!channel) {
    return <>{t("projects.readme.accessRestrictedDesc")}</>;
  }

  return (
    <>
      {t("projects.readme.accessRestrictedDesc")}{" "}
      <button
        aria-label={t("projects.readme.openChannelAria", {
          channel: channel.name,
        })}
        className="font-medium text-foreground underline-offset-2 hover:underline"
        onClick={() => void goChannel(channel.id)}
        type="button"
      >
        #{channel.name}
      </button>
    </>
  );
}

export function ReadmePanel({
  accessChannelId,
  file,
  gitDataState,
  externalHost,
  externalUrl,
  sourceControls,
  unavailableReason,
}: {
  /** `buzz-channel` binding of the repository, for access-restricted copy. */
  accessChannelId?: string | null;
  file: ProjectRepoFile | null;
  gitDataState: "checking" | "available" | "empty" | "unavailable";
  externalHost?: string;
  externalUrl?: string | null;
  unavailableReason?: ProjectRepoUnavailableReason;
  /** Branch picker + remote/local toggle rendered in the panel header. */
  sourceControls?: RepoSourceHeaderControls;
}) {
  const t = useT();
  // Two header rows, mirroring the files panel: controls on top, then the
  // file identity row.
  const header = (
    <>
      {sourceControls ? (
        <div className="flex min-h-14 min-w-0 items-center gap-1 border-border/50 border-b px-3 py-3">
          <RepoSourceDropdown controls={sourceControls} />
          <RepositoryBranchDropdown
            branch={sourceControls.branch}
            branchOptions={sourceControls.branchOptions}
            compact
            createBranchDisabled={sourceControls.createBranchDisabled}
            createBranchTitle={sourceControls.createBranchTitle}
            deleteBranchDisabled={sourceControls.deleteBranchDisabled}
            deleteBranchTitle={sourceControls.deleteBranchTitle}
            onBranchChange={sourceControls.onBranchChange}
            onCreateBranch={sourceControls.onCreateBranch}
            onDeleteBranch={sourceControls.onDeleteBranch}
            onTagChange={sourceControls.onTagChange}
            selectedTag={sourceControls.selectedTag}
            tagOptions={sourceControls.tagOptions}
          />
          <div className="ml-auto flex shrink-0 items-center">
            <RepoSyncActionButton controls={sourceControls} />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-10 items-center gap-2 border-border/50 border-b bg-muted/20 px-4">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {file ? baseName(file.path) : t("projects.readme.title")}
        </span>
        {file ? (
          <span className="hidden shrink-0 text-2xs text-muted-foreground sm:block">
            Last changed {formatLastChangedAt(file.lastChangedAt)}
          </span>
        ) : null}
      </div>
    </>
  );

  if (gitDataState === "checking") {
    return (
      <section className="overflow-hidden">
        {header}
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("projects.readme.loading")}
        </div>
      </section>
    );
  }

  if (gitDataState === "unavailable") {
    const reason = unavailableReason ?? "unknown";
    const unavailableContent = {
      authentication: {
        description: t("projects.readme.accessFailedDesc"),
        icon: LockKeyhole,
        title: t("projects.readme.accessFailedTitle"),
      },
      missing: {
        description: t("projects.readme.notInitializedDesc"),
        icon: CircleAlert,
        title: t("projects.readme.notInitializedTitle"),
      },
      access: {
        description: t("projects.readme.accessRestrictedDesc"),
        icon: LockKeyhole,
        title: t("projects.readme.accessRestrictedTitle"),
      },
      unbound: {
        description: t("projects.readme.noChannelDesc"),
        icon: LockKeyhole,
        title: t("projects.readme.noChannelTitle"),
      },
      network: {
        description: t("projects.readme.unreachableDesc"),
        icon: CloudOff,
        title: t("projects.readme.unreachableTitle"),
      },
      ref: {
        description: t("projects.readme.branchUnavailableDesc"),
        icon: GitBranch,
        title: t("projects.readme.branchUnavailableTitle"),
      },
      unknown: {
        description: t("projects.readme.unavailableDesc"),
        icon: CircleAlert,
        title: t("projects.readme.unavailableTitle"),
      },
    } satisfies Record<
      ProjectRepoUnavailableReason,
      {
        description: string;
        icon: typeof CircleAlert;
        title: string;
      }
    >;
    const unavailable = unavailableContent[reason];
    const UnavailableIcon = unavailable.icon;

    return (
      <section className="overflow-hidden">
        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            {externalHost === "github.com" ? (
              <GitHubMark className="h-6 w-6" />
            ) : externalHost ? (
              <Globe className="h-6 w-6" />
            ) : (
              <UnavailableIcon className="h-6 w-6" />
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {externalHost
              ? t("projects.readme.codeHostedOn", { host: externalHost })
              : unavailable.title}
          </h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {externalHost ? (
              t("projects.readme.cloneHint")
            ) : reason === "access" && accessChannelId ? (
              <AccessRestrictedDescription accessChannelId={accessChannelId} />
            ) : (
              unavailable.description
            )}
          </p>
          {externalUrl ? (
            <a
              className="mt-2 max-w-lg truncate font-mono text-xs text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              href={externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              {externalUrl}
            </a>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {!externalHost && sourceControls?.onFetch ? (
              <Button
                disabled={sourceControls.fetchPending}
                onClick={sourceControls.onFetch}
                size="sm"
                variant="outline"
              >
                {sourceControls.fetchPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {sourceControls.fetchPending
                  ? t("projects.readme.retrying")
                  : t("common.retry")}
              </Button>
            ) : null}
            {externalHost && sourceControls?.onCloneLocal ? (
              <Button
                disabled={sourceControls.clonePending}
                onClick={sourceControls.onCloneLocal}
                size="sm"
              >
                {sourceControls.clonePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                {sourceControls.clonePending
                  ? t("projects.repo.source.cloning")
                  : t("projects.readme.cloneLocally")}
              </Button>
            ) : null}
            {externalUrl ? (
              <Button asChild size="sm" variant="outline">
                <a href={externalUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  {t("projects.readme.openOnHost", {
                    host: externalHost ?? "",
                  })}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (!file?.previewContent) {
    return (
      <section className="overflow-hidden">
        {header}
        <div className="p-6 text-sm text-muted-foreground">
          {gitDataState === "empty"
            ? t("projects.readme.noFilesPushed")
            : t("projects.readme.addReadmeHint")}
        </div>
      </section>
    );
  }

  const language = languageForPath(file.path);
  const isMarkdown = /\.(?:md|markdown|mdx)$/i.test(file.path);
  const readmeContent = isMarkdown
    ? normalizeReadmeMarkdown(file.previewContent)
    : file.previewContent;

  return (
    <section className="overflow-hidden">
      {header}
      <div className="p-4">
        {isMarkdown ? (
          <Markdown
            className="text-sm"
            content={readmeContent}
            interactive={false}
          />
        ) : language ? (
          <pre className="overflow-x-auto bg-muted/40 p-4">
            <SyntaxHighlightedCode
              className="text-xs leading-relaxed"
              code={file.previewContent}
              language={language}
            />
          </pre>
        ) : (
          <pre className="overflow-x-auto bg-muted/40 p-4">
            <code className="block min-w-full whitespace-pre font-mono text-xs leading-relaxed text-foreground">
              {file.previewContent}
            </code>
          </pre>
        )}
      </div>
    </section>
  );
}
