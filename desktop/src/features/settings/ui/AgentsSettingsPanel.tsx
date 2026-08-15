import { useT } from "@/shared/i18n";
import { AgentDefaultsSettingsCard } from "./AgentDefaultsSettingsCard";
import { HarnessesSettingsPanel } from "./HarnessesSettingsPanel";
import { PreventSleepSettingsCard } from "./PreventSleepSettingsCard";
import { SettingsOptionGroupList } from "./SettingsOptionGroup";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function AgentsSettingsPanel() {
  const t = useT();
  return (
    <section className="min-w-0" data-testid="settings-agents">
      <SettingsSectionHeader
        title={t("settings.agents.title")}
        description={t("settings.agents.description")}
      />

      <SettingsOptionGroupList>
        <PreventSleepSettingsCard />
        <HarnessesSettingsPanel />
        <AgentDefaultsSettingsCard />
      </SettingsOptionGroupList>
    </section>
  );
}
