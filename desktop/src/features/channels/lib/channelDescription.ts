import type { Channel } from "@/shared/api/types";
import { translate } from "@/shared/i18n";

export function getChannelDescription(channel: Channel | null): string {
  if (!channel) {
    return translate("channel.descDisconnected");
  }

  const prefixes = [
    channel.archivedAt ? translate("channel.descArchived") : null,
    !channel.isMember ? translate("channel.descReadOnlyUntilJoin") : null,
  ].filter((value) => value && value.trim().length > 0);

  // Show only the first non-empty field to avoid duplication when
  // topic, description, and purpose contain overlapping text.
  const detail = [channel.topic, channel.description, channel.purpose].find(
    (value) => value && value.trim().length > 0,
  );

  const parts = [...prefixes, detail ?? null].filter(Boolean);

  return parts.length > 0
    ? parts.join(" ")
    : translate("channel.descFallback");
}
