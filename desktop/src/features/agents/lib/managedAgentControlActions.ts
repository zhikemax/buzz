import { sendChannelMessage } from "@/shared/api/tauri";
import type { Channel, ManagedAgent, RelayAgent } from "@/shared/api/types";
import type { TranslateFn } from "@/shared/i18n";
import { normalizePubkey } from "@/shared/lib/pubkey";
import type { AgentAvailabilityReader } from "./useAgentAvailability";

type DeleteManagedAgentInput = {
  pubkey: string;
  forceRemoteDelete?: boolean;
};

type StartManagedAgent = (pubkey: string) => Promise<unknown>;
type StopManagedAgent = (pubkey: string) => Promise<unknown>;
type DeleteManagedAgent = (input: DeleteManagedAgentInput) => Promise<unknown>;

type ManagedAgentChannelContext = {
  channels: readonly Channel[];
  preferredChannelId?: string | null;
  relayAgents: readonly RelayAgent[];
};

type ManagedAgentActionContext = ManagedAgentChannelContext & {
  getAvailability: AgentAvailabilityReader;
};

export type ManagedAgentActionResult = {
  cancelled?: boolean;
  noticeMessage?: string;
};

/** Lifecycle action routing only; deployed is a retained receipt, not presence. */
export function isManagedAgentActive(agent: Pick<ManagedAgent, "status">) {
  return agent.status === "running" || agent.status === "deployed";
}

export function getManagedAgentPrimaryActionLabel(
  agent: ManagedAgent,
  t: TranslateFn,
) {
  if (agent.backend.type === "provider") {
    return isManagedAgentActive(agent)
      ? t("agents.shutdown")
      : t("agents.deploy");
  }

  if (isManagedAgentActive(agent)) {
    return t("agents.stop");
  }

  return agent.status === "stopped"
    ? t("agents.restartAgent")
    : t("agents.startAgent");
}

export function resolveManagedAgentChannelId(
  agent: Pick<ManagedAgent, "pubkey">,
  context: ManagedAgentChannelContext,
) {
  if (context.preferredChannelId) {
    return context.preferredChannelId;
  }

  const relayAgent = context.relayAgents.find(
    (candidate) =>
      normalizePubkey(candidate.pubkey) === normalizePubkey(agent.pubkey),
  );

  if (relayAgent?.channelIds?.length) {
    return relayAgent.channelIds[0];
  }

  const channelName = relayAgent?.channels?.[0];
  if (!channelName) {
    return null;
  }

  const matches = context.channels.filter(
    (channel) => channel.name === channelName,
  );
  return matches.length === 1 ? matches[0].id : null;
}

export async function startManagedAgentWithRules({
  agent,
  startManagedAgent,
}: {
  agent: ManagedAgent;
  startManagedAgent: StartManagedAgent;
}) {
  // Relay-mesh agents are no longer blocked here: the backend start preflight
  // (ensure_relay_mesh_for_record) re-resolves a live serve target and dials
  // it, failing with an actionable error when no peer serves the model.
  await startManagedAgent(agent.pubkey);
}

export async function respawnManagedAgentWithRules({
  agent,
  startManagedAgent,
  stopManagedAgent,
  onStopped,
}: {
  agent: ManagedAgent;
  startManagedAgent: StartManagedAgent;
  stopManagedAgent: StopManagedAgent;
  /** Called after a successful stop and before start begins — use this to
   * clear stale working badges at the right boundary. */
  onStopped?: () => void;
}) {
  if (agent.backend.type === "local" && isManagedAgentActive(agent)) {
    await stopManagedAgent(agent.pubkey);
    onStopped?.();
  }

  await startManagedAgent(agent.pubkey);
}

export async function stopManagedAgentWithRules({
  agent,
  channels,
  preferredChannelId,
  relayAgents,
  stopManagedAgent,
  t,
}: {
  agent: ManagedAgent;
  stopManagedAgent: StopManagedAgent;
  t: TranslateFn;
} & ManagedAgentChannelContext): Promise<ManagedAgentActionResult> {
  if (agent.backend.type === "provider") {
    const channelId = resolveManagedAgentChannelId(agent, {
      channels,
      preferredChannelId,
      relayAgents,
    });
    if (!channelId) {
      throw new Error(t("agents.cannotStopNotInChannel"));
    }

    await sendChannelMessage(channelId, "!shutdown", undefined, undefined, [
      agent.pubkey,
    ]);
    return {
      noticeMessage: t("agents.shutdownRequestedNotConfirmed"),
    };
  }

  await stopManagedAgent(agent.pubkey);
  return {};
}

export async function deleteManagedAgentWithRules({
  agent,
  channels,
  deleteManagedAgent,
  preferredChannelId,
  getAvailability,
  relayAgents,
  skipRemoteDeleteConfirm = false,
  t,
}: {
  agent: ManagedAgent;
  deleteManagedAgent: DeleteManagedAgent;
  skipRemoteDeleteConfirm?: boolean;
  t: TranslateFn;
} & ManagedAgentActionContext): Promise<ManagedAgentActionResult> {
  if (agent.backend.type === "provider" && agent.backendAgentId) {
    const availability = getAvailability(agent.pubkey);
    const channelId = resolveManagedAgentChannelId(agent, {
      channels,
      preferredChannelId,
      relayAgents,
    });

    if (channelId) {
      // Only established Offline preserves the intentional no-request path.
      // Unknown is not evidence that shutdown can safely be skipped.
      if (availability !== "offline") {
        await sendChannelMessage(channelId, "!shutdown", undefined, undefined, [
          agent.pubkey,
        ]);

        if (!skipRemoteDeleteConfirm) {
          const confirmed = window.confirm(
            (availability === undefined
              ? t("agents.confirmDeleteAvailabilityUnknown")
              : "") +
              t("agents.confirmDeleteAfterShutdownRequested"),
          );
          if (!confirmed) {
            return { cancelled: true };
          }
        }
      } else {
        if (!skipRemoteDeleteConfirm) {
          const confirmed = window.confirm(
            t("agents.confirmDeleteOfflineRemote"),
          );
          if (!confirmed) {
            return { cancelled: true };
          }
        }
      }
    } else {
      if (!skipRemoteDeleteConfirm) {
        const confirmed = window.confirm(
          t("agents.confirmDeleteDeployedNoChannel"),
        );
        if (!confirmed) {
          return { cancelled: true };
        }
      }
    }
  }

  const isDeployedRemote =
    agent.backend.type === "provider" && agent.backendAgentId;
  await deleteManagedAgent({
    pubkey: agent.pubkey,
    forceRemoteDelete: isDeployedRemote ? true : undefined,
  });

  return {};
}
