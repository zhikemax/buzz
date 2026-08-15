/**
 * Shared date/time formatters for the message timeline.
 *
 * - `formatTime` — short clock time ("2:34 PM"), used in message rows.
 * - `formatFullDateTime` — verbose string for tooltips
 *   ("Wednesday, April 2, 2026 at 2:34 PM").
 * - `isSameDay` — compare two unix-second timestamps.
 *
 * Relative labels ("Today", "Yesterday", "June 20", "Yesterday at 9:05 AM") are
 * not here: chat and the Inbox share them from `shared/lib/datetime.ts`. What
 * stays in this file is the absolute end of the range — a bare clock time, the
 * verbose tooltip string, and same-day comparison.
 *
 * `formatTime` is for places with only enough room for a clock: the hover gutter
 * that replaces the avatar on continuation rows. A message header uses the
 * relative ladder instead, because the day divider that supplies its date
 * scrolls away while the messages under it stay on screen.
 *
 * Locale follows `getDateFormatLocale` (wired from LocaleProvider).
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

function shortMonthDayFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlDateLocale(), {
    month: "short",
    day: "numeric",
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

/** Short month + day, e.g. "May 19". No ordinal suffix, per the writing standard. */
export function formatShortMonthDay(unixSeconds: number): string {
  return shortMonthDayFormatter().format(new Date(unixSeconds * 1_000));
}

/**
 * Relative thread-summary timestamp with expanded units, e.g. "3 hours ago",
 * falling back to "on May 19" for older replies.
 */
export function formatThreadSummaryLastReplyTime(
  unixSeconds: number,
  nowSeconds = Date.now() / 1_000,
): string {
  const diff = Math.max(0, nowSeconds - unixSeconds);

  if (diff < 60) return t("time.justNow");
  if (diff < 3_600) {
    const count = Math.floor(diff / 60);
    return count === 1 ? t("time.minuteAgo") : t("time.minutesAgo", { count });
  }
  if (diff < 86_400) {
    const count = Math.floor(diff / 3_600);
    return count === 1 ? t("time.hourAgo") : t("time.hoursAgo", { count });
  }
  if (diff < 604_800) {
    const count = Math.floor(diff / 86_400);
    return count === 1 ? t("time.dayAgo") : t("time.daysAgo", { count });
  }

  return t("time.onDate", { date: formatShortMonthDay(unixSeconds) });
}

function isSameDayDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Compact relative time for cards (m/h/d/w). */
export function formatRelativeTimeCompact(
  unixSeconds: number,
  nowSeconds = Date.now() / 1_000,
): string {
  const diff = Math.max(0, nowSeconds - unixSeconds);
  if (diff < 60) return t("time.justNow");
  if (diff < 3_600) {
    return t("time.compactMinutesAgo", { count: Math.floor(diff / 60) });
  }
  if (diff < 86_400) {
    return t("time.compactHoursAgo", { count: Math.floor(diff / 3_600) });
  }
  if (diff < 604_800) {
    return t("time.compactDaysAgo", { count: Math.floor(diff / 86_400) });
  }
  return t("time.compactWeeksAgo", {
    count: Math.max(1, Math.floor(diff / 604_800)),
  });
}
