import { toast } from "sonner";

import { attachManagedAgentToChannel } from "./channelAgents";
import type { Channel, CreateManagedAgentResponse } from "@/shared/api/types";
import { useT, type TranslateFn } from "@/shared/i18n";

type TargetChannel = Pick<Channel, "id" | "name">;

async function attach(
  created: CreateManagedAgentResponse,
  targetChannel: TargetChannel,
) {
  const attached = await attachManagedAgentToChannel(targetChannel.id, {
    agent: created.agent,
    role: "bot",
    ensureRunning: true,
  });
  created.agent = attached.agent;
}

function showAttachmentFailure(
  created: CreateManagedAgentResponse,
  targetChannel: TargetChannel,
  cause: unknown,
  t: TranslateFn,
  toastId?: string | number,
) {
  const error =
    cause instanceof Error ? cause.message : t("agents.failedAddAgent");
  const id = toast.warning(t("agents.agentCreated"), {
    description: t("agents.couldntAddToChannel", {
      name: created.agent.name,
      channel: targetChannel.name,
      error,
    }),
    id: toastId,
    action: {
      label: t("settings.tryAgain"),
      onClick: (event) => {
        event.preventDefault();
        toast.loading(t("agents.agentCreated"), {
          description: t("agents.addingToChannel", {
            name: created.agent.name,
            channel: targetChannel.name,
          }),
          id,
        });
        void attach(created, targetChannel).then(
          () => {
            toast.success(t("agents.agentCreated"), {
              description: t("agents.addedToChannelShort", {
                name: created.agent.name,
                channel: targetChannel.name,
              }),
              id,
            });
          },
          (retryCause: unknown) => {
            showAttachmentFailure(created, targetChannel, retryCause, t, id);
          },
        );
      },
    },
  });
}

/** Keeps creation successful when its optional channel attachment fails. */
export function useCreatedAgentChannelAttachment() {
  const t = useT();

  async function presentCreatedAgent(
    created: CreateManagedAgentResponse,
    targetChannel?: TargetChannel | null,
  ) {
    if (created.spawnError || !targetChannel) {
      toast.success(t("agents.agentCreated"));
      return;
    }

    try {
      await attach(created, targetChannel);
      toast.success(t("agents.agentCreated"));
    } catch (cause) {
      showAttachmentFailure(created, targetChannel, cause, t);
    }
  }

  return { presentCreatedAgent };
}
