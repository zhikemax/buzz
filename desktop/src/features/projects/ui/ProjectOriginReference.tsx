import { useAppNavigation } from "@/app/navigation/useAppNavigation";
import { useChannelsQuery } from "@/features/channels/hooks";
import { useT } from "@/shared/i18n";

export function ProjectOriginReference({
  agentName,
  channelId,
}: {
  agentName?: string | null;
  channelId?: string | null;
}) {
  const t = useT();
  const { goChannel } = useAppNavigation();
  const channelsQuery = useChannelsQuery({ enabled: Boolean(channelId) });
  const channel = channelsQuery.data?.find(
    (candidate) => candidate.id === channelId,
  );

  if (channelId) {
    return (
      <span
        className="inline-flex max-w-full min-w-0 items-center gap-1"
        title={
          channel
            ? "Origin is claimed by the event author and is not relay-verified."
            : // Open channels always resolve by name (the relay serves their
              // metadata to every community member), so an unresolved id means
              // a private, deleted, or otherwise inaccessible channel.
              `Origin channel ${channelId} is not visible to you. Origin is claimed by the event author and is not relay-verified.`
        }
      >
        <span
          className="shrink-0 whitespace-nowrap"
          data-project-metadata-phrase
        >
          {t("projects.origin.startedFrom")}
        </span>
        {channel ? (
          <button
            aria-label={`Open author-claimed origin channel #${channel.name}`}
            className="min-w-0 truncate font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => void goChannel(channel.id)}
            type="button"
          >
            #{channel.name}
          </button>
        ) : (
          <span className="shrink-0 whitespace-nowrap">a private channel</span>
        )}
        <span
          className="shrink-0 whitespace-nowrap"
          data-project-metadata-phrase
        >
          {t("projects.origin.authorClaimed")}
        </span>
      </span>
    );
  }

  if (agentName) {
    return (
      <span
        className="inline-flex max-w-full min-w-0 items-center gap-1"
        title={t("projects.origin.omittedTitle")}
      >
        <span
          className="shrink-0 whitespace-nowrap"
          data-project-metadata-phrase
        >
          {t("projects.origin.startedPrivatelyWith")}
        </span>
        <span className="truncate font-medium text-foreground">
          {agentName}
        </span>
      </span>
    );
  }

  return null;
}
