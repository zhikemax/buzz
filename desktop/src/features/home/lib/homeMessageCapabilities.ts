import type { InboxItem } from "@/features/home/lib/inbox";
import { translate, type TranslateFn } from "@/shared/i18n";

export function getHomeMessageCapabilities(
  item: InboxItem | null,
  currentPubkey: string | undefined,
  availableChannelIds: ReadonlySet<string>,
  t: TranslateFn = translate,
) {
  const canReact = Boolean(
    item?.item.channelId && availableChannelIds.has(item.item.channelId),
  );
  const canReply =
    canReact && item?.item.kind !== 45001 && item?.item.kind !== 45003;
  const disabledReplyReason =
    canReply || !item
      ? null
      : item.item.channelId
        ? availableChannelIds.has(item.item.channelId)
          ? t("inbox.reply.unsupported")
          : t("inbox.reply.openChannel")
        : t("inbox.reply.noTarget");

  return {
    canDelete:
      item !== null &&
      currentPubkey?.trim().toLowerCase() ===
        item.item.pubkey.trim().toLowerCase(),
    canReact,
    canReply,
    disabledReplyReason,
  };
}
