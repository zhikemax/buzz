import * as React from "react";
import { toast } from "sonner";

import {
  isManagedAgentActive,
  respawnManagedAgentWithRules,
  startManagedAgentWithRules,
  stopManagedAgentWithRules,
} from "@/features/agents/lib/managedAgentControlActions";
import { agentPresenceStartBlockReason } from "@/features/agents/lib/useAgentAvailability";
import { clearActiveTurnsForAgentOnStop } from "@/features/agents/managedAgentRuntimeHooks";
import { isRelayRemovedError } from "@/features/agents/managedAgentRelayCleanup";
import { useCommunities } from "@/features/communities/useCommunities";
import type {
  Channel,
  ManagedAgent,
  PresenceStatus,
  RelayAgent,
} from "@/shared/api/types";
import { useT } from "@/shared/i18n";

export function useAgentLifecycleActions({
  availability,
  channels,
  managedAgent,
  relayAgents,
  startManagedAgent,
  stopManagedAgent,
}: {
  availability: PresenceStatus | undefined;
  channels: readonly Channel[] | undefined;
  managedAgent: ManagedAgent | undefined;
  relayAgents: readonly RelayAgent[] | undefined;
  startManagedAgent: (pubkey: string) => Promise<unknown>;
  stopManagedAgent: (pubkey: string) => Promise<unknown>;
}) {
  const t = useT();
  const relayUrl = useCommunities().activeCommunity?.relayUrl;
  const handleAgentPrimaryAction = React.useCallback(async () => {
    if (!managedAgent) return;

    try {
      if (isManagedAgentActive(managedAgent)) {
        const result = await stopManagedAgentWithRules({
          agent: managedAgent,
          channels: channels ?? [],
          relayAgents: relayAgents ?? [],
          stopManagedAgent,
          t,
        });
        if (managedAgent.backend.type === "local") {
          clearActiveTurnsForAgentOnStop(managedAgent.pubkey);
        }
        toast.success(
          result.noticeMessage ??
            t("agents.stoppedNamed", { name: managedAgent.name }),
        );
        return;
      }

      const blockReason = agentPresenceStartBlockReason(false, availability);
      if (blockReason) throw new Error(blockReason);
      await startManagedAgentWithRules({
        agent: managedAgent,
        startManagedAgent,
      });
      toast.success(
        managedAgent.backend.type === "provider"
          ? t("agents.deployingNamed", { name: managedAgent.name })
          : t("agents.startedNamed", { name: managedAgent.name }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("agents.agentActionFailed"),
      );
    }
  }, [
    availability,
    channels,
    managedAgent,
    relayAgents,
    startManagedAgent,
    stopManagedAgent,
    t,
  ]);

  const handleAgentRestart = React.useCallback(async () => {
    if (!managedAgent) return;

    try {
      const blockReason = agentPresenceStartBlockReason(
        isManagedAgentActive(managedAgent),
        availability,
      );
      if (blockReason) throw new Error(blockReason);
      await respawnManagedAgentWithRules({
        agent: managedAgent,
        relayUrl,
        startManagedAgent,
        stopManagedAgent,
        onStopped: () => clearActiveTurnsForAgentOnStop(managedAgent.pubkey),
      });
      toast.success(t("agents.restartedNamed", { name: managedAgent.name }));
    } catch (error) {
      if (isRelayRemovedError(error)) return;
      toast.error(
        error instanceof Error
          ? error.message
          : t("agents.agentRestartFailed"),
      );
    }
  }, [
    availability,
    managedAgent,
    relayUrl,
    startManagedAgent,
    stopManagedAgent,
    t,
  ]);

  return { handleAgentPrimaryAction, handleAgentRestart };
}
