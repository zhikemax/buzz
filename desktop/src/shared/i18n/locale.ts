import { en, type MessageKey } from "./messages/en";
import { zhCN } from "./messages/zh-CN";

export const LOCALE_STORAGE_KEY = "buzz-locale";

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en,
  "zh-CN": zhCN,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** Prefer stored locale, then browser language, then English. */
export function detectLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      return stored;
    }
  } catch {
    // ignore quota / privacy mode
  }

  const languages = [
    window.navigator.language,
    ...(window.navigator.languages ?? []),
  ];
  for (const language of languages) {
    const normalized = language.trim().toLowerCase();
    if (normalized === "zh-cn" || normalized === "zh" || normalized.startsWith("zh-")) {
      return "zh-CN";
    }
    if (normalized === "en" || normalized.startsWith("en-")) {
      return "en";
    }
  }
  return "en";
}

export function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / privacy mode
  }
}

export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
}

function formatMessage(
  template: string,
  params?: Record<string, string | number>,
) {
  if (!params) {
    return template;
  }
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string;
/** Translate with the persisted/detected locale — safe outside React. */
export function translate(
  key: MessageKey,
  params?: Record<string, string | number>,
): string;
export function translate(
  localeOrKey: Locale | MessageKey,
  keyOrParams?: MessageKey | Record<string, string | number>,
  params?: Record<string, string | number>,
): string {
  if (isLocale(localeOrKey)) {
    const key = keyOrParams as MessageKey;
    const catalog = catalogs[localeOrKey] ?? catalogs.en;
    const template = catalog[key] ?? catalogs.en[key] ?? key;
    return formatMessage(template, params);
  }
  const catalog = catalogs[detectLocale()] ?? catalogs.en;
  const template = catalog[localeOrKey] ?? catalogs.en[localeOrKey] ?? localeOrKey;
  return formatMessage(
    template,
    keyOrParams as Record<string, string | number> | undefined,
  );
}

export type { MessageKey };
