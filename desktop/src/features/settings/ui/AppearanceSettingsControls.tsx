import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Eye } from "lucide-react";
import {
  setThreadViewMode,
  useThreadViewMode,
  type ThreadViewMode,
} from "@/features/channels/lib/threadViewModePreference";
import { useCommunities } from "@/features/communities/useCommunities";
import { AvatarFramingSlider } from "@/features/profile/ui/AnimatedAvatarControls";
import { contrastColorForBackground } from "@/features/profile/ui/ProfileAvatarEditor.utils";
import {
  setLinkPreviewStyle,
  useLinkPreviewStyle,
  type LinkPreviewStyle,
} from "@/shared/lib/linkPreviewStylePreference";
import { isLinuxPlatform } from "@/shared/lib/platform";
import {
  previewConversationDensity,
  setConversationDensity,
  useConversationDensity,
} from "@/shared/lib/conversationDensityPreference";
import {
  previewFontSize,
  setFontSize,
  useFontSize,
} from "@/shared/lib/fontSizePreference";
import {
  ACCENT_COLORS,
  DEFAULT_GLASS_OPACITY,
  GLASS_OPACITY_MAX,
  GLASS_OPACITY_MIN,
  NEUTRAL_ACCENT,
  useTheme,
} from "@/shared/theme/ThemeProvider";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Switch } from "@/shared/ui/switch";
import { SettingsOptionRow } from "./SettingsOptionGroup";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { useT, type TranslateFn } from "@/shared/i18n";

/** Buzz navigation can use either its production tint or a stronger tab. */
export function ProminentActiveTabSetting() {
  const { prominentActiveTab, setProminentActiveTab } = useTheme();
  const t = useT();

  return (
    <SettingsOptionRow data-testid="prominent-active-tab-row">
      <div className="min-w-0">
        <label
          className="text-sm font-medium"
          htmlFor="prominent-active-tab-switch"
        >
          {t("settings.appearance.prominentActiveTab")}
        </label>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {t("settings.appearance.prominentActiveTabHint")}
        </p>
      </div>
      <Switch
        checked={prominentActiveTab}
        data-testid="prominent-active-tab-toggle"
        id="prominent-active-tab-switch"
        onCheckedChange={setProminentActiveTab}
      />
    </SettingsOptionRow>
  );
}

function linkPreviewStyleOptions(t: TranslateFn) {
  return [
    {
      value: "compact" as const,
      label: t("settings.appearance.linkPreviewCompact"),
      description: t("settings.appearance.linkPreviewCompactDesc"),
    },
    {
      value: "rich" as const,
      label: t("settings.appearance.linkPreviewRich"),
      description: t("settings.appearance.linkPreviewRichDesc"),
    },
  ];
}

function conversationDensityOptions(t: TranslateFn) {
  return [
    { value: "compact" as const, label: t("settings.appearance.densityCompact") },
    { value: "comfortable" as const, label: t("settings.appearance.densityComfy") },
    { value: "spacious" as const, label: t("settings.appearance.densitySpacious") },
  ];
}

function fontSizeOptions(t: TranslateFn) {
  return [
    { value: "smaller" as const, label: t("settings.appearance.fontSizeSmaller") },
    { value: "default" as const, label: t("settings.appearance.fontSizeDefault") },
    { value: "larger" as const, label: t("settings.appearance.fontSizeLarger") },
  ];
}

function ConversationDensityPreviewMessage({
  avatar,
  author,
  children,
  timestamp,
}: {
  avatar: string;
  author: string;
  children: ReactNode;
  timestamp: string;
}) {
  return (
    <article className="flex gap-2.5 py-conversation-row">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-message-author">
          <span className="text-message font-semibold leading-message-author tracking-normal text-foreground">
            {author}
          </span>
          <span className="text-message-timestamp font-normal text-muted-foreground/65">
            {timestamp}
          </span>
        </div>
        <div className="mt-conversation-body text-message font-normal tracking-normal text-foreground">
          {children}
        </div>
      </div>
    </article>
  );
}

function ConversationPreview() {
  const t = useT();
  return (
    <div className="px-4 py-3" data-testid="conversation-preview">
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-xl border border-border/65 bg-transparent"
        data-testid="conversation-preview-surface"
      >
        <span className="absolute right-3.5 top-3 inline-flex items-center gap-1 text-2xs font-medium text-muted-foreground/55">
          <Eye aria-hidden="true" className="size-3" />
          {t("settings.appearance.preview")}
        </span>
        <div className="p-4" data-testid="conversation-preview-content">
          <ConversationDensityPreviewMessage
            avatar="M"
            author="Maya"
            timestamp="9:41"
          >
            The revised conversation layout is ready to review.
          </ConversationDensityPreviewMessage>
          <ConversationDensityPreviewMessage
            avatar="T"
            author="Theo"
            timestamp="9:43"
          >
            <p>
              I added a longer message so you can compare line height and text
              spacing.
            </p>
            <p className="mt-conversation-paragraph">
              The same rhythm carries through channels, threads, DMs, and Inbox.
            </p>
          </ConversationDensityPreviewMessage>
        </div>
      </div>
    </div>
  );
}

