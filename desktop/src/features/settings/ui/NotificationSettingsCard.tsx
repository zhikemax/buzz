import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type {
  DesktopNotificationPermissionState,
  NotificationSettings,
} from "@/features/notifications/hooks";
import {
  COMING_SOON_SLOTS,
  RECOMMENDED_SOUND_BY_SLOT,
  SOUND_SLOTS,
  type SoundName,
  type SoundSlot,
} from "@/features/notifications/lib/sound";
import { useT, type MessageKey, type TranslateFn } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { SettingsOptionGroup, SettingsOptionRow } from "./SettingsOptionGroup";
import { SettingsSectionHeader } from "./SettingsSectionHeader";
import { SoundPicker } from "./SoundPicker";

const SLOT_LABEL_KEYS: Record<SoundSlot, MessageKey> = {
  dm: "notify.slot.dms",
  mention: "notify.slot.mentions",
  thread_reply: "notify.slot.threadReplies",
  needs_action: "notify.slot.needsAction",
  job_accepted: "notify.slot.agentAccepted",
  job_progress: "notify.slot.agentProgress",
  job_result: "notify.slot.agentResult",
  job_error: "notify.slot.agentError",
};

const SLOT_HINT_KEYS: Record<SoundSlot, MessageKey> = {
  dm: "notify.slotHint.dms",
  mention: "notify.slotHint.mentions",
  thread_reply: "notify.slotHint.threadReplies",
  needs_action: "notify.slotHint.needsAction",
  job_accepted: "notify.slotHint.agentAccepted",
  job_progress: "notify.slotHint.agentProgress",
  job_result: "notify.slotHint.agentResult",
  job_error: "notify.slotHint.agentError",
};

function getSlotLabel(slot: SoundSlot, t: TranslateFn) {
  return t(SLOT_LABEL_KEYS[slot]);
}

function getSlotHint(slot: SoundSlot, t: TranslateFn) {
  return t(SLOT_HINT_KEYS[slot]);
}

