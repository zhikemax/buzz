import * as React from "react";
import { Bot, Plus, Sparkles, UserPlus } from "lucide-react";

import {
  getChannelIntroDescription,
  getChannelIntroKind,
} from "@/features/channels/ui/ChannelPane.helpers";
import {
  isWelcomeChannel,
  isWelcomeExperienceChannel,
} from "@/features/onboarding/welcome";
import type { Channel } from "@/shared/api/types";
import { useT } from "@/shared/i18n";
import { HashSearch } from "@/shared/ui/icons";

type ChannelIntroAction = {
  description?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  testId?: string;
};

/**
 * Builds the empty-channel intro block (heading, description, action cards)
 * for the channel timeline. The Welcome channel gets its onboarding trio
 * (browse / create channel / create agent); other channels get contextual
 * member actions.
 */
export function useChannelIntro({
  activeChannel,
  onAddAgent,
  onBrowseChannels,
  onCreateChannel,
  onOpenMembers,
  onWelcomeAddAgent,
}: {
  activeChannel: Channel | null;
  onAddAgent?: (options?: { beforeSend?: () => void }) => void;
  onBrowseChannels?: () => void;
  onCreateChannel?: () => void;
  onOpenMembers?: () => void;
  onWelcomeAddAgent?: () => void;
}) {
  const t = useT();

  return React.useMemo(() => {
    if (!activeChannel || activeChannel.channelType === "dm") {
      return null;
    }

    const actions: ChannelIntroAction[] = [];
    if (isWelcomeExperienceChannel(activeChannel)) {
      if (onBrowseChannels) {
        actions.push({
          icon: <HashSearch aria-hidden className="h-6 w-6" />,
          label: t("channel.introBrowse"),
          onClick: onBrowseChannels,
          testId: "welcome-intro-action-browse-channels",
        });
      }

      if (onCreateChannel) {
        actions.push({
          icon: <Plus aria-hidden className="h-6 w-6" />,
          label: t("channel.introCreateChannel"),
          onClick: onCreateChannel,
          testId: "welcome-intro-action-create-channel",
        });
      }

      if (onWelcomeAddAgent) {
        actions.push({
          icon: <Bot aria-hidden className="h-6 w-6" />,
          label: t("channel.introCreateAgent"),
          onClick: onWelcomeAddAgent,
          testId: "welcome-intro-action-create-agent",
        });
      }

      return {
        actions,
        channelKindLabel: isWelcomeChannel(activeChannel)
          ? t("channel.privateWelcome")
          : getChannelIntroKind(activeChannel),
        channelName: activeChannel.name,
        description: isWelcomeChannel(activeChannel)
          ? null
          : getChannelIntroDescription(activeChannel),
        icon: <Sparkles aria-hidden className="h-7 w-7" />,
      };
    }

    if (!activeChannel.archivedAt && activeChannel.isMember) {
      if (onAddAgent) {
        actions.push({
          description: t("channel.introAddAgent"),
          icon: <Bot aria-hidden className="h-6 w-6" />,
          label: t("channel.introCreateAgentShort"),
          onClick: onAddAgent,
          testId: "channel-intro-action-create-agent",
        });
      }

      if (onOpenMembers) {
        actions.push({
          description: t("channel.introInviteMembers"),
          icon: <UserPlus aria-hidden className="h-6 w-6" />,
          label: t("channel.introAddPeople"),
          onClick: onOpenMembers,
          testId: "channel-intro-action-add-people",
        });
      }
    }

    return {
      actions,
      channelKindLabel: getChannelIntroKind(activeChannel),
      channelName: activeChannel.name,
      description: getChannelIntroDescription(activeChannel),
    };
  }, [
    activeChannel,
    onAddAgent,
    onBrowseChannels,
    onCreateChannel,
    onOpenMembers,
    onWelcomeAddAgent,
    t,
  ]);
}
