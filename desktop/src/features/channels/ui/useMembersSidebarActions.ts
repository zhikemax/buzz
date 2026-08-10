import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useStartManagedAgentMutation,
  useStopManagedAgentMutation,
} from "@/features/agents/hooks";
import {
  respawnManagedAgentWithRules,
  isManagedAgentActive,
  startManagedAgentWithRules,
  stopManagedAgentWithRules,
} from "@/features/agents/lib/managedAgentControlActions";
import {
  clearActiveTurnsForAgentOnStop,
  useManagedAgentRuntimeAction,
} from "@/features/agents/managedAgentRuntimeHooks";
import { managedAgentPairAction } from "@/features/agents/managedAgentRuntimeStatus";
import {
  channelsQueryKey,
  useRemoveChannelMemberMutation,
} from "@/features/channels/hooks";
import { removeChannelMember } from "@/shared/api/tauri";
import type {
  ChannelMember,
  ManagedAgent,
  ManagedAgentRuntimeStatus,
} from "@/shared/api/types";
import { useT, type TranslateFn } from "@/shared/i18n";

type UseMembersSidebarActionsOptions = {
  channelId: string | null;
  controllableManagedBots: readonly ManagedAgent[];
  removableManagedBots: readonly ManagedAgent[];
  currentPubkey?: string;
  onOpenChange: (open: boolean) => void;
  /** Active community relay. When set, local-agent lifecycle actions are
   * scoped to this agent+community pair instead of the whole agent. */
  relayUrl?: string;
};

type BulkAgentActionResult = {
  cancelled?: boolean;
};

const EMPTY_AGENT_CONTEXT = {
  channels: [],
  relayAgents: [],
} as const;

