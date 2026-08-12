import { useT } from "@/shared/i18n";
import { usePreventSleepContext } from "@/features/agents/usePreventSleep";
import { Switch } from "@/shared/ui/switch";
import { SettingsOptionGroup, SettingsOptionRow } from "./SettingsOptionGroup";
import {
  setPersistentAgentAudienceEnabled,
  usePersistentAgentAudience,
} from "@/features/messages/lib/persistentAgentAudience";

export function PreventSleepSettingsCard() {
  const t = useT();
  const { enabled, setEnabled, hasRunningAgents, expired, clearExpired } =
    usePreventSleepContext();
  const persistentAudience = usePersistentAgentAudience(null);

  return (
    <div className="min-w-0 space-y-3">
      <SettingsOptionGroup
        data-testid="agents-preferences-card"
        title={t("settings.agents.preferences")}
      >
        <SettingsOptionRow>
          <div className="min-w-0">
            <label
              className="text-sm font-medium"
              htmlFor="persistent-agent-audience-switch"
            >
              {t("settings.agents.keepAddressed")}
            </label>
            <p
              className="text-sm font-normal text-muted-foreground/70"
              data-settings-subcopy
            >{t("settings.agents.keepAddressedHint")}</p>
          </div>
          <Switch
            checked={persistentAudience.enabled}
            data-testid="persistent-agent-audience-toggle"
            id="persistent-agent-audience-switch"
            onCheckedChange={setPersistentAgentAudienceEnabled}
          />
        </SettingsOptionRow>

        <SettingsOptionRow>
          <div className="min-w-0">
            <label
              className="text-sm font-medium"
              htmlFor="prevent-sleep-switch"
            >
              {t("settings.agents.keepAwake")}
            </label>
            <p
              className="text-sm font-normal text-muted-foreground/70"
              data-settings-subcopy
            >{t("settings.agents.keepAwakeHint")}</p>
          </div>
          <Switch
            checked={enabled}
            data-testid="prevent-sleep-toggle"
            id="prevent-sleep-switch"
            onCheckedChange={(checked) => {
              if (expired) {
                clearExpired();
              }
              setEnabled(checked);
            }}
          />
        </SettingsOptionRow>
      </SettingsOptionGroup>

      {enabled && !hasRunningAgents && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("settings.agents.waitingForAgents")}
        </p>
      )}

      {expired && (
        <p className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">{t("settings.agents.sleepExpired")}</p>
      )}
    </div>
  );
}
