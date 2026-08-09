import type { ManagedAgentBackend, RespondToMode } from "@/shared/api/types";
import type { MessageKey, TranslateFn } from "@/shared/i18n";

/**
 * Where an agent's process runs, as far as the calling surface can tell.
 *
 * Deliberately coarser than `ManagedAgentBackend`: the warning copy only needs
 * to know "this machine" vs "somewhere else", so surfaces resolve their own
 * backend shape down to this before handing it over. `null` means the surface
 * genuinely cannot tell — see `agentAccessWarningKey` for how that is
 * treated.
 */
export type AgentRunLocation = "local" | "remote";

/** Resolve a running agent's backend record. `null` when the backend is unknown. */
export function runLocationForBackend(
  backend: ManagedAgentBackend | null | undefined,
): AgentRunLocation | null {
  if (!backend) return null;
  return backend.type === "local" ? "local" : "remote";
}

/**
 * Resolve the create flow's `WhereToRunDraft.runOn`, which is `"local"` or a
 * discovered provider id. An empty string is treated as unknown rather than as
 * a provider, since `runOn` is typed `"local" | string`.
 */
export function runLocationForRunOn(
  runOn: string | null | undefined,
): AgentRunLocation | null {
  if (!runOn) return null;
  return runOn === "local" ? "local" : "remote";
}

/**
 * Message key for the shared-access warning in the respond-to field, or `null`
 * for modes that share nothing.
 *
 * Both `anyone` and `allowlist` hand the host's access to someone other than
 * the owner, so both warn; only the audience phrase differs.
 *
 * An unknown run location falls back to the same "your computer" wording as
 * `local` rather than hedging with "computer or server". A remote host is only
 * reachable when a `buzz-backend-*` provider binary is installed — without one
 * `WhereToRunSection`'s "Run on" selector never renders and every agent is
 * local — so hedging would name a concept most owners have never been shown.
 * When it *is* remote the owner picked that host from the selector
 * deliberately, so naming a server is meaningful there.
 */
export function agentAccessWarningKey(
  mode: RespondToMode,
  runLocation?: AgentRunLocation | null,
): MessageKey | null {
  if (mode !== "anyone" && mode !== "allowlist") return null;
  const isRemote = runLocation === "remote";
  if (mode === "anyone") {
    return isRemote
      ? "agents.access.anyoneRemote"
      : "agents.access.anyoneLocal";
  }
  return isRemote
    ? "agents.access.allowlistRemote"
    : "agents.access.allowlistLocal";
}

/** Localized warning copy, or `null` for modes that share nothing. */
export function agentAccessWarningText(
  mode: RespondToMode,
  runLocation: AgentRunLocation | null | undefined,
  t: TranslateFn,
): string | null {
  const key = agentAccessWarningKey(mode, runLocation);
  return key ? t(key) : null;
}
