import * as React from "react";
import { AlertCircle, Lock, Upload } from "lucide-react";

import type {
  AgentSnapshotImportPreview,
  AgentSnapshotImportResult,
} from "@/features/agents/hooks";
import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Separator } from "@/shared/ui/separator";

import { AgentDefinitionMetadata } from "./AgentDefinitionMetadata";

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportPhase = "preview" | "confirming" | "result";

type AgentSnapshotImportDialogProps = {
  open: boolean;
  /** Preview data loaded by the caller before opening. */
  preview: AgentSnapshotImportPreview;
  /** True while the confirm mutation is in-flight. */
  isConfirming: boolean;
  /** Set when the confirm mutation has returned a result. */
  result: AgentSnapshotImportResult | null;
  /** Error from the confirm mutation, if any. */
  confirmError: string | null;
  /** Called with keepAllowlist when user clicks Import. */
  onConfirm: (keepAllowlist: boolean) => void;
  onOpenChange: (open: boolean) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AgentSnapshotImportDialog({
  open,
  preview,
  isConfirming,
  result,
  confirmError,
  onConfirm,
  onOpenChange,
}: AgentSnapshotImportDialogProps) {
  const t = useT();
  // Default: clear the source allowlist (safe default per spec).
  const [keepAllowlist, setKeepAllowlist] = React.useState(false);

  // Reset choice whenever the dialog opens with new data.
  React.useEffect(() => {
    if (open) {
      setKeepAllowlist(false);
    }
  }, [open]);

  const phase: ImportPhase =
    result !== null ? "result" : isConfirming ? "confirming" : "preview";

  const hasMemory = preview.memoryEntryCount > 0;
  const memoryLevelLabel =
    preview.memoryLevel === "core"
      ? t("agents.memoryLevelCore")
      : preview.memoryLevel === "everything"
        ? t("agents.memoryLevelAll")
        : t("agents.memoryLevelNone");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        data-testid="agent-snapshot-import-dialog"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>
              {phase === "result"
                ? t("agents.agentImported")
                : t("agents.importAgentSnapshot")}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {phase === "preview" ? (
                <>
                  <Button
                    data-testid="agent-snapshot-import-confirm"
                    disabled={isConfirming}
                    onClick={() => onConfirm(keepAllowlist)}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    <Upload className="h-4 w-4" />
                    {t("agents.import")}
                  </Button>
                  <DialogClose asChild>
                    <Button
                      disabled={isConfirming}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {t("common.cancel")}
                    </Button>
                  </DialogClose>
                </>
              ) : (
                <DialogClose asChild>
                  <Button size="sm" type="button" variant="ghost">
                    {t("common.close")}
                  </Button>
                </DialogClose>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {phase === "preview" ? (
          <PreviewBody
            preview={preview}
            hasMemory={hasMemory}
            memoryLevelLabel={memoryLevelLabel}
            keepAllowlist={keepAllowlist}
            onKeepAllowlistChange={setKeepAllowlist}
          />
        ) : phase === "confirming" ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("agents.creatingAgent")}
          </div>
        ) : result !== null ? (
          <ResultBody result={result} confirmError={confirmError} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── Preview body ──────────────────────────────────────────────────────────────

export function PreviewBody({
  preview,
  hasMemory,
  memoryLevelLabel,
  keepAllowlist,
  onKeepAllowlistChange,
}: {
  preview: AgentSnapshotImportPreview;
  hasMemory: boolean;
  memoryLevelLabel: string;
  keepAllowlist: boolean;
  onKeepAllowlistChange: (v: boolean) => void;
}) {
  const t = useT();
  const memoryEntries =
    preview.memoryEntryCount === 1 ? t("agents.entry") : t("agents.entries");
  const allowlistEntries =
    preview.sourceAllowlistCount === 1
      ? t("agents.entry")
      : t("agents.entries");

  return (
    <div className="space-y-4 py-1">
      {/* Agent identity */}
      <div className="space-y-1">
        <p className="text-sm font-medium">{preview.displayName}</p>
      </div>

      {/* Locked-card provenance: this file was encrypted to this machine's
          keys and has been unlocked for review. */}
      {preview.locked ? (
        <div
          className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
          data-testid="agent-snapshot-import-locked-notice"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t("agents.importLockedNoticeBefore")}{" "}
            <strong>{t("agents.locked")}</strong>{" "}
            {t("agents.importLockedNoticeAfter")}
          </p>
        </div>
      ) : null}

      <AgentDefinitionMetadata
        isBuiltIn={preview.isBuiltIn}
        model={preview.model}
        runtime={preview.runtime}
      />

      {/* Portable behavior — never hide executable configuration behind a summary. */}
      <section
        className="space-y-2 rounded-md border border-border p-3"
        data-testid="agent-snapshot-import-behavior"
      >
        <div>
          <p className="text-sm font-medium">{t("agents.agentInstructions")}</p>
          <p className="text-xs text-muted-foreground">
            {t("agents.reviewInstructionsAfterImport")}
          </p>
        </div>
        <pre
          className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/60 p-3 text-xs"
          data-testid="agent-snapshot-import-system-prompt"
        >
          {preview.systemPrompt || t("agents.noSystemPrompt")}
        </pre>
      </section>

      <p className="text-sm text-muted-foreground">
        {t("agents.importFreshKeypair")}
      </p>

      {/* Memory section */}
      {hasMemory ? (
        <div
          className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          data-testid="agent-snapshot-import-memory-warning"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t("agents.importMemoryWarning", {
              count: preview.memoryEntryCount,
              level: memoryLevelLabel,
              entries: memoryEntries,
            })}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("agents.noMemoryConfigOnly")}
        </p>
      )}

      {/* Allowlist section */}
      {preview.hasSourceAllowlist ? (
        <div
          className="space-y-2 rounded-md border border-border p-3"
          data-testid="agent-snapshot-import-allowlist-section"
        >
          <p className="text-sm font-medium">
            {t("agents.respondToAllowlist", {
              count: preview.sourceAllowlistCount,
              entries: allowlistEntries,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("agents.allowlistReview")}
          </p>
          <ul
            className="max-h-28 space-y-1 overflow-y-auto rounded bg-muted/60 p-2 font-mono text-xs"
            data-testid="agent-snapshot-import-allowlist-values"
          >
            {preview.sourceAllowlist.map((pubkey) => (
              <li className="break-all" key={pubkey}>
                {pubkey}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={!keepAllowlist}
                data-testid="agent-snapshot-import-allowlist-clear"
                name="allowlist-choice"
                onChange={() => onKeepAllowlistChange(false)}
                type="radio"
              />
              <span className="text-sm">{t("agents.clearAllowlist")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={keepAllowlist}
                data-testid="agent-snapshot-import-allowlist-keep"
                name="allowlist-choice"
                onChange={() => onKeepAllowlistChange(true)}
                type="radio"
              />
              <span className="text-sm">{t("agents.keepAllowlist")}</span>
            </label>
          </div>
        </div>
      ) : null}

      <details
        className="rounded-md border border-border p-3"
        data-testid="agent-snapshot-import-manifest"
      >
        <summary className="cursor-pointer text-sm font-medium">
          {t("agents.fullEmbeddedManifest")}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("agents.manifestSecretsNote")}
        </p>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/60 p-3 text-xs">
          {preview.manifestJson}
        </pre>
      </details>
    </div>
  );
}

// ── Result body ───────────────────────────────────────────────────────────────

export function ResultBody({
  result,
  confirmError,
}: {
  result: AgentSnapshotImportResult;
  confirmError: string | null;
}) {
  const t = useT();
  const hasPartialMemory =
    result.memoryTotal > 0 && result.memoryWritten < result.memoryTotal;
  const totalEntries =
    result.memoryTotal === 1 ? t("agents.entry") : t("agents.entries");

  return (
    <div className="space-y-3 py-1">
      <p className="text-sm">
        {t("agents.createdSuccessfully", { name: result.displayName })}
      </p>

      {result.memoryTotal > 0 ? (
        hasPartialMemory ? (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
            data-testid="agent-snapshot-import-partial-memory"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-1">
              <p>
                {t("agents.memoryPartialRestore", {
                  written: result.memoryWritten,
                  total: result.memoryTotal,
                  entries: totalEntries,
                })}
              </p>
              {result.memoryErrors.length > 0 ? (
                <ul
                  className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs"
                  data-testid="agent-snapshot-import-memory-errors"
                >
                  {result.memoryErrors.map((err) => (
                    <li key={err} className="break-all font-mono">
                      {err}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : (
          <p
            className="text-xs text-muted-foreground"
            data-testid="agent-snapshot-import-memory-success"
          >
            {t("agents.memoryRestored", {
              count: result.memoryTotal,
              entries: totalEntries,
            })}
          </p>
        )
      ) : null}

      {result.profileSyncError ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("agents.profileSync", { message: result.profileSyncError })}
        </p>
      ) : null}

      {confirmError ? (
        <p className="text-xs text-destructive">{confirmError}</p>
      ) : null}
    </div>
  );
}
