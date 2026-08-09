import { AgentDefaultsEditor } from "@/features/agents/ui/AgentDefaultsEditor";
import { useT } from "@/shared/i18n";
import { SectionHeader } from "@/shared/ui/PageHeader";

export function AgentDefaultsSettingsCard() {
  const t = useT();
  return (
    <section
      className="min-w-0 space-y-4"
      data-testid="settings-global-agent-config"
    >
      <SectionHeader
        title={t("settings.agents.defaultsTitle")}
        description={t("settings.agents.defaultsDescription")}
      />
      <AgentDefaultsEditor />
    </section>
  );
}
