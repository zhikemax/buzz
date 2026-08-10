import type { Channel, ChannelMember } from "@/shared/api/types";
import { detectLocale, translate, type TranslateFn } from "@/shared/i18n";
import { normalizePubkey, truncatePubkey } from "@/shared/lib/pubkey";

type BuildHuddleChannelNameInput = {
  channel: Channel;
  currentPubkey?: string;
  members?: readonly ChannelMember[];
  t?: TranslateFn;
};

function firstName(label: string): string {
  return label.trim().split(/\s+/)[0] ?? "";
}

function channelParticipantLabel(
  channel: Channel,
  pubkey: string,
  membersByPubkey: Map<string, ChannelMember>,
): string {
  const normalized = normalizePubkey(pubkey);
  const memberName = membersByPubkey.get(normalized)?.displayName?.trim();
  if (memberName) {
    return firstName(memberName);
  }

  const participantIndex = channel.participantPubkeys.findIndex(
    (participantPubkey) => normalizePubkey(participantPubkey) === normalized,
  );
  const fallbackName =
    participantIndex >= 0
      ? channel.participants[participantIndex]?.trim()
      : null;
  if (fallbackName) {
    return firstName(fallbackName);
  }

  return truncatePubkey(pubkey);
}

export function buildHuddleChannelName({
  channel,
  currentPubkey,
  members = [],
  t = (key, params) => translate(detectLocale(), key, params),
}: BuildHuddleChannelNameInput): string {
  if (channel.channelType !== "dm") {
    const channelName = channel.name.trim();
    return channelName
      ? t("huddle.channelName.named", { name: channelName })
      : t("huddle.channelName.generic");
  }

  const membersByPubkey = new Map(
    members.map((member) => [normalizePubkey(member.pubkey), member]),
  );
  const normalizedCurrentPubkey = currentPubkey
    ? normalizePubkey(currentPubkey)
    : null;
  const participantPubkeys = channel.participantPubkeys;
  const orderedPubkeys =
    normalizedCurrentPubkey &&
    participantPubkeys.some(
      (pubkey) => normalizePubkey(pubkey) === normalizedCurrentPubkey,
    )
      ? [
          currentPubkey ?? "",
          ...participantPubkeys.filter(
            (pubkey) => normalizePubkey(pubkey) !== normalizedCurrentPubkey,
          ),
        ]
      : participantPubkeys;
  const names = orderedPubkeys
    .map((pubkey) => channelParticipantLabel(channel, pubkey, membersByPubkey))
    .filter(Boolean);

  if (names.length === 0) {
    return t("huddle.channelName.generic");
  }

  return t("huddle.channelName.named", { name: names.join(" <> ") });
}