/** App-wide type sizing and conversation-specific spacing controls. */
export function ConversationDisplaySettings() {
  const t = useT();
  const density = useConversationDensity();
  const fontSize = useFontSize();

  return (
    <div data-testid="conversation-display-group">
      <SettingsOptionRow data-testid="font-size-row">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("settings.appearance.fontSize")}</p>
          <p
            className="text-sm font-normal text-muted-foreground/70"
            data-settings-subcopy
          >
            {t("settings.appearance.fontSizeHint")}
          </p>
        </div>
        <SegmentedControl
          size="wide"
          legend={t("settings.appearance.fontSize")}
          onPreviewChange={previewFontSize}
          onValueChange={setFontSize}
          optionTestIdPrefix="font-size"
          options={fontSizeOptions(t)}
          testId="font-size-control"
          value={fontSize}
        />
      </SettingsOptionRow>
      <SettingsOptionRow data-testid="conversation-density-row">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {t("settings.appearance.conversationDensity")}
          </p>
          <p
            className="text-sm font-normal text-muted-foreground/70"
            data-settings-subcopy
          >
            {t("settings.appearance.conversationDensityHint")}
          </p>
        </div>
        <SegmentedControl
          size="wide"
          legend={t("settings.appearance.conversationDensity")}
          onPreviewChange={previewConversationDensity}
          onValueChange={setConversationDensity}
          optionTestIdPrefix="conversation-density"
          options={conversationDensityOptions(t)}
          testId="conversation-density-control"
          value={density}
        />
      </SettingsOptionRow>
      <ConversationPreview />
    </div>
  );
}

