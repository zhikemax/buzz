/**
 * Shared date/time formatters for the message timeline.
 *
 * - `formatTime` — short clock time ("2:34 PM"), used in message rows.
 * - `formatFullDateTime` — verbose string for tooltips
 *   ("Wednesday, April 2, 2026 at 2:34 PM").
 * - `formatDayHeading` — label for day dividers / sticky headers.
 *   Returns "Today", "Yesterday", or a localized date.
 * - `isSameDay` — compare two unix-second timestamps.
 *
 * Locale follows `setDateFormatLocale` (wired from LocaleProvider).
 */

import {
  getDateFormatLocale,
  intlDateLocale,
} from "@/shared/i18n/dateLocale";
import { translate, type MessageKey } from "@/shared/i18n/locale";

function t(
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  return translate(getDateFormatLocale(), key, params);
}

function timeFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fullDateTimeFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function weekdayFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    weekday: "long",
  });
}

function longMonthFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    month: "long",
  });
}

function shortMonthFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    month: "short",
  });
}

const DAY_PERIOD_SUFFIX_RE = /[\s\u00a0\u202f]*(?:AM|PM|上午|下午)$/i;

/** Short clock time, e.g. "2:34 PM". */
export function formatTime(unixSeconds: number): string {
  return timeFormatter().format(new Date(unixSeconds * 1_000));
}

/** Short clock time with the AM/PM marker removed, e.g. "2:34". */
export function formatTimeWithoutDayPeriod(time: string): string {
  return time.replace(DAY_PERIOD_SUFFIX_RE, "").trim();
}

/** Full date + time for tooltips, e.g. "Wednesday, April 2, 2026 at 2:34 PM". */
export function formatFullDateTime(unixSeconds: number): string {
  return fullDateTimeFormatter().format(new Date(unixSeconds * 1_000));
}

/**
 * Human-friendly day label for dividers and sticky headers.
 * Returns "Today", "Yesterday", or a localized calendar date.
 */
export function formatDayHeading(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1_000);
  const now = new Date();

  if (isSameDayDate(date, now)) {
    return t("time.today");
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDayDate(date, yesterday)) {
    return t("time.yesterday");
  }

  if (getDateFormatLocale() === "zh-CN") {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = "numeric";
    }
    return new Intl.DateTimeFormat("zh-CN", options).format(date);
  }

  const dateLabel = `${weekdayFormatter().format(date)}, ${formatMonthDayOrdinal(
    date,
    longMonthFormatter(),
  )}`;
  return date.getFullYear() === now.getFullYear()
    ? dateLabel
    : `${dateLabel}, ${date.getFullYear()}`;
}

/** True when two unix-second timestamps fall on the same calendar day (local time). */
export function isSameDay(a: number, b: number): boolean {
  return isSameDayDate(new Date(a * 1_000), new Date(b * 1_000));
}

/**
 * Unix-seconds timestamp of local midnight for the calendar day containing
 * `unixSeconds`. Two timestamps on the same calendar day map to the same value,
 * so it is a stable identifier for a day group that does not shift when an
 * older message is prepended into that day.
 */
export function startOfLocalDaySeconds(unixSeconds: number): number {
  const date = new Date(unixSeconds * 1_000);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1_000);
}

/** Short month + ordinal day, e.g. "May 19th" (en) or "5月19日" (zh-CN). */
export function formatShortMonthDayOrdinal(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1_000);
  if (getDateFormatLocale() === "zh-CN") {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
    }).format(date);
  }
  return formatMonthDayOrdinal(date, shortMonthFormatter());
}

/**
 * Compact relative time for lists (forum, pulse, search-style): "just now",
 * "3m ago", "2h ago", "5d ago", or a short calendar date for older items.
 */
export function formatRelativeTimeCompact(unixSeconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1_000);
  const diff = Math.max(0, nowSeconds - unixSeconds);

  if (diff < 60) return t("search.justNow");
  if (diff < 3_600) {
    return t("search.minutesAgo", { count: Math.floor(diff / 60) });
  }
  if (diff < 86_400) {
    return t("search.hoursAgo", { count: Math.floor(diff / 3_600) });
  }
  if (diff < 604_800) {
    return t("search.daysAgo", { count: Math.floor(diff / 86_400) });
  }

  return new Intl.DateTimeFormat(intlDateLocale(), {
    month: "short",
    day: "numeric",
  }).format(new Date(unixSeconds * 1_000));
}

/**
 * Relative thread-summary timestamp with expanded units, e.g. "3 hours ago",
 * falling back to "on May 19th" for older replies.
 */
export function formatThreadSummaryLastReplyTime(
  unixSeconds: number,
  nowSeconds = Date.now() / 1_000,
): string {
  const diff = Math.max(0, nowSeconds - unixSeconds);

  if (diff < 60) return t("time.justNow");
  if (diff < 3_600) {
    const count = Math.floor(diff / 60);
    return count === 1
      ? t("time.minuteAgo")
      : t("time.minutesAgo", { count });
  }
  if (diff < 86_400) {
    const count = Math.floor(diff / 3_600);
    return count === 1 ? t("time.hourAgo") : t("time.hoursAgo", { count });
  }
  if (diff < 604_800) {
    const count = Math.floor(diff / 86_400);
    return count === 1 ? t("time.dayAgo") : t("time.daysAgo", { count });
  }

  return t("time.onDate", { date: formatShortMonthDayOrdinal(unixSeconds) });
}

function isSameDayDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthDayOrdinal(
  date: Date,
  monthFormatter: Intl.DateTimeFormat,
): string {
  return `${monthFormatter.format(date)} ${date.getDate()}${ordinalSuffix(
    date.getDate(),
  )}`;
}

function ordinalSuffix(day: number): string {
  const lastTwoDigits = day % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
