import type { ReactNode } from "react";

import { CopyButton } from "@/features/agents/ui/CopyButton";
import { MemoryRefreshButton } from "@/features/agent-memory/ui/MemorySection";
import {
  PROFILE_PANEL_VIEW_TITLES,
  type ProfilePanelView,
} from "@/features/profile/ui/UserProfilePanelUtils";
import type { MessageKey, TranslateFn } from "@/shared/i18n";
import {
  AuxiliaryPanelHeaderActions,
  AuxiliaryPanelHeaderGroup,
  AuxiliaryPanelHeaderTitleBlock,
} from "@/shared/layout/AuxiliaryPanel";

const PROFILE_PANEL_VIEW_TITLE_KEYS: Record<ProfilePanelView, MessageKey> = {
  summary: "profile.title",
  instructions: "profile.instructions",
  info: "profile.agentInfo",
  configuration: "profile.tabRuntime",
  diagnostics: "profile.harnessLog",
  memories: "profile.tabMemories",
  channels: "profile.tabChannels",
  logs: "profile.harnessLog",
};

export function getUserProfilePanelHeaderContent({
  agentSettingsMenu,
  effectivePubkey,
  logCopyValue,
  logSubtitle,
  onBack,
  t,
  view,
  viewerIsOwner,
}: {
  agentSettingsMenu: ReactNode;
  effectivePubkey: string | null;
  logCopyValue?: string | null;
  logSubtitle?: string | null;
  onBack: () => void;
  t: TranslateFn;
  view: ProfilePanelView;
  viewerIsOwner: boolean;
}) {
  const title =
    t(PROFILE_PANEL_VIEW_TITLE_KEYS[view]) || PROFILE_PANEL_VIEW_TITLES[view];
  const shouldShowLogDetails =
    (view === "diagnostics" || view === "logs") && Boolean(logSubtitle);
  const headerLeftContent = (
    <AuxiliaryPanelHeaderGroup
      align={shouldShowLogDetails ? "start" : "center"}
      backButtonAriaLabel={t("profile.backToProfile")}
      backButtonTestId="user-profile-panel-back"
      onBack={view !== "summary" ? onBack : undefined}
    >
      <AuxiliaryPanelHeaderTitleBlock
        subtitle={shouldShowLogDetails ? logSubtitle : null}
        subtitleTitle={logSubtitle ?? undefined}
        title={title}
      />
    </AuxiliaryPanelHeaderGroup>
  );
  const headerActions = (
    <AuxiliaryPanelHeaderActions>
      {view === "memories" && viewerIsOwner && effectivePubkey ? (
        <MemoryRefreshButton
          agentPubkey={effectivePubkey}
          variant="outline"
          viewerIsOwner={viewerIsOwner}
        />
      ) : null}
      {view === "summary" ? agentSettingsMenu : null}
      {shouldShowLogDetails ? (
        <CopyButton
          className="text-muted-foreground hover:text-foreground"
          iconOnly
          label="Copy log"
          size="icon"
          value={logCopyValue ?? ""}
          variant="ghost"
        />
      ) : null}
    </AuxiliaryPanelHeaderActions>
  );

  return { headerActions, headerLeftContent };
}
