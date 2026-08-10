import { ChevronDown, ChevronUp, X } from "lucide-react";
import * as React from "react";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type ChannelFindBarProps = {
  matchCount: number;
  matchIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onQueryChange: (query: string) => void;
  query: string;
};

export function ChannelFindBar({
  matchCount,
  matchIndex,
  onClose,
  onNext,
  onPrevious,
  onQueryChange,
  query,
}: ChannelFindBarProps) {
  const t = useT();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    }
  };

  const matchLabel =
    query.length >= 2
      ? matchCount > 0
        ? t("channel.find.matchOf", {
            current: matchIndex + 1,
            total: matchCount,
          })
        : t("channel.find.noResults")
      : null;

  return (
    <div
      className="flex items-center gap-1.5 border-b border-border/80 bg-background px-3 py-1.5"
      data-testid="channel-find-bar"
    >
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect="off"
          className={cn(
            "h-7 w-full rounded-md border border-input bg-transparent px-2 pr-20 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          )}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("settings.shortcuts.findInChannel.label")}
          spellCheck={false}
          type="text"
          value={query}
        />
        {matchLabel ? (
          <span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
            {matchLabel}
          </span>
        ) : null}
      </div>

      <Button
        aria-label={t("channel.find.prevAria")}
        className="h-7 w-7"
        disabled={matchCount === 0}
        onClick={onPrevious}
        size="icon"
        variant="ghost"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>

      <Button
        aria-label={t("channel.find.nextAria")}
        className="h-7 w-7"
        disabled={matchCount === 0}
        onClick={onNext}
        size="icon"
        variant="ghost"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>

      <Button
        aria-label={t("channel.find.closeAria")}
        className="h-7 w-7"
        onClick={onClose}
        size="icon"
        variant="ghost"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
