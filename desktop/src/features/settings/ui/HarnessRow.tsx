import * as React from "react";
import { ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

import {
  useDeleteCustomHarnessMutation,
  useInstallAcpRuntimeMutation,
  useManagedAgentsQuery,
  usePersonasQuery,
} from "@/features/agents/hooks";
import { useInstallOutputLine } from "@/features/agents/lib/useInstallOutputLine";
import { RuntimeIcon } from "@/features/onboarding/ui/RuntimeIcon";
import type { AcpRuntimeCatalogEntry } from "@/shared/api/types";
import { useT, type MessageKey } from "@/shared/i18n";
import { getInstallErrorMessage } from "@/shared/lib/installError";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Spinner } from "@/shared/ui/spinner";

import { CustomHarnessForm } from "./CustomHarnessForm";
import {
  adapterUpdateWarning,
  entryStatusLabel,
  isDownloadPageUrl,
} from "./harnessCatalogLogic";
import { formValuesFromCatalogEntry } from "./harnessFormLogic";
import { deleteConfirmState } from "./harnessGalleryLogic";

/** Link label key for the row's install-instructions URL. Distinct from the
 * catalog's `installLinkLabel` — rows spell out what the guide covers
 * (adapter vs CLI) because the row lacks the catalog's setup context. */
function runtimeInstallGuideLabelKey(
  runtime: AcpRuntimeCatalogEntry,
): MessageKey {
  if (
    runtime.availability === "adapter_missing" ||
    runtime.availability === "adapter_outdated"
  ) {
    return "settings.agents.adapterInstallGuide";
  }
  return isDownloadPageUrl(runtime.installInstructionsUrl)
    ? "settings.agents.downloadPage"
    : "settings.agents.cliSetupGuide";
}

function RuntimeLogo({ runtime }: { runtime: AcpRuntimeCatalogEntry }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center"
      data-testid={`doctor-runtime-logo-${runtime.id}`}
    >
      <RuntimeIcon className="h-9 w-9" runtime={runtime} />
    </span>
  );
}

function RuntimeActions({
  isInstalling,
  onDelete,
  onEdit,
  onInstall,
  runtime,
}: {
  isInstalling: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onInstall: () => void;
  runtime: AcpRuntimeCatalogEntry;
}) {
  const t = useT();
  const isAvailable = runtime.availability === "available";
  const canInstall = runtime.canAutoInstall && !runtime.nodeRequired;

  return (
    <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
      {onEdit ? (
        <Button
          className="h-7 px-2 text-xs"
          data-testid={`custom-harness-edit-${runtime.id}`}
          onClick={onEdit}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("common.edit")}
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          data-testid={`custom-harness-delete-${runtime.id}`}
          onClick={onDelete}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("common.delete")}
        </Button>
      ) : null}
      {isInstalling ? (
        <div className="flex h-7 w-9 items-center justify-center text-muted-foreground">
          <Spinner
            aria-label={t("settings.agents.installingAria", {
              label: runtime.label,
            })}
            className="h-4 w-4 border-2"
            data-testid={`doctor-runtime-loading-${runtime.id}`}
          />
        </div>
      ) : isAvailable ? (
        <span
          className="inline-flex shrink-0 items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          data-testid={`doctor-runtime-ready-${runtime.id}`}
        >
          {t("settings.agents.status.ready")}
        </span>
      ) : canInstall ? (
        <Button
          aria-label={t("settings.agents.installAria", {
            label: runtime.label,
          })}
          className="h-7 px-3 text-xs"
          data-testid={`doctor-runtime-install-${runtime.id}`}
          onClick={onInstall}
          size="sm"
          type="button"
          variant="outline"
        >
          {runtime.availability === "adapter_outdated"
            ? t("settings.agents.update")
            : t("settings.agents.install")}
        </Button>
      ) : null}
    </div>
  );
}

function RuntimeStatusChip({ runtime }: { runtime: AcpRuntimeCatalogEntry }) {
  const t = useT();
  const labelKey = entryStatusLabel(runtime);

  if (!labelKey) {
    return null;
  }

  const isConfigError = runtime.authStatus.status === "config_invalid";

  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground/50">
        ·
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium",
          isConfigError
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
        data-testid={`doctor-runtime-status-${runtime.id}`}
      >
        {t(labelKey)}
      </span>
    </>
  );
}

/**
 * One row in "Your runtimes".
 *
 * Install / CLI guidance lives under the row (Goose-style). Vendor login lives
 * in Agent Defaults when the preferred runtime needs it — not on this row.
 */
