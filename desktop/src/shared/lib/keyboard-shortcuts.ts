import type { MessageKey } from "@/shared/i18n";
import { isMacPlatform } from "@/shared/lib/platform";

export const HUDDLE_SHORTCUT_EVENT = "buzz:huddle-shortcut";

export type HuddleShortcutDetail = {
  channelId: string;
};

export type ShortcutCategoryId =
  | "navigation"
  | "messages"
  | "formatting"
  | "zoom";

export type KeyboardShortcut = {
  id: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  keys: string;
  keysWindows: string;
  category: ShortcutCategoryId;
};

const CATEGORY_LABEL_KEYS: Record<ShortcutCategoryId, MessageKey> = {
  navigation: "settings.shortcuts.category.navigation",
  messages: "settings.shortcuts.category.messages",
  formatting: "settings.shortcuts.category.formatting",
  zoom: "settings.shortcuts.category.zoom",
};

export function shortcutCategoryLabelKey(
  category: ShortcutCategoryId,
): MessageKey {
  return CATEGORY_LABEL_KEYS[category];
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  {
    id: "quick-search",
    labelKey: "settings.shortcuts.quickSearch.label",
    descriptionKey: "settings.shortcuts.quickSearch.description",
    keys: "⌘K",
    keysWindows: "Ctrl+K",
    category: "navigation",
  },
  {
    id: "browse-channels",
    labelKey: "settings.shortcuts.browseChannels.label",
    descriptionKey: "settings.shortcuts.browseChannels.description",
    keys: "⇧⌘O",
    keysWindows: "Shift+Ctrl+O",
    category: "navigation",
  },
  {
    id: "browse-dms",
    labelKey: "settings.shortcuts.browseDms.label",
    descriptionKey: "settings.shortcuts.browseDms.description",
    keys: "⇧⌘K",
    keysWindows: "Shift+Ctrl+K",
    category: "navigation",
  },
  {
    id: "new-channel",
    labelKey: "settings.shortcuts.newChannel.label",
    descriptionKey: "settings.shortcuts.newChannel.description",
    keys: "⇧⌘N",
    keysWindows: "Shift+Ctrl+N",
    category: "navigation",
  },
  {
    id: "open-settings",
    labelKey: "settings.shortcuts.openSettings.label",
    descriptionKey: "settings.shortcuts.openSettings.description",
    keys: "⌘,",
    keysWindows: "Ctrl+,",
    category: "navigation",
  },
  {
    id: "go-back",
    labelKey: "settings.shortcuts.goBack.label",
    descriptionKey: "settings.shortcuts.goBack.description",
    keys: "⌘[",
    keysWindows: "Alt+←",
    category: "navigation",
  },
  {
    id: "go-forward",
    labelKey: "settings.shortcuts.goForward.label",
    descriptionKey: "settings.shortcuts.goForward.description",
    keys: "⌘]",
    keysWindows: "Alt+→",
    category: "navigation",
  },
  {
    id: "find-in-channel",
    labelKey: "settings.shortcuts.findInChannel.label",
    descriptionKey: "settings.shortcuts.findInChannel.description",
    keys: "⌘F",
    keysWindows: "Ctrl+F",
    category: "navigation",
  },
  {
    id: "go-home",
    labelKey: "settings.shortcuts.goHome.label",
    descriptionKey: "settings.shortcuts.goHome.description",
    keys: "⇧⌘A",
    keysWindows: "Shift+Ctrl+A",
    category: "navigation",
  },
  {
    id: "toggle-sidebar",
    labelKey: "settings.shortcuts.toggleSidebar.label",
    descriptionKey: "settings.shortcuts.toggleSidebar.description",
    keys: "⌘S",
    keysWindows: "Ctrl+S",
    category: "navigation",
  },
  {
    id: "mark-current-read",
    labelKey: "settings.shortcuts.markCurrentRead.label",
    descriptionKey: "settings.shortcuts.markCurrentRead.description",
    keys: "Escape",
    keysWindows: "Escape",
    category: "navigation",
  },
  {
    id: "mark-all-read",
    labelKey: "settings.shortcuts.markAllRead.label",
    descriptionKey: "settings.shortcuts.markAllRead.description",
    keys: "⇧Escape",
    keysWindows: "Shift+Escape",
    category: "navigation",
  },

  // Zoom
  {
    id: "zoom-in",
    labelKey: "settings.shortcuts.zoomIn.label",
    descriptionKey: "settings.shortcuts.zoomIn.description",
    keys: "⌘+",
    keysWindows: "Ctrl+=",
    category: "zoom",
  },
  {
    id: "zoom-out",
    labelKey: "settings.shortcuts.zoomOut.label",
    descriptionKey: "settings.shortcuts.zoomOut.description",
    keys: "⌘-",
    keysWindows: "Ctrl+-",
    category: "zoom",
  },
  {
    id: "zoom-reset",
    labelKey: "settings.shortcuts.zoomReset.label",
    descriptionKey: "settings.shortcuts.zoomReset.description",
    keys: "⌘0",
    keysWindows: "Ctrl+0",
    category: "zoom",
  },

  // Messages
  {
    id: "send-message",
    labelKey: "settings.shortcuts.sendMessage.label",
    descriptionKey: "settings.shortcuts.sendMessage.description",
    keys: "Enter",
    keysWindows: "Enter",
    category: "messages",
  },
  {
    id: "new-line",
    labelKey: "settings.shortcuts.newLine.label",
    descriptionKey: "settings.shortcuts.newLine.description",
    keys: "Shift+Enter",
    keysWindows: "Shift+Enter",
    category: "messages",
  },
  {
    id: "publish-note",
    labelKey: "settings.shortcuts.publishNote.label",
    descriptionKey: "settings.shortcuts.publishNote.description",
    keys: "⌘Enter",
    keysWindows: "Ctrl+Enter",
    category: "messages",
  },
  {
    id: "close-dialog",
    labelKey: "settings.shortcuts.closeDialog.label",
    descriptionKey: "settings.shortcuts.closeDialog.description",
    keys: "Escape",
    keysWindows: "Escape",
    category: "messages",
  },
  {
    id: "toggle-huddle",
    labelKey: "settings.shortcuts.toggleHuddle.label",
    descriptionKey: "settings.shortcuts.toggleHuddle.description",
    keys: "Ctrl+Shift+Space",
    keysWindows: "Ctrl+Shift+Space",
    category: "messages",
  },
  {
    id: "push-to-talk",
    labelKey: "settings.shortcuts.pushToTalk.label",
    descriptionKey: "settings.shortcuts.pushToTalk.description",
    keys: "Ctrl+Space",
    keysWindows: "Ctrl+Space",
    category: "messages",
  },

  // Formatting
  {
    id: "format-bold",
    labelKey: "settings.shortcuts.formatBold.label",
    descriptionKey: "settings.shortcuts.formatBold.description",
    keys: "⌘B",
    keysWindows: "Ctrl+B",
    category: "formatting",
  },
  {
    id: "format-italic",
    labelKey: "settings.shortcuts.formatItalic.label",
    descriptionKey: "settings.shortcuts.formatItalic.description",
    keys: "⌘I",
    keysWindows: "Ctrl+I",
    category: "formatting",
  },
  {
    id: "format-strikethrough",
    labelKey: "settings.shortcuts.formatStrikethrough.label",
    descriptionKey: "settings.shortcuts.formatStrikethrough.description",
    keys: "⌘⇧X",
    keysWindows: "Ctrl+Shift+X",
    category: "formatting",
  },
  {
    id: "format-code",
    labelKey: "settings.shortcuts.formatCode.label",
    descriptionKey: "settings.shortcuts.formatCode.description",
    keys: "⌘E",
    keysWindows: "Ctrl+E",
    category: "formatting",
  },
  {
    id: "format-link",
    labelKey: "settings.shortcuts.formatLink.label",
    descriptionKey: "settings.shortcuts.formatLink.description",
    keys: "⌘K",
    keysWindows: "Ctrl+K",
    category: "formatting",
  },
];

const CATEGORY_ORDER: ShortcutCategoryId[] = [
  "navigation",
  "messages",
  "formatting",
  "zoom",
];

export function getShortcutsByCategory(): Map<
  ShortcutCategoryId,
  KeyboardShortcut[]
> {
  const map = new Map<ShortcutCategoryId, KeyboardShortcut[]>();
  for (const cat of CATEGORY_ORDER) {
    map.set(
      cat,
      KEYBOARD_SHORTCUTS.filter((s) => s.category === cat),
    );
  }
  return map;
}

export function getPlatformKeys(shortcut: KeyboardShortcut): string {
  return isMacPlatform() ? shortcut.keys : shortcut.keysWindows;
}

/**
 * Platform-appropriate key hint for a shortcut in {@link KEYBOARD_SHORTCUTS},
 * or null when the id is unknown. Use this for inline hints (menus, tooltips)
 * so they stay in sync with the canonical shortcut registry.
 */
export function getPlatformKeysById(id: string): string | null {
  const shortcut = KEYBOARD_SHORTCUTS.find((s) => s.id === id);
  return shortcut ? getPlatformKeys(shortcut) : null;
}
