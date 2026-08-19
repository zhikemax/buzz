import { translate, type TranslateFn } from "@/shared/i18n";
import type { ProjectRepoUnavailableReason } from "./projectRepoAvailability";

export type ProjectGitErrorPresentation = {
  title: string;
  description: string;
};

function errorText(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  return typeof error === "string" ? error.toLowerCase() : "";
}

function isGitHubUrl(cloneUrl: string | null | undefined) {
  try {
    return new URL(cloneUrl ?? "").hostname.toLowerCase() === "github.com";
  } catch {
    return false;
  }
}

export function projectCloneErrorPresentation(
  error: unknown,
  cloneUrl?: string | null,
  unavailableReason?: ProjectRepoUnavailableReason,
  t: TranslateFn = translate,
): ProjectGitErrorPresentation {
  const message = errorText(error);
  const github = isGitHubUrl(cloneUrl);

  if (unavailableReason === "access") {
    return {
      title: t("projects.gitError.accessRestricted.title"),
      description: t("projects.gitError.accessRestricted.desc"),
    };
  }
  if (
    /\b(?:401|403)\b|authenticat|authoriz|permission denied|access denied|ssh certificate/.test(
      message,
    )
  ) {
    return {
      title: t("projects.gitError.accessRequired.title"),
      description: github
        ? t("projects.gitError.accessRequired.githubDesc")
        : t("projects.gitError.accessRequired.genericDesc"),
    };
  }
  if (/\b404\b|repository not found|repository does not exist/.test(message)) {
    return {
      title: t("projects.gitError.notFound.title"),
      description: t("projects.gitError.notFound.desc"),
    };
  }
  if (
    /timed? out|could not resolve host|failed to connect|connection (?:refused|reset)|network is unreachable|offline/.test(
      message,
    )
  ) {
    return {
      title: t("projects.gitError.network.title"),
      description: t("projects.gitError.network.desc"),
    };
  }
  if (
    /already exists and is not an empty directory|destination path .* exists/.test(
      message,
    )
  ) {
    return {
      title: t("projects.gitError.exists.title"),
      description: t("projects.gitError.exists.desc"),
    };
  }
  return {
    title: t("projects.gitError.cloneFailed.title"),
    description: github
      ? t("projects.gitError.cloneFailed.githubDesc")
      : t("projects.gitError.cloneFailed.genericDesc"),
  };
}
