import fs from "node:fs";

const path = "desktop/src/features/settings/ui/AppearanceSettingsControls.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("@/shared/i18n")) {
  s = `import { useT, type MessageKey } from "@/shared/i18n";\n` + s;
}

const replacements = [
  [
    `          Prominent active tab
        </label>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          Give the selected navigation item a higher-contrast background.
        </p>`,
    `          {t("settings.appearance.prominentActiveTab")}
        </label>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {t("settings.appearance.prominentActiveTabHint")}
        </p>`,
  ],
  [
    `        <p className="text-sm font-medium">Links</p>`,
    `        <p className="text-sm font-medium">{t("settings.appearance.linkPreviewTitle")}</p>`,
  ],
  [
    `            Glass background
          </label>
          <p
            className="text-sm font-normal text-muted-foreground/70"
            data-settings-subcopy
          >
            {glassBackgroundSupported
              ? "Blur the desktop behind navigation while keeping content solid."
              : "Available in the macOS desktop app."}
          </p>`,
    `            {t("settings.appearance.glassBackground")}
          </label>
          <p
            className="text-sm font-normal text-muted-foreground/70"
            data-settings-subcopy
          >
            {glassBackgroundSupported
              ? t("settings.appearance.glassBackgroundHint")
              : t("settings.appearance.glassBackgroundUnsupported")}
          </p>`,
  ],
  [`ariaLabel="Glass opacity"`, `ariaLabel={t("settings.appearance.glassOpacity")}`],
  [`resetLabel="Reset glass opacity"`, `resetLabel={t("settings.appearance.glassOpacityReset")}`],
];

for (const [a, b] of replacements) {
  if (!s.includes(a)) {
    console.warn("missing chunk", a.slice(0, 60));
  } else {
    s = s.replace(a, b);
  }
}

// Convert static option arrays to use keys inside components
s = s.replace(
  `const LINK_PREVIEW_STYLE_OPTIONS: {
  value: LinkPreviewStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "compact",
    label: "Compact",
    description: "Show links as compact horizontal cards",
  },
  {
    value: "rich",
    label: "Rich",
    description: "Unfurl links with larger images and descriptions",
  },
];

export function LinkPreviewStyleSetting() {
  const style = useLinkPreviewStyle();
  const activeOption =
    LINK_PREVIEW_STYLE_OPTIONS.find((option) => option.value === style) ??
    LINK_PREVIEW_STYLE_OPTIONS[0];`,
  `const LINK_PREVIEW_STYLE_OPTIONS: {
  value: LinkPreviewStyle;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
}[] = [
  {
    value: "compact",
    labelKey: "settings.appearance.linkPreviewCompact",
    descriptionKey: "settings.appearance.linkPreviewCompactDesc",
  },
  {
    value: "rich",
    labelKey: "settings.appearance.linkPreviewRich",
    descriptionKey: "settings.appearance.linkPreviewRichDesc",
  },
];

export function LinkPreviewStyleSetting() {
  const t = useT();
  const style = useLinkPreviewStyle();
  const linkPreviewOptions = LINK_PREVIEW_STYLE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    description: t(option.descriptionKey),
  }));
  const activeOption =
    linkPreviewOptions.find((option) => option.value === style) ??
    linkPreviewOptions[0];`,
);

s = s.replace(
  `LINK_PREVIEW_STYLE_OPTIONS.map((option) => (`,
  `linkPreviewOptions.map((option) => (`,
);

// Thread layout options - similar pattern
s = s.replace(
  /const THREAD_LAYOUT_OPTIONS: \{[\s\S]*?\];\n\nexport function ThreadLayoutSetting\(\) \{\n  const threadViewMode = useThreadViewMode\(\);/,
  `const THREAD_LAYOUT_OPTIONS: {
  value: ThreadViewMode;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
}[] = [
  {
    value: "focus",
    labelKey: "settings.appearance.threadFocus",
    descriptionKey: "settings.appearance.threadFocusDesc",
  },
  {
    value: "split",
    labelKey: "settings.appearance.threadSplit",
    descriptionKey: "settings.appearance.threadSplitDesc",
  },
];

export function ThreadLayoutSetting() {
  const t = useT();
  const threadViewMode = useThreadViewMode();
  const threadOptions = THREAD_LAYOUT_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    description: t(option.descriptionKey),
  }));`,
);

// Fix activeOption for thread - was THREAD_LAYOUT_OPTIONS
s = s.replace(
  /const activeOption =\n    THREAD_LAYOUT_OPTIONS\.find\(\(option\) => option\.value === threadViewMode\) \?\?\n    THREAD_LAYOUT_OPTIONS\[0\];/,
  `const activeOption =
    threadOptions.find((option) => option.value === threadViewMode) ??
    threadOptions[0];`,
);
s = s.replace(
  `THREAD_LAYOUT_OPTIONS.map((option) => (`,
  `threadOptions.map((option) => (`,
);

// Thread layout title
s = s.replace(
  /\{t\("settings\.appearance\.threadLayout"\)\}/,
  `{t("settings.appearance.threadLayout")}`,
);
if (s.includes(`Thread layout`) && !s.includes(`t("settings.appearance.threadLayout")`)) {
  s = s.replace(
    /Thread layout(\s*)(\{showCommunityScope)/,
    `{t("settings.appearance.threadLayout")}$1$2`,
  );
  s = s.replace(
    `(all communities)`,
    `{t("settings.appearance.threadLayoutAllCommunities")}`,
  );
}

// Add useT to components that need it
for (const name of [
  "ProminentActiveTabSetting",
  "GlassBackgroundSetting",
  "AccentPickerContent",
]) {
  const re = new RegExp(`export function ${name}\\([^)]*\\) \\{\\n`);
  s = s.replace(re, (m) => {
    if (s.includes(`export function ${name}`) && !new RegExp(`export function ${name}[\\s\\S]{0,200}const t = useT`).test(s)) {
      return `${m}  const t = useT();\n`;
    }
    return m;
  });
}

fs.writeFileSync(path, s);
console.log("appearance controls patched");
