import { useT } from "@/shared/i18n";
import { AgentDefaultsEditor } from "@/features/agents/ui/AgentDefaultsEditor";
import { SettingsOptionGroup } from "./SettingsOptionGroup";

export function AgentDefaultsSettingsCard() {
  const t = useT();
  return (
    <SettingsOptionGroup
      data-testid="settings-global-agent-config"
      description={t("settings.agents.defaultsDescription")}
      title={t("settings.agents.defaultsTitle")}
    >
      <div className="px-4 py-4">
        <AgentDefaultsEditor layout="flat" />
      </div>
    </SettingsOptionGroup>
  );
}
