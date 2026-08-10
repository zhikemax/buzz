import * as React from "react";
import { toast } from "sonner";

import {
  useBanMemberMutation,
  useModerationRestrictionsQuery,
  useTimeoutMemberMutation,
  useUnbanMemberMutation,
  useUntimeoutMemberMutation,
} from "@/features/moderation/hooks";
import { useMyRelayMembershipQuery } from "@/features/community-members/hooks";
import { isTimedOut } from "@/features/moderation/lib/restrictionState";
import type { ChannelMember } from "@/shared/api/types";
import { useT } from "@/shared/i18n";
import { normalizePubkey } from "@/shared/lib/pubkey";

import type { MemberModerationState } from "./MembersSidebarMemberCard";

/**
 * Owns community ban/timeout wiring for the members sidebar. Gated by relay
 * role (owner/admin), independent of the per-channel role — the relay rejects
 * the command events otherwise. Restrictions are only fetched while the sidebar
 * is open and the caller can moderate.
 */
export function useMembersSidebarModeration(open: boolean) {
  const t = useT();
  const relayMembershipQuery = useMyRelayMembershipQuery();
  const relayRole = relayMembershipQuery.data?.role;
  const canModerate = relayRole === "owner" || relayRole === "admin";
  const restrictionsQuery = useModerationRestrictionsQuery(open && canModerate);
  const banMutation = useBanMemberMutation();
  const unbanMutation = useUnbanMemberMutation();
  const timeoutMutation = useTimeoutMemberMutation();
  const untimeoutMutation = useUntimeoutMemberMutation();
  const isModerationPending =
    banMutation.isPending ||
    unbanMutation.isPending ||
    timeoutMutation.isPending ||
    untimeoutMutation.isPending;

  const moderationStateByPubkey = React.useMemo(() => {
    const nowMs = Date.now();
    const map = new Map<string, MemberModerationState>();
    for (const restriction of restrictionsQuery.data ?? []) {
      map.set(normalizePubkey(restriction.pubkey), {
        banned: restriction.banned,
        timedOut: isTimedOut(restriction.mutedUntil, nowMs),
      });
    }
    return map;
  }, [restrictionsQuery.data]);

  const runModerationAction = React.useCallback(
    async (action: () => Promise<unknown>, success: string) => {
      try {
        await action();
        toast.success(success);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("moderation.actionFailed"),
        );
      }
    },
    [t],
  );

  const onBan = React.useCallback(
    (member: ChannelMember) =>
      void runModerationAction(
        () => banMutation.mutateAsync({ pubkey: member.pubkey }),
        t("moderation.ban.success"),
      ),
    [banMutation, runModerationAction, t],
  );

  const onUnban = React.useCallback(
    (member: ChannelMember) =>
      void runModerationAction(
        () => unbanMutation.mutateAsync(member.pubkey),
        t("moderation.unban.success"),
      ),
    [unbanMutation, runModerationAction, t],
  );

  const onTimeout = React.useCallback(
    (member: ChannelMember, expiresAtSecs: number) =>
      void runModerationAction(
        () =>
          timeoutMutation.mutateAsync({
            pubkey: member.pubkey,
            expiresAt: expiresAtSecs,
          }),
        t("moderation.timeout.authorTimedOut"),
      ),
    [timeoutMutation, runModerationAction, t],
  );

  const onUntimeout = React.useCallback(
    (member: ChannelMember) =>
      void runModerationAction(
        () => untimeoutMutation.mutateAsync(member.pubkey),
        t("moderation.timeout.lifted"),
      ),
    [untimeoutMutation, runModerationAction, t],
  );

  return {
    canModerate,
    isModerationPending,
    moderationStateByPubkey,
    onBan,
    onUnban,
    onTimeout,
    onUntimeout,
  };
}