export function useMembersSidebarActions({
  channelId,
  controllableManagedBots,
  removableManagedBots,
  currentPubkey,
  onOpenChange,
  relayUrl,
}: UseMembersSidebarActionsOptions) {
  const t = useT();
  const queryClient = useQueryClient();
  const removeMemberMutation = useRemoveChannelMemberMutation(channelId);
  const startManagedAgentMutation = useStartManagedAgentMutation();
  const stopManagedAgentMutation = useStopManagedAgentMutation();
  const runtimeActionMutation = useManagedAgentRuntimeAction();
  const [actionNoticeMessage, setActionNoticeMessage] = React.useState<
    string | null
  >(null);
  const [actionErrorMessage, setActionErrorMessage] = React.useState<
    string | null
  >(null);
  const [activeActionKey, setActiveActionKey] = React.useState<string | null>(
    null,
  );

  const stoppableManagedBots = React.useMemo(
    () =>
      controllableManagedBots.filter((agent) => isManagedAgentActive(agent)),
    [controllableManagedBots],
  );

  const isActionPending =
    activeActionKey !== null ||
    removeMemberMutation.isPending ||
    startManagedAgentMutation.isPending ||
    stopManagedAgentMutation.isPending ||
    runtimeActionMutation.isPending;

  const clearActionFeedback = React.useCallback(() => {
    setActionNoticeMessage(null);
    setActionErrorMessage(null);
  }, []);

  async function runBulkAgentAction({
    action,
    actionKey,
    agents,
    failureMessage,
    onSettled,
    successMessage,
  }: {
    action: (agent: ManagedAgent) => Promise<BulkAgentActionResult | undefined>;
    actionKey: string;
    agents: readonly ManagedAgent[];
    failureMessage: string;
    onSettled?: () => Promise<void>;
    successMessage: (count: number) => string;
  }) {
    clearActionFeedback();
    setActiveActionKey(actionKey);
    const failures: Array<{ error: string; name: string }> = [];
    let successCount = 0;

    try {
      for (const agent of agents) {
        try {
          const result = await action(agent);
          if (result?.cancelled) {
            break;
          }

          successCount += 1;
        } catch (error) {
          failures.push({
            error: error instanceof Error ? error.message : failureMessage,
            name: agent.name,
          });
        }
      }

      if (successCount > 0) {
        setActionNoticeMessage(successMessage(successCount));
      }

      const failureSummary = formatFailureSummary(failures);
      if (failureSummary) {
        setActionErrorMessage(failureSummary);
      }
    } finally {
      if (onSettled) {
        await onSettled();
      }
      setActiveActionKey(null);
    }
  }

  async function handleLifecycleAction(
    agent: ManagedAgent,
    runtime?: ManagedAgentRuntimeStatus,
  ) {
    clearActionFeedback();
    setActiveActionKey(`agent:${agent.pubkey}`);

    try {
      // Local agents run one harness per agent+community pair. Scope the
      // action to the active community so stopping the agent here never
      // touches its runtimes in other communities. Provider agents keep the
      // agent-wide deploy/!shutdown flow below.
      if (agent.backend.type === "local" && relayUrl) {
        const action = managedAgentPairAction(runtime);
        await runtimeActionMutation.mutateAsync({
          action,
          pubkey: agent.pubkey,
          relayUrl,
        });
        setActionNoticeMessage(
          action === "stop"
            ? t("agents.stoppedNamedInCommunity", { name: agent.name })
            : action === "restart"
              ? t("agents.restartedNamedInCommunity", { name: agent.name })
              : t("agents.startedNamedInCommunity", { name: agent.name }),
        );
        return;
      }

      if (isManagedAgentActive(agent)) {
        await stopManagedAgentWithRules({
          agent,
          ...EMPTY_AGENT_CONTEXT,
          preferredChannelId: channelId,
          stopManagedAgent: stopManagedAgentMutation.mutateAsync,
          t,
        });
        if (agent.backend.type === "local") {
          clearActiveTurnsForAgentOnStop(agent.pubkey);
        }
        setActionNoticeMessage(
          agent.backend.type === "provider"
            ? t("agents.shutdownSentToNamed", { name: agent.name })
            : t("agents.stoppedNamed", { name: agent.name }),
        );
        return;
      }

      await startManagedAgentWithRules({
        agent,
        startManagedAgent: startManagedAgentMutation.mutateAsync,
      });
      setActionNoticeMessage(getLifecycleSuccessMessage(agent, t));
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error
          ? error.message
          : t("agents.failedControlAgent"),
      );
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleRespawnAll() {
    await runBulkAgentAction({
      action: async (agent) => {
        await respawnManagedAgentWithRules({
          agent,
          startManagedAgent: startManagedAgentMutation.mutateAsync,
          stopManagedAgent: stopManagedAgentMutation.mutateAsync,
          onStopped: () => clearActiveTurnsForAgentOnStop(agent.pubkey),
        });
        return undefined;
      },
      actionKey: "bulk-respawn",
      agents: controllableManagedBots,
      failureMessage: t("agents.failedRespawnAgent"),
      successMessage: (count) =>
        count === 1
          ? t("agents.spawnedOrRespawnedCountOne")
          : t("agents.spawnedOrRespawnedCountMany", { count }),
    });
  }

  async function handleStopAll() {
    await runBulkAgentAction({
      action: async (agent) => {
        const result = await stopManagedAgentWithRules({
          agent,
          ...EMPTY_AGENT_CONTEXT,
          preferredChannelId: channelId,
          stopManagedAgent: stopManagedAgentMutation.mutateAsync,
          t,
        });
        if (agent.backend.type === "local") {
          clearActiveTurnsForAgentOnStop(agent.pubkey);
        }
        return result;
      },
      actionKey: "bulk-stop",
      agents: stoppableManagedBots,
      failureMessage: t("agents.failedStopAgent"),
      successMessage: (count) =>
        count === 1
          ? t("agents.stoppedOrShutdownCountOne")
          : t("agents.stoppedOrShutdownCountMany", { count }),
    });
  }

  async function handleRemoveAll() {
    await runBulkAgentAction({
      action: async (agent) => {
        await removeManagedBotMembership(agent.pubkey);
        return undefined;
      },
      actionKey: "bulk-remove",
      agents: removableManagedBots,
      failureMessage: t("agents.failedRemoveBotFromChannel"),
      onSettled: invalidateSidebarQueries,
      successMessage: (count) =>
        count === 1
          ? t("agents.removedManagedBotsCountOne")
          : t("agents.removedManagedBotsCountMany", { count }),
    });
  }

  const handleRemoveMember = React.useCallback(
    (member: ChannelMember) => {
      clearActionFeedback();
      setActiveActionKey(`remove:${member.pubkey}`);
      void removeMemberMutation
        .mutateAsync(member.pubkey)
        .then(() => {
          if (member.pubkey === currentPubkey) {
            onOpenChange(false);
          }
        })
        .catch((error: unknown) => {
          setActionErrorMessage(
            error instanceof Error
              ? error.message
              : t("agents.failedRemoveMember"),
          );
        })
        .finally(() => {
          setActiveActionKey(null);
        });
    },
    [
      clearActionFeedback,
      currentPubkey,
      onOpenChange,
      removeMemberMutation,
      t,
    ],
  );

  async function removeManagedBotMembership(pubkey: string) {
    if (!channelId) {
      throw new Error("No channel selected.");
    }

    await removeChannelMember(channelId, pubkey);
  }

  async function invalidateSidebarQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: channelsQueryKey }),
      channelId
        ? queryClient.invalidateQueries({ queryKey: ["channels", channelId] })
        : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ["managed-agents"] }),
      queryClient.invalidateQueries({ queryKey: ["relay-agents"] }),
    ]);
  }

  return {
    actionErrorMessage,
    actionNoticeMessage,
    handleLifecycleAction,
    handleRemoveAll,
    handleRemoveMember,
    handleRespawnAll,
    handleStopAll,
    isActionPending,
    hasControllableManagedBots: controllableManagedBots.length > 0,
    hasRemovableManagedBots: removableManagedBots.length > 0,
    hasStoppableManagedBots: stoppableManagedBots.length > 0,
  };
}

function getLifecycleSuccessMessage(
  agent: ManagedAgent,
  t: TranslateFn,
) {
  if (agent.backend.type === "provider") {
    return t("agents.deployedNamed", { name: agent.name });
  }

  return agent.status === "stopped"
    ? t("agents.respawnedNamed", { name: agent.name })
    : t("agents.spawnedNamed", { name: agent.name });
}

function formatFailureSummary(
  failures: Array<{
    error: string;
    name: string;
  }>,
) {
  if (failures.length === 0) {
    return null;
  }

  if (failures.length === 1) {
    const [failure] = failures;
    return `${failure.name}: ${failure.error}`;
  }

  return failures
    .map((failure) => `${failure.name}: ${failure.error}`)
    .join("; ");
}