export function NotificationSettingsCard({
  isUpdatingDesktopNotifications,
  notificationErrorMessage,
  notificationPermission,
  notificationSettings,
  onSetDesktopNotificationsEnabled,
  onSetAllSlotAlertsEnabled,
  onSetHomeBadgeEnabled,
  onSetSlotAlertsEnabled,
  onSetNotifyWhileViewing,
  onSetSoundForSlot,
}: {
  isUpdatingDesktopNotifications: boolean;
  notificationErrorMessage: string | null;
  notificationPermission: DesktopNotificationPermissionState;
  notificationSettings: NotificationSettings;
  onSetDesktopNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  onSetAllSlotAlertsEnabled: (enabled: boolean) => void;
  onSetHomeBadgeEnabled: (enabled: boolean) => void;
  onSetSlotAlertsEnabled: (slot: SoundSlot, enabled: boolean) => void;
  onSetNotifyWhileViewing: (enabled: boolean) => void;
  onSetSoundForSlot: (slot: SoundSlot, name: SoundName) => void;
}) {
  const t = useT();
  const permissionBlocked =
    notificationPermission === "denied" ||
    notificationPermission === "unsupported";
  // The parent Sound switch derives from its children: on when any live
  // event row is on, and toggling it bulk-sets every live row.
  const anyAlertsOn = SOUND_SLOTS.some(
    (slot) =>
      !COMING_SOON_SLOTS.has(slot) &&
      notificationSettings.slotAlertsEnabled[slot],
  );
  const [showComingSoon, setShowComingSoon] = useState(false);
  const visibleSlots = SOUND_SLOTS.filter(
    (slot) => showComingSoon || !COMING_SOON_SLOTS.has(slot),
  );

  return (
    <section className="min-w-0" data-testid="settings-notifications">
      <SettingsSectionHeader
        title={t("notify.title")}
        description={t("notify.description")}
      />

      <span className="sr-only" data-testid="notifications-desktop-state">
        {notificationPermission === "unsupported"
          ? t("notify.unavailable")
          : notificationPermission === "denied"
            ? t("notify.blocked")
            : notificationSettings.desktopEnabled
              ? t("notify.on")
              : t("notify.off")}
      </span>

      <div className="flex flex-col gap-4">
        <SettingsOptionGroup>
          <SettingsOptionRow>
            <div className="min-w-0">
              <label
                className="text-sm font-medium"
                htmlFor="desktop-alerts-switch"
              >
                {isUpdatingDesktopNotifications
                  ? t("notify.requesting")
                  : t("notify.desktopAlerts")}
              </label>
              <p className="text-sm font-normal text-muted-foreground">
                {notificationSettings.desktopEnabled
                  ? t("notify.desktopEnabledHint")
                  : t("notify.desktopRequestHint")}
              </p>
            </div>
            <Switch
              checked={notificationSettings.desktopEnabled}
              data-testid="notifications-desktop-toggle"
              disabled={isUpdatingDesktopNotifications}
              id="desktop-alerts-switch"
              onCheckedChange={(checked) => {
                void onSetDesktopNotificationsEnabled(checked);
              }}
            />
          </SettingsOptionRow>

          <SettingsOptionRow>
            <div className="min-w-0">
              <label
                className="text-sm font-medium"
                htmlFor="notify-while-viewing-switch"
              >
                {t("notify.whileViewing")}
              </label>
              <p className="text-sm font-normal text-muted-foreground">
                {t("notify.whileViewingHint")}
              </p>
            </div>
            <Switch
              checked={
                notificationSettings.desktopEnabled &&
                notificationSettings.notifyWhileViewing
              }
              data-testid="notifications-notify-while-viewing-toggle"
              disabled={!notificationSettings.desktopEnabled}
              id="notify-while-viewing-switch"
              onCheckedChange={(checked) => {
                onSetNotifyWhileViewing(checked);
              }}
            />
          </SettingsOptionRow>
        </SettingsOptionGroup>

        {notificationSettings.desktopEnabled ? (
          <>
            <SettingsOptionGroup>
              <SettingsOptionRow>
                <div className="min-w-0">
                  <label
                    className="text-sm font-medium"
                    htmlFor="notification-sound-switch"
                  >
                    {t("notify.sound")}
                  </label>
                  <p className="text-sm font-normal text-muted-foreground">
                    {t("notify.soundHint")}
                  </p>
                </div>
                <Switch
                  checked={anyAlertsOn}
                  data-testid="notifications-sound-toggle"
                  id="notification-sound-switch"
                  onCheckedChange={(checked) => {
                    onSetAllSlotAlertsEnabled(checked);
                  }}
                />
              </SettingsOptionRow>
            </SettingsOptionGroup>

            {anyAlertsOn ? (
              <>
                <SettingsOptionGroup>
                  {visibleSlots.map((slot) => {
                    const comingSoon = COMING_SOON_SLOTS.has(slot);
                    const alertsOn =
                      notificationSettings.slotAlertsEnabled[slot];
                    return (
                      <SettingsOptionRow
                        aria-disabled={comingSoon || undefined}
                        className={cn(
                          comingSoon && "cursor-not-allowed opacity-40",
                        )}
                        key={slot}
                      >
                        <div className="min-w-0">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {getSlotLabel(slot, t)}
                            {comingSoon ? (
                              <span className="rounded-full bg-muted/70 px-2 py-0.5 text-2xs font-normal uppercase tracking-wide text-muted-foreground">
                                {t("notify.comingSoon")}
                              </span>
                            ) : null}
                          </span>
                          <p className="text-sm font-normal text-muted-foreground">
                            {getSlotHint(slot, t)}
                          </p>
                        </div>
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "transition-opacity duration-200",
                              !alertsOn && "pointer-events-none opacity-40",
                            )}
                          >
                            <SoundPicker
                              disabled={comingSoon || !alertsOn}
                              onChange={(next) => onSetSoundForSlot(slot, next)}
                              recommended={RECOMMENDED_SOUND_BY_SLOT[slot]}
                              value={notificationSettings.sounds[slot]}
                            />
                          </span>
                          <Switch
                            checked={alertsOn && !comingSoon}
                            data-testid={`notifications-alerts-enabled-${slot}`}
                            disabled={comingSoon}
                            id={`alerts-enabled-${slot}-switch`}
                            onCheckedChange={(checked) => {
                              onSetSlotAlertsEnabled(slot, checked);
                            }}
                          />
                        </span>
                      </SettingsOptionRow>
                    );
                  })}
                </SettingsOptionGroup>

                <div className="flex justify-center">
                  <Button
                    data-testid="notifications-toggle-coming-soon"
                    onClick={() => setShowComingSoon((current) => !current)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {showComingSoon ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        {t("notify.showLess")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        {t("notify.viewAll")}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : null}
          </>
        ) : null}

        <SettingsOptionGroup>
          <SettingsOptionRow>
            <div className="min-w-0">
              <label
                className="text-sm font-medium"
                htmlFor="home-badge-switch"
              >
                {t("notify.homeBadge")}
              </label>
              <p className="text-sm font-normal text-muted-foreground">
                {t("notify.homeBadgeHint")}
              </p>
            </div>
            <Switch
              checked={notificationSettings.homeBadgeEnabled}
              data-testid="notifications-home-badge-toggle"
              id="home-badge-switch"
              onCheckedChange={(checked) => {
                onSetHomeBadgeEnabled(checked);
              }}
            />
          </SettingsOptionRow>
        </SettingsOptionGroup>
      </div>

      {permissionBlocked && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {notificationPermission === "unsupported"
            ? t("notify.unsupported")
            : t("notify.blockedHint")}
        </p>
      )}

      {notificationErrorMessage ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {notificationErrorMessage}
        </p>
      ) : null}
    </section>
  );
}
