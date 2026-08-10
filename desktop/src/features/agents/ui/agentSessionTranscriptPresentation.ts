import type { MessageKey, TranslateFn } from "@/shared/i18n";
import type { TranscriptItem } from "./agentSessionTypes";
import { buildCompactToolSummary } from "./agentSessionToolSummary";

/**
 * Whether a polished activity row should render the opt-in timestamp footer.
 * User message bubbles already render their own timestamp footer, so they are
 * excluded to avoid doubling up. Compact previews stay dense regardless of
 * the preference.
 */
export function shouldShowTranscriptRowTimestamp(
  item: TranscriptItem,
  options: { enabled: boolean; variant: string },
): boolean {
  if (!options.enabled || options.variant === "compactPreview") {
    return false;
  }
  if (item.type === "message" && item.role !== "assistant") {
    return false;
  }
  return true;
}

const LIFECYCLE_NOISE = new Set([
  "turn started",
  "session ready",
  "wire parse error",
]);

/** English titles stored on transcript items → display locale. */
const TRANSCRIPT_TITLE_KEYS: Record<string, MessageKey> = {
  Thinking: "agents.activityThinking",
  Plan: "agents.activityPlan",
  "Plan updated": "agents.activityPlanUpdated",
  "Prompt context": "agents.promptContext",
  "System prompt": "agents.activitySystemPrompt",
  "Turn started": "agents.activityTurnStarted",
  "Session ready": "agents.activitySessionReady",
  "Wire parse error": "agents.activityWireParseError",
  "Turn error": "agents.activityTurnError",
  "Agent error (crash)": "agents.activityAgentCrash",
  "Permission requested": "agents.activityPermissionRequested",
  Mode: "agents.activityMode",
  Usage: "agents.activityUsage",
  Commands: "agents.activityCommands",
};

/** Localize a stored English transcript title for display / headlines. */
export function localizeTranscriptActivityTitle(
  title: string,
  t: TranslateFn,
): string {
  const key = TRANSCRIPT_TITLE_KEYS[title];
  return key ? t(key) : title;
}

/** Human-readable headline for a single transcript item. */
export function getActivityHeadline(
  item: TranscriptItem,
  t: TranslateFn,
): string | null {
  if (item.type === "tool") {
    const summary = buildCompactToolSummary(item, t);
    return [summary.label, summary.preview].filter(Boolean).join(" · ");
  }

  if (item.type === "message") {
    if (item.role === "assistant") {
      const trimmed = item.text.trim();
      if (trimmed.length > 0) {
        const firstLine = trimmed.split("\n")[0]?.trim() ?? "";
        if (firstLine.length > 0) {
          return firstLine.length > 72
            ? `${firstLine.slice(0, 69)}…`
            : firstLine;
        }
      }
      return t("agents.activityResponding");
    }
    return item.title
      ? localizeTranscriptActivityTitle(item.title, t)
      : t("agents.activityUserPrompt");
  }

  if (item.type === "thought") {
    return localizeTranscriptActivityTitle(item.title, t);
  }

  if (item.type === "metadata") {
    return localizeTranscriptActivityTitle(item.title, t);
  }

  return localizeTranscriptActivityTitle(item.title, t);
}

function isLifecycleNoise(
  item: Extract<TranscriptItem, { type: "lifecycle" }>,
) {
  return LIFECYCLE_NOISE.has(item.title.toLowerCase());
}

/** Whether an item should contribute to the headline scan (noise gate). */
export function isMeaningfulItem(item: TranscriptItem): boolean {
  if (item.type === "tool" && item.renderClass === "suppressed") {
    return false;
  }
  if (item.type === "lifecycle") {
    return !isLifecycleNoise(item);
  }
  if (item.type === "metadata") {
    // Raw JSON-RPC frames ("Raw ACP payload") are infrastructure noise; all
    // other metadata items (system prompt, prompt context) are semantically
    // meaningful and visible in the feed.
    return item.acpSource !== "raw_json_rpc";
  }
  return true;
}

/**
 * Whether an item is "spine" work — eligible to headline over setup/context.
 * Tools, messages, thoughts, plans, and meaningful lifecycle events qualify.
 * Metadata items (system prompt, prompt context) are reads that should recede
 * when real work is present; they are NOT spine items.
 *
 * Used by BotActivityBar for the two-tier headline scan:
 * 1. Collect spine headlines first.
 * 2. If none found, fall back to including metadata so the bar isn't empty at
 *    session start / idle.
 */
export function isSpineItem(item: TranscriptItem): boolean {
  if (!isMeaningfulItem(item)) return false;
  return item.type !== "metadata";
}
