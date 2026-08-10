import { AlertCircle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

import { useT } from "@/shared/i18n";
import { formatTranscriptTimestampTitle } from "../agentSessionUtils";
import { localizeTranscriptActivityTitle } from "../agentSessionTranscriptPresentation";
import { ActivityRow, ActivityRowLabel } from "./ActivityRow";
import { ToolActivity } from "./ToolActivity";
import type { ActivityRenderClassItemProps } from "./types";

/**
 * Split the permission item's text into the request description lines and the
 * options line.  The text is newline-joined by describePermissionRequest:
 *   [request title?] [toolCallId?] ["Options: ..."]
 * We surface the options line separately so the render can style it distinctly.
 */
function splitPermissionText(text: string): {
  requestLines: string;
  optionsLine: string | null;
} {
  const lines = text.split("\n");
  const optionsIdx = lines.findIndex((l) => l.startsWith("Options: "));
  if (optionsIdx === -1) {
    return { requestLines: text, optionsLine: null };
  }
  return {
    requestLines: lines.slice(0, optionsIdx).join("\n"),
    optionsLine: lines[optionsIdx],
  };
}

function localizePermissionRequestLines(
  requestLines: string,
  t: ReturnType<typeof useT>,
): string {
  return requestLines
    .split("\n")
    .map((line) => {
      if (line.startsWith("Tool call: ")) {
        return t("agents.permissionToolCall", {
          id: line.slice("Tool call: ".length),
        });
      }
      return line;
    })
    .join("\n");
}

function localizePermissionOptionsLine(
  optionsLine: string,
  t: ReturnType<typeof useT>,
): string {
  if (optionsLine.startsWith("Options: ")) {
    return t("agents.permissionOptions", {
      options: optionsLine.slice("Options: ".length),
    });
  }
  return optionsLine;
}

/**
 * Derive the visual tone and icon for a resolved permission outcome string.
 * Outcome strings come from describePermissionOutcome:
 *   "Approved (...)" | "Denied (...)" | "Cancelled"
 */
function permissionOutcomeTone(outcome: string): "approve" | "deny" | "cancel" {
  if (outcome.startsWith("Approved")) return "approve";
  if (outcome.startsWith("Denied")) return "deny";
  return "cancel";
}

function localizePermissionOutcome(
  outcome: string,
  t: ReturnType<typeof useT>,
): string {
  if (outcome === "Cancelled") {
    return t("agents.permissionCancelled");
  }
  const approved = /^Approved \((.+)\)$/.exec(outcome);
  if (approved) {
    return t("agents.permissionApproved", { kind: approved[1] });
  }
  const denied = /^Denied \((.+)\)$/.exec(outcome);
  if (denied) {
    return t("agents.permissionDenied", { kind: denied[1] });
  }
  return outcome;
}

export function LifecycleActivity(props: ActivityRenderClassItemProps) {
  const t = useT();
  if (props.item.type === "tool") {
    return <ToolActivity {...props} />;
  }
  if (props.item.type !== "lifecycle") {
    return null;
  }

  const localizedTitle = localizeTranscriptActivityTitle(props.item.title, t);
  const isError =
    props.item.renderClass === "error" ||
    props.item.title.toLowerCase().includes("error");
  const isPermission = props.item.renderClass === "permission";
  const timestampTitle = formatTranscriptTimestampTitle(props.item.timestamp);

  if (isPermission) {
    const { requestLines, optionsLine } = splitPermissionText(props.item.text);
    const localizedRequestLines = localizePermissionRequestLines(
      requestLines,
      t,
    );
    const localizedOptionsLine = optionsLine
      ? localizePermissionOptionsLine(optionsLine, t)
      : null;
    const outcome = props.item.outcome;
    const tone = outcome ? permissionOutcomeTone(outcome) : null;
    const localizedOutcome = outcome
      ? localizePermissionOutcome(outcome, t)
      : null;
    return (
      <div
        className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-left text-xs text-amber-700 dark:text-amber-400"
        data-testid="transcript-permission-item"
        title={timestampTitle}
      >
        {/* Row 1: request */}
        <div>
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
          <span className="font-medium">{localizedTitle}</span>
          {localizedRequestLines ? (
            <span className="opacity-80"> · {localizedRequestLines}</span>
          ) : null}
        </div>
        {/* Row 2: options (muted sub-line) */}
        {localizedOptionsLine ? (
          <div className="mt-0.5 pl-5 opacity-60">{localizedOptionsLine}</div>
        ) : null}
        {/* Row 3: decision — only when outcome is resolved */}
        {localizedOutcome && tone ? (
          <>
            <div className="my-1 border-t border-amber-500/20" />
            <div
              className={
                tone === "approve"
                  ? "flex items-center gap-1 font-medium text-green-600 dark:text-green-400"
                  : tone === "deny"
                    ? "flex items-center gap-1 font-medium text-destructive"
                    : "flex items-center gap-1 font-medium text-muted-foreground"
              }
              data-testid="transcript-permission-outcome"
            >
              {tone === "approve" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : tone === "deny" ? (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 opacity-50" />
              )}
              {localizedOutcome}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-left text-xs text-destructive"
        data-testid="transcript-lifecycle-item"
        title={timestampTitle}
      >
        <AlertCircle className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" />
        <span className="font-medium">{localizedTitle}</span>
        {props.item.text ? (
          <span className="opacity-80"> · {props.item.text}</span>
        ) : null}
      </div>
    );
  }

  return (
    <ActivityRow testId="transcript-lifecycle-item" title={timestampTitle}>
      <ActivityRowLabel
        object={props.item.text || undefined}
        openToneScope="none"
        verb={localizedTitle}
      />
    </ActivityRow>
  );
}
