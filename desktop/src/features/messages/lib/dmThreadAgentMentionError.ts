import type { ChannelType } from "@/shared/api/types";
import type { TranslateFn } from "@/shared/i18n";
import { normalizePubkey } from "@/shared/lib/pubkey";

/**
 * Why a DM thread reply may not mention an agent, or null when it may.
 *
 * A DM's participant set is fixed at creation, so a thread reply can only
 * mention agents already in it — persona mentions (which would create a new
 * agent) are always refused.
 */
export function dmThreadAgentMentionError(
  t: TranslateFn,
  {
    trimmed,
    isThreadReply,
    channelType,
    extractMentionPersonas,
    extractMentionPubkeys,
    isAgentPubkey,
    hasResolvedMembers,
    memberPubkeys,
  }: {
    trimmed: string;
    isThreadReply: boolean;
    channelType: ChannelType | null;
    extractMentionPersonas: (text: string) => unknown[];
    extractMentionPubkeys: (text: string) => string[];
    isAgentPubkey: (pubkey: string) => boolean;
    hasResolvedMembers: boolean;
    memberPubkeys: ReadonlySet<string>;
  },
): string | null {
  if (channelType !== "dm" || !isThreadReply) {
    return null;
  }

  if (extractMentionPersonas(trimmed).length > 0) {
    return t("msg.dmThread.agentMentionError");
  }

  const agentPubkeys = extractMentionPubkeys(trimmed).filter(isAgentPubkey);
  if (agentPubkeys.length === 0) {
    return null;
  }

  if (!hasResolvedMembers) {
    return t("msg.dmThread.membersLoading");
  }

  return agentPubkeys.some(
    (pubkey) => !memberPubkeys.has(normalizePubkey(pubkey)),
  )
    ? t("msg.dmThread.agentMentionError")
    : null;
}