export function HarnessRow({
  embedded = false,
  resetEpoch,
  runtime,
}: {
  embedded?: boolean;
  resetEpoch: number;
  runtime: AcpRuntimeCatalogEntry;
}) {
  const t = useT();
  const isCustom = runtime.source === "custom";
  const [isUpdateWarningOpen, setIsUpdateWarningOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const installMutation = useInstallAcpRuntimeMutation();
  const [installResult, setInstallResult] = React.useState<{
    success: boolean;
    error: string | null;
  } | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetEpoch is an intentional trigger only; its value is not consumed in the effect body
  React.useEffect(() => {
    setInstallResult(null);
  }, [resetEpoch]);
  const isInstalling = installMutation.isPending;
  const installError = installResult?.error ?? null;
  const installOutputLine = useInstallOutputLine(runtime.id, isInstalling);

  const del = useDeleteCustomHarnessMutation();
  const agentsQuery = useManagedAgentsQuery({ enabled: confirmingDelete });
  const personasQuery = usePersonasQuery({ enabled: confirmingDelete });
  const confirmState = deleteConfirmState(
    runtime.id,
    runtime.label,
    agentsQuery,
    personasQuery,
  );

  const showGuidanceBlock =
    runtime.availability !== "available" || runtime.nodeRequired;

  function handleInstall() {
    setInstallResult(null);
    installMutation.mutate(runtime.id, {
      onSuccess: (result) => {
        if (result.success) {
          setInstallResult({ success: true, error: null });
        } else {
          setInstallResult({
            success: false,
            error: getInstallErrorMessage(result),
          });
        }
      },
      onError: (error) => {
        setInstallResult({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : t("settings.agents.installFailed"),
        });
      },
    });
  }

  if (editing) {
    return (
      <CustomHarnessForm
        initial={formValuesFromCatalogEntry(runtime)}
        originalId={runtime.id}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-16 px-4 py-3.5 text-sm",
        !embedded && "rounded-2xl border border-border/60 bg-muted/20",
      )}
      data-testid={`doctor-runtime-${runtime.id}`}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <RuntimeLogo runtime={runtime} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 text-sm font-medium">{runtime.label}</p>
              <RuntimeStatusChip runtime={runtime} />
            </div>
          </div>
          <RuntimeActions
            isInstalling={isInstalling}
            onDelete={
              isCustom
                ? () => {
                    setDeleteError(null);
                    setConfirmingDelete(true);
                  }
                : undefined
            }
            onEdit={isCustom ? () => setEditing(true) : undefined}
            onInstall={() => {
              if (runtime.availability === "adapter_outdated") {
                setIsUpdateWarningOpen(true);
                return;
              }
              handleInstall();
            }}
            runtime={runtime}
          />
        </div>

        {showGuidanceBlock ? (
          <div
            className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
            data-testid={`doctor-runtime-guidance-${runtime.id}`}
          >
            <p>
              {runtime.installHint.trim().length > 0
                ? runtime.installHint
                : runtime.nodeRequired
                  ? t("settings.agents.installNode")
                  : null}
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {runtime.nodeRequired ? (
                <button
                  className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => void openUrl("https://nodejs.org")}
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("settings.agents.installNode")}
                </button>
              ) : null}
              {runtime.installInstructionsUrl.trim().length > 0 ? (
                <button
                  className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => void openUrl(runtime.installInstructionsUrl)}
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t(runtimeInstallGuideLabelKey(runtime))}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {runtime.authStatus.status === "config_invalid" ? (
          <p
            className="mt-2 whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive"
            data-testid={`doctor-runtime-config-error-${runtime.id}`}
          >
            {t("settings.agents.configErrorPrefix", {
              diagnostic: runtime.authStatus.diagnostic,
            })}
          </p>
        ) : null}

        {isInstalling && installOutputLine ? (
          <p
            aria-live="polite"
            className="mt-2 truncate rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 font-mono text-xs text-muted-foreground"
            data-testid={`doctor-runtime-install-output-${runtime.id}`}
          >
            {installOutputLine}
          </p>
        ) : null}
        {installError ? (
          <p
            className="mt-2 whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive"
            data-testid={`doctor-runtime-install-error-${runtime.id}`}
          >
            {installError}
          </p>
        ) : null}
        {confirmingDelete ? (
          <div className="mt-2 space-y-2">
            <p
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400"
              data-testid={`custom-harness-delete-warning-${runtime.id}`}
            >
              {confirmState.message}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                className="h-7 px-3 text-xs"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteError(null);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="h-7 px-3 text-xs"
                data-testid={`custom-harness-delete-confirm-${runtime.id}`}
                disabled={del.isPending || !confirmState.canConfirm}
                onClick={() => {
                  setDeleteError(null);
                  del.mutate(runtime.id, {
                    onSuccess: () => setConfirmingDelete(false),
                    onError: (err) => {
                      setDeleteError(
                        err instanceof Error ? err.message : String(err),
                      );
                    },
                  });
                }}
                size="sm"
                type="button"
                variant="destructive"
              >
                {del.isPending ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  t("common.delete")
                )}
              </Button>
            </div>
            {deleteError ? (
              <p className="text-sm text-destructive">{deleteError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <AlertDialog
        onOpenChange={setIsUpdateWarningOpen}
        open={isUpdateWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.agents.updateAdapterTitle", {
                label: runtime.label,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const warning = adapterUpdateWarning(runtime);
                return t(warning.key, warning.params);
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsUpdateWarningOpen(false);
                handleInstall();
              }}
            >
              {t("settings.agents.update")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
