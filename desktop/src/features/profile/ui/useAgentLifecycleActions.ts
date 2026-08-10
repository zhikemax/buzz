import * as React from "react";
import { toast } from "sonner";

import {
  isManagedAgentActive,
  respawnManagedAgentWithRules,
  startManagedAgentWithRules,
  stopManagedAgentWithRules,
} from "@/features/agents/lib/managedAgentControlActions";
import { clearActiveTurnsForAgentOnStop } from "@/features/agents/managedAgentRuntimeHooks";
import type { Channel, ManagedAgent, RelayAgent } from "@/shared/api/types";
import { useT } from "@/shared/i18n";

export function useAgentLifecycleActions({
  channels,
  managedAgent,
  relayAgents,
  startManagedAgent,
  stopManagedAgent,
}: {
  channels: readonly Channel[] | undefined;
  managedAgent: ManagedAgent | undefined;
  relayAgents: readonly RelayAgent[] | undefined;
  startManagedAgent: (pubkey: string) => Promise<unknown>;
  stopManagedAgent: (pubkey: string) => Promise<unknown>;
}) {
  const t = useT();
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
      await respawnManagedAgentWithRules({
        agent: managedAgent,
        startManagedAgent,
        stopManagedAgent,
        onStopped: () => clearActiveTurnsForAgentOnStop(managedAgent.pubkey),
      });
      toast.success(t("agents.restartedNamed", { name: managedAgent.name }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("agents.agentRestartFailed"),
      );
    }
  }, [managedAgent, startManagedAgent, stopManagedAgent, t]);

  return { handleAgentPrimaryAction, handleAgentRestart };
}
