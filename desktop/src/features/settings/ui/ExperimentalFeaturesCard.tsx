import { setAgentManagedProfiles } from "@/shared/api/tauri";
import { desktopFeatures, useFeatureToggle } from "@/shared/features";
import type { FeatureDefinition } from "@/shared/features";
import { useT, type MessageKey } from "@/shared/i18n";
import { Switch } from "@/shared/ui/switch";
import { SettingsOptionGroup, SettingsOptionRow } from "./SettingsOptionGroup";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

const FEATURE_COPY_KEYS: Record<
  string,
  { name: MessageKey; description: MessageKey }
> = {
  workflows: {
    name: "settings.experimental.workflows.name",
    description: "settings.experimental.workflows.description",
  },
  projects: {
    name: "settings.experimental.projects.name",
    description: "settings.experimental.projects.description",
  },
  pulse: {
    name: "settings.experimental.pulse.name",
    description: "settings.experimental.pulse.description",
  },
  forum: {
    name: "settings.experimental.forum.name",
    description: "settings.experimental.forum.description",
  },
  agentManagedProfiles: {
    name: "settings.experimental.agentManagedProfiles.name",
    description: "settings.experimental.agentManagedProfiles.description",
  },
};

function FeatureRow({ feature }: { feature: FeatureDefinition }) {
  const t = useT();
  const [enabled, toggle] = useFeatureToggle(feature.id);
  const switchId = `feature-toggle-${feature.id}`;
  const copy = FEATURE_COPY_KEYS[feature.id];
  const name = copy ? t(copy.name) : feature.name;
  const description = copy ? t(copy.description) : feature.description;

  return (
    <SettingsOptionRow>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" id={`${switchId}-label`}>
          {name}
        </p>
        <p className="text-xs text-muted-foreground/70" data-settings-subcopy>
          {description}
        </p>
      </div>
      <Switch
        aria-labelledby={`${switchId}-label`}
        checked={enabled}
        data-testid={switchId}
        onCheckedChange={(value) => {
          toggle(value);
          if (feature.id === "agentManagedProfiles") {
            void setAgentManagedProfiles(value).catch((error) => {
              console.error(
                "Failed to apply agent-managed profiles setting:",
                error,
              );
            });
          }
        }}
      />
    </SettingsOptionRow>
  );
}

export function ExperimentalFeaturesCard() {
  const t = useT();
  // Manifest is preview-only by definition; every desktop entry is a preview
  // feature.
  const previewFeatures = desktopFeatures;

  return (
    <section className="min-w-0" data-testid="settings-experimental">
      <SettingsSectionHeader
        title={t("settings.experimental.title")}
        description={t("settings.experimental.description")}
      />

      <SettingsOptionGroup title={t("settings.experimental.features")}>
        {previewFeatures.map((f) => (
          <FeatureRow feature={f} key={f.id} />
        ))}
      </SettingsOptionGroup>
    </section>
  );
}
