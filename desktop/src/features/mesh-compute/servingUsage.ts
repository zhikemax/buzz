import type { MeshServingUsage } from "@/shared/api/tauriMesh";
import type { MessageKey } from "@/shared/i18n";

/**
 * Pure projection of host-side serving usage into a small, politely-worded
 * indicator model for the Share compute card.
 *
 * Single source of truth for "who is using the compute I'm sharing" copy, so
 * the component and its tests agree. Kept pure/total (accepts null = not yet
 * fetched) and defensive (all fields optional-safe via the Rust extractor).
 *
 * Distinctions that matter:
 * - `localAttempts` = this machine's OWN agents using the local model. Not a
 *   "someone else is here" signal — surfaced softly as activity, not as a peer.
 * - `remoteAttempts` / `endpointAttempts` = another member consuming this
 *   machine's compute. THIS is the "someone connected to what I'm sharing"
 *   signal.
 */
export type MeshServingIndicator = {
  /** Whether to show anything at all (only while actively sharing). */
  show: boolean;
  /** Someone is being served right now. */
  active: boolean;
  /** A non-local member is (or has been) consuming this machine's compute. */
  hasRemoteConsumers: boolean;
  /** One-line status key suitable for the card. */
  labelKey: MessageKey | null;
  labelParams?: Record<string, string | number>;
  /** Longer detail key for a tooltip / secondary line. */
  detailKey: MessageKey | null;
  detailParams?: Record<string, string | number>;
};

/**
 * @param usage  latest snapshot from `meshServingUsage`, or null if not fetched
 * @param isSharing  whether this machine is currently in serve mode (card owns
 *                   this from the toggle model). Usage is only meaningful while
 *                   sharing.
 */
export function deriveServingIndicator(
  usage: MeshServingUsage | null,
  isSharing: boolean,
): MeshServingIndicator {
  const hidden: MeshServingIndicator = {
    show: false,
    active: false,
    hasRemoteConsumers: false,
    labelKey: null,
    detailKey: null,
  };
  if (!isSharing || !usage) {
    return hidden;
  }

  const hasRemoteConsumers =
    usage.remoteAttempts > 0 || usage.endpointAttempts > 0;
  const active = usage.inflight > 0;
  const tok = Math.round(usage.tokensPerSecond);

  // Remote consumer present (or seen) — the headline case the user asked for.
  if (hasRemoteConsumers) {
    const remote = usage.remoteAttempts + usage.endpointAttempts;
    const labelKey: MessageKey = active
      ? "settings.compute.usage.inUseLive"
      : remote === 1
        ? "settings.compute.usage.usedByMember"
        : "settings.compute.usage.usedByMemberPlural";
    const labelParams = {
      count: active ? usage.inflight : remote,
    };
    if (usage.peers > 0) {
      return {
        show: true,
        active,
        hasRemoteConsumers: true,
        labelKey,
        labelParams,
        detailKey:
          usage.peers === 1
            ? "settings.compute.usage.peersDetail"
            : "settings.compute.usage.peersDetailPlural",
        detailParams: { peers: usage.peers, tok },
      };
    }
    return {
      show: true,
      active,
      hasRemoteConsumers: true,
      labelKey,
      labelParams,
      detailKey: "settings.compute.usage.tokDetail",
      detailParams: { tok },
    };
  }

  // Only local (this machine's own agents) — show softly as activity.
  if (active) {
    return {
      show: true,
      active: true,
      hasRemoteConsumers: false,
      labelKey: "settings.compute.usage.servingLocal",
      labelParams: { count: usage.inflight },
      detailKey: "settings.compute.usage.tokDetail",
      detailParams: { tok },
    };
  }
  if (usage.requestsServed > 0) {
    return {
      show: true,
      active: false,
      hasRemoteConsumers: false,
      labelKey: "settings.compute.usage.idleNow",
      detailKey:
        usage.requestsServed === 1
          ? "settings.compute.usage.servedSession"
          : "settings.compute.usage.servedSessionPlural",
      detailParams: { count: usage.requestsServed },
    };
  }

  // Sharing but nothing served yet.
  return {
    show: true,
    active: false,
    hasRemoteConsumers: false,
    labelKey: "settings.compute.usage.idleYet",
    detailKey: null,
  };
}
