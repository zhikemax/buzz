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
        className="inline-flex min-w-0 items-center gap-1"
        title={t("projects.origin.claimedTitle")}
      >
        <span>{t("projects.origin.startedFrom")}</span>
        {channel ? (
          <button
            aria-label={t("projects.origin.openChannelAria", {
              name: channel.name,
            })}
            className="truncate font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => void goChannel(channel.id)}
            type="button"
          >
            #{channel.name}
          </button>
        ) : (
          <span>{t("projects.origin.publicChannel")}</span>
        )}
        <span>{t("projects.origin.authorClaimed")}</span>
      </span>
    );
  }

  if (agentName) {
    return (
      <span
        className="inline-flex min-w-0 items-center gap-1"
        title={t("projects.origin.omittedTitle")}
      >
        <span>{t("projects.origin.startedPrivatelyWith")}</span>
        <span className="truncate font-medium text-foreground">
          {agentName}
        </span>
      </span>
    );
  }

  return null;
}
