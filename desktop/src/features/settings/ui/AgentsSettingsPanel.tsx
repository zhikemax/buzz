import { useT } from "@/shared/i18n";
import { AgentDefaultsSettingsCard } from "./AgentDefaultsSettingsCard";
import { HarnessesSettingsPanel } from "./HarnessesSettingsPanel";
import { PreventSleepSettingsCard } from "./PreventSleepSettingsCard";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function AgentsSettingsPanel() {
  const t = useT();
  return (
    <section className="min-w-0" data-testid="settings-agents">
      <SettingsSectionHeader
        title={t("settings.agents.title")}
        description={t("settings.agents.description")}
      />

      <div className="flex flex-col gap-4">
        <PreventSleepSettingsCard />
        <HarnessesSettingsPanel />
        <AgentDefaultsSettingsCard />
      </div>
    </section>
  );
}
