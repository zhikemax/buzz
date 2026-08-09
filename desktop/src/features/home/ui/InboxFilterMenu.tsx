import { ChevronDown } from "lucide-react";

import type { InboxFilter } from "@/features/home/lib/inbox";
import { useT, type MessageKey } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const INBOX_FILTER_OPTIONS: Array<{
  labelKey: MessageKey;
  value: InboxFilter;
}> = [
  { value: "all", labelKey: "inbox.filter.all" },
  { value: "project", labelKey: "inbox.filter.project" },
  { value: "mention", labelKey: "inbox.filter.mention" },
  { value: "thread", labelKey: "inbox.filter.thread" },
  { value: "needs_action", labelKey: "inbox.filter.needsAction" },
  { value: "agent_activity", labelKey: "inbox.filter.agentActivity" },
  { value: "reminders", labelKey: "inbox.filter.reminders" },
  { value: "drafts", labelKey: "inbox.filter.drafts" },
];

const TRIGGER_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-muted/70 data-[state=open]:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative -ml-2 w-auto gap-1 px-2 text-sm font-medium text-foreground";

type InboxFilterMenuProps = {
  activeDraftCount: number;
  dueReminderCount: number;
  filter: InboxFilter;
  onFilterChange: (value: InboxFilter) => void;
  reminderCount: number;
};

export function InboxFilterMenu({
  activeDraftCount,
  dueReminderCount,
  filter,
  onFilterChange,
  reminderCount,
}: InboxFilterMenuProps) {
  const t = useT();
  const activeFilter = INBOX_FILTER_OPTIONS.find(
    (option) => option.value === filter,
  );
  const activeFilterLabel = t(activeFilter?.labelKey ?? "inbox.filter.all");
  const statusLabel =
    dueReminderCount > 0
      ? t(
          dueReminderCount === 1
            ? "inbox.dueReminderOne"
            : "inbox.dueReminderMany",
          { count: dueReminderCount },
        )
      : activeDraftCount > 0
        ? t(
            activeDraftCount === 1
              ? "inbox.activeDraftOne"
              : "inbox.activeDraftMany",
            { count: activeDraftCount },
          )
        : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={
            statusLabel
              ? t("inbox.filterAriaWithStatus", {
                  filter: activeFilterLabel,
                  status: statusLabel,
                })
              : t("inbox.filterAria", { filter: activeFilterLabel })
          }
          className={cn(TRIGGER_CLASS)}
          data-testid="inbox-filter-trigger"
          type="button"
        >
          <span>{activeFilterLabel}</span>
          <ChevronDown className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuRadioGroup
          onValueChange={(value) => onFilterChange(value as InboxFilter)}
          value={filter}
        >
          {INBOX_FILTER_OPTIONS.map((option) => (
            <div key={option.value}>
              {option.value === "reminders" ? (
                <DropdownMenuSeparator className="my-2 bg-border/60" />
              ) : null}
              <DropdownMenuRadioItem value={option.value}>
                <span className="flex flex-1 items-center gap-2">
                  <span>{t(option.labelKey)}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    {option.value === "reminders" && reminderCount > 0 ? (
                      <span
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-semibold leading-none text-primary-foreground"
                        data-testid="inbox-reminder-badge-option"
                      >
                        {reminderCount}
                      </span>
                    ) : option.value === "drafts" && activeDraftCount > 0 ? (
                      <span
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-semibold leading-none text-primary-foreground"
                        data-testid="inbox-draft-badge-option"
                      >
                        {activeDraftCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
