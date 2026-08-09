import type { Locale } from "./locale";

let activeLocale: Locale = "en";

/** Keep shared date/time formatters in sync with the app locale. */
export function setDateFormatLocale(locale: Locale) {
  activeLocale = locale;
}

export function getDateFormatLocale(): Locale {
  return activeLocale;
}

/** BCP 47 tag for `Intl.DateTimeFormat`. */
export function intlDateLocale(): string {
  return activeLocale === "zh-CN" ? "zh-CN" : "en-US";
}
