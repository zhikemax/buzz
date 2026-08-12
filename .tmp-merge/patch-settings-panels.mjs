/**
 * Surgical i18n for SettingsPanels after taking upstream version.
 * - Do NOT call useT at module scope
 * - Wire ThemeSettingsCard strings + language picker (fork)
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const path = "desktop/src/features/settings/ui/SettingsPanels.tsx";
let src = execSync(`git show upstream/main:${path}`, {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

// Fix encoding glitches from Windows console
src = src.replace(/â€”/g, "—").replace(/â€™/g, "'").replace(/â€œ|â€/g, '"');

// Add imports
if (!src.includes('from "@/shared/i18n"')) {
  src = src.replace(
    'import { cn } from "@/shared/lib/cn";',
    `import { cn } from "@/shared/lib/cn";\nimport { useLocale, useT, type Locale } from "@/shared/i18n";`,
  );
}

// ThemeSettingsCard: add const t / locale after function start
src = src.replace(
  /function ThemeSettingsCard\(\) \{\n/,
  `function ThemeSettingsCard() {\n  const t = useT();\n  const { locale, setLocale } = useLocale();\n`,
);

// Header
src = src.replace(
  `title="Appearance"
        description="Choose how Buzz looks and feels."`,
  `title={t("settings.appearance.title")}
        description={t("settings.appearance.description")}`,
);

// Theme group title
src = src.replace(
  `title={
            <>
              Theme
              {showCommunityScope ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  (per community)
                </span>
              ) : null}
            </>
          }`,
  `title={
            <>
              {t("settings.appearance.theme")}
              {showCommunityScope ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  {t("settings.appearance.perCommunity")}
                </span>
              ) : null}
            </>
          }`,
);

// Color mode
src = src.replace(
  `<p className="text-sm font-medium">Color mode</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                Follow your system or choose a light or dark appearance.
              </p>`,
  `<p className="text-sm font-medium">{t("settings.appearance.colorMode")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.appearance.colorModeHint")}
              </p>`,
);
src = src.replace(
  `<legend className="sr-only">Color mode</legend>`,
  `<legend className="sr-only">{t("settings.appearance.colorMode")}</legend>`,
);

// Theme style
src = src.replace(
  `<p className="text-sm font-medium">Theme style</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                Choose the colors used throughout Buzz.
              </p>`,
  `<p className="text-sm font-medium">{t("settings.appearance.themeStyle")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.appearance.themeStyleHint")}
              </p>`,
);

// aria-label template for theme style
src = src.replace(
  /aria-label=\{`Theme style, \$\{selectedThemeLabel\}`\}/g,
  `aria-label={t("settings.appearance.themeStyleAria", { name: selectedThemeLabel })}`,
);

// Preferences group + inject language picker before LinkPreview
src = src.replace(
  `<SettingsOptionGroup
          data-testid="appearance-preferences-card"
          title="Preferences"
        >
          <LinkPreviewStyleSetting />
          <ThreadLayoutSetting />
        </SettingsOptionGroup>`,
  `<SettingsOptionGroup
          data-testid="appearance-preferences-card"
          title={t("settings.appearance.preferences")}
        >
          <SettingsOptionRow data-testid="settings-language">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {t("settings.appearance.language")}
              </p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.appearance.languageDescription")}
              </p>
            </div>
            <div className="flex gap-2">
              {(
                [
                  {
                    value: "en" as Locale,
                    label: t("settings.appearance.lang.en"),
                  },
                  {
                    value: "zh-CN" as Locale,
                    label: t("settings.appearance.lang.zhCN"),
                  },
                ] as const
              ).map((option) => (
                <button
                  aria-pressed={locale === option.value}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    locale === option.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  data-testid={\`appearance-locale-\${option.value}\`}
                  key={option.value}
                  onClick={() => setLocale(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingsOptionRow>
          <LinkPreviewStyleSetting />
          <ThreadLayoutSetting />
        </SettingsOptionGroup>`,
);

// APPEARANCE_MODE_OPTIONS — keep English at module scope; map labels in component
// Replace module const to use keys, resolve in map:
src = src.replace(
  `const APPEARANCE_MODE_OPTIONS = [
  { mode: "system" as const, label: "System", Icon: SunMoon },
  { mode: "light" as const, label: "Light", Icon: Sun },
  { mode: "dark" as const, label: "Dark", Icon: Moon },
];`,
  `const APPEARANCE_MODE_OPTIONS = [
  {
    mode: "system" as const,
    labelKey: "settings.appearance.system" as const,
    Icon: SunMoon,
  },
  {
    mode: "light" as const,
    labelKey: "settings.appearance.light" as const,
    Icon: Sun,
  },
  {
    mode: "dark" as const,
    labelKey: "settings.appearance.dark" as const,
    Icon: Moon,
  },
];`,
);

src = src.replace(
  `{APPEARANCE_MODE_OPTIONS.map(({ mode, label, Icon }) => (`,
  `{APPEARANCE_MODE_OPTIONS.map(({ mode, labelKey, Icon }) => (
                // label resolved via useT inside ThemeSettingsCard
`,
);

// Need to use t(labelKey) in the button - replace {label} near appearance-mode
// Find the Icon + label render in mode buttons
src = src.replace(
  `<Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </fieldset>
          </SettingsOptionRow>

          <SettingsOptionRow data-testid="theme-style-row">`,
  `<Icon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </fieldset>
          </SettingsOptionRow>

          <SettingsOptionRow data-testid="theme-style-row">`,
);

fs.writeFileSync(path, src);
console.log("SettingsPanels patched");