export function LinkPreviewStyleSetting() {
  const t = useT();
  const style = useLinkPreviewStyle();
  const options = linkPreviewStyleOptions(t);
  const activeOption =
    options.find((option) => option.value === style) ?? options[0];

  return (
    <SettingsOptionRow>
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {t("settings.appearance.linkPreviewTitle")}
        </p>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {activeOption.description}
        </p>
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-7 min-w-28 justify-between gap-1.5 rounded-md border border-border/50 bg-muted/45 px-2.5 text-xs font-medium text-foreground shadow-none hover:bg-muted/70"
            data-testid="link-preview-style-trigger"
            size="sm"
            type="button"
            variant="ghost"
          >
            <span className="truncate">{activeOption.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-72 rounded-md"
          data-testid="link-preview-style-menu"
        >
          <DropdownMenuRadioGroup
            onValueChange={(next) =>
              setLinkPreviewStyle(next as LinkPreviewStyle)
            }
            value={style}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                data-testid={`link-preview-style-${option.value}`}
                key={option.value}
                value={option.value}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-2xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingsOptionRow>
  );
}

function threadViewModeOptions(t: TranslateFn) {
  return [
    {
      value: "focus" as const,
      label: t("settings.appearance.threadFocus"),
      description: t("settings.appearance.threadFocusDesc"),
    },
    {
      value: "split" as const,
      label: t("settings.appearance.threadSplit"),
      description: t("settings.appearance.threadSplitDesc"),
    },
  ];
}

/** Native window glass rows sit below theme and accent choices. */
export function GlassBackgroundSetting() {
  const {
    glassBackground,
    glassBackgroundSupported,
    glassOpacity,
    setGlassBackground,
    setGlassOpacity,
  } = useTheme();
  const t = useT();
  const shouldReduceMotion = useReducedMotion();

  if (isLinuxPlatform()) return null;

  const shouldShowOpacity = glassBackgroundSupported && glassBackground;
  const opacityRow = (
    <SettingsOptionRow data-testid="glass-opacity-row">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t("settings.appearance.glassOpacity")}</p>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
          id="glass-opacity-description"
        >
          {t("settings.appearance.glassOpacityHint")}
        </p>
      </div>
      <div className="flex w-64 shrink-0 items-center">
        <AvatarFramingSlider
          ariaDescribedBy="glass-opacity-description"
          ariaLabel={t("settings.appearance.glassOpacity")}
          ariaValueText={`${glassOpacity}% opacity`}
          compact
          handleAlwaysVisible
          max={GLASS_OPACITY_MAX}
          min={GLASS_OPACITY_MIN}
          onChange={setGlassOpacity}
          onReset={() => setGlassOpacity(DEFAULT_GLASS_OPACITY)}
          resetLabel={t("settings.appearance.glassOpacityReset")}
          resetTestId="glass-opacity-reset"
          resetValue={DEFAULT_GLASS_OPACITY}
          testId="glass-opacity-slider"
          value={glassOpacity}
        />
      </div>
    </SettingsOptionRow>
  );

  return (
    <>
      <SettingsOptionRow data-testid="glass-background-row">
        <div className="min-w-0">
          <label
            className="text-sm font-medium"
            htmlFor="glass-background-switch"
          >
            {t("settings.appearance.glassBackground")}
          </label>
          <p
            className="text-sm font-normal text-muted-foreground/70"
            data-settings-subcopy
          >
            {glassBackgroundSupported
              ? t("settings.appearance.glassBackgroundHint")
              : t("settings.appearance.glassBackgroundUnsupported")}
          </p>
        </div>
        <Switch
          checked={glassBackgroundSupported && glassBackground}
          data-testid="glass-background-toggle"
          disabled={!glassBackgroundSupported}
          id="glass-background-switch"
          onCheckedChange={setGlassBackground}
        />
      </SettingsOptionRow>
      {shouldReduceMotion ? (
        shouldShowOpacity ? (
          opacityRow
        ) : null
      ) : (
        <AnimatePresence initial={false}>
          {shouldShowOpacity ? (
            <motion.div
              animate={{ height: "auto", opacity: 1, y: 0 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0, y: -6 }}
              initial={{ height: 0, opacity: 0, y: -6 }}
              key="glass-opacity"
              transition={{
                duration: 0.25,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              {opacityRow}
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </>
  );
}

/** Compact thread preference row in the Appearance preferences card. */
export function ThreadLayoutSetting() {
  const t = useT();
  const threadViewMode = useThreadViewMode();
  const { communities } = useCommunities();
  const showCommunityScope = communities.length > 1;
  const options = threadViewModeOptions(t);
  const activeOption =
    options.find((option) => option.value === threadViewMode) ?? options[0];

  return (
    <SettingsOptionRow>
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {t("settings.appearance.threadLayout")}
          {showCommunityScope ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              {t("settings.appearance.threadLayoutAllCommunities")}
            </span>
          ) : null}
        </p>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {activeOption.description}
        </p>
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-7 min-w-28 justify-between gap-1.5 rounded-md border border-border/50 bg-muted/45 px-2.5 text-xs font-medium text-foreground shadow-none hover:bg-muted/70"
            data-testid="thread-layout-trigger"
            size="sm"
            type="button"
            variant="ghost"
          >
            <span className="truncate">{activeOption.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-72 rounded-md"
          data-testid="thread-layout-menu"
        >
          <DropdownMenuRadioGroup
            onValueChange={(next) => setThreadViewMode(next as ThreadViewMode)}
            value={threadViewMode}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                data-testid={`thread-layout-${option.value}`}
                key={option.value}
                value={option.value}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-2xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingsOptionRow>
  );
}

/** Accent swatches — shared by the animated and reduced-motion reveal paths. */
export function AccentPickerContent({
  accentColor,
  isDark,
  setAccentColor,
}: {
  accentColor: string;
  isDark: boolean;
  setAccentColor: (value: string) => void;
}) {
  const t = useT();
  return (
    <SettingsOptionRow className="items-start">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t("settings.appearance.accentColor")}</p>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {t("settings.appearance.accentColorHint")}
        </p>
      </div>
      <div
        className="min-w-0 max-w-[34rem] shrink-0 overflow-x-auto rounded-xl bg-muted p-2"
        data-testid="accent-color-options"
      >
        <div className="flex w-max min-w-full flex-nowrap justify-end gap-2">
          {ACCENT_COLORS.map((color) => {
            const isNeutral = color.value === NEUTRAL_ACCENT;
            const isSelected = accentColor === color.value;
            const swatchColor = isNeutral
              ? "hsl(var(--foreground))"
              : color.value;
            const selectionColor = isNeutral
              ? isDark
                ? "#000000"
                : "#FFFFFF"
              : contrastColorForBackground(color.value);

            return (
              <button
                aria-label={`Use ${color.name} accent`}
                aria-pressed={isSelected}
                className="relative h-9 w-9 shrink-0 rounded-full border border-border transition-transform duration-200 ease-out hover:scale-[1.15] focus-visible:scale-[1.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
                data-testid={`accent-color-${color.name.toLowerCase()}`}
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                style={{ backgroundColor: swatchColor }}
                title={color.name}
                type="button"
              >
                {isSelected ? (
                  <span
                    className="absolute inset-1 rounded-full border-[3px]"
                    data-testid="accent-color-selection"
                    style={{ borderColor: selectionColor }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </SettingsOptionRow>
  );
}
