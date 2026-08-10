import * as React from "react";

import { EmojiPicker } from "@/features/custom-emoji/ui/EmojiPicker";
import { StatusEmoji } from "@/features/user-status/ui/StatusEmoji";
import { useT, type MessageKey } from "@/shared/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const PRESETS: ReadonlyArray<{
  id: string;
  textKey: MessageKey;
  emoji: string;
}> = [
  {
    id: "in-a-meeting",
    textKey: "status.preset.meeting",
    emoji: "\uD83D\uDDE3\uFE0F",
  },
  { id: "commuting", textKey: "status.preset.commuting", emoji: "\uD83D\uDE8C" },
  { id: "out-sick", textKey: "status.preset.outSick", emoji: "\uD83E\uDD12" },
  {
    id: "vacationing",
    textKey: "status.preset.vacationing",
    emoji: "\uD83C\uDFD6\uFE0F",
  },
  {
    id: "working-remotely",
    textKey: "status.preset.workingRemotely",
    emoji: "\uD83C\uDFE0",
  },
];

type SetStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
  initialEmoji?: string;
  onSave: (text: string, emoji: string) => void;
  onClear: () => void;
  hasExistingStatus: boolean;
};

export function SetStatusDialog({
  open,
  onOpenChange,
  initialText = "",
  initialEmoji = "",
  onSave,
  onClear,
  hasExistingStatus,
}: SetStatusDialogProps) {
  const t = useT();
  const [text, setText] = React.useState(initialText);
  const [emoji, setEmoji] = React.useState(initialEmoji);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setText(initialText);
      setEmoji(initialEmoji);
    }
  }, [open, initialText, initialEmoji]);

  function handlePresetClick(preset: { text: string; emoji: string }) {
    setText(preset.text);
    setEmoji(preset.emoji);
  }

  function handleEmojiSelect(selectedEmoji: string) {
    setEmoji(selectedEmoji);
    setPickerOpen(false);
  }

  function handleSave() {
    onSave(text.trim(), emoji);
    onOpenChange(false);
  }

  function handleClear() {
    onClear();
    onOpenChange(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        data-testid="set-status-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("status.title")}</DialogTitle>
          <DialogDescription>{t("status.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
              <div className="relative shrink-0">
                <PopoverTrigger asChild>
                  <button
                    aria-label={t("status.chooseEmojiAria")}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-lg transition-colors hover:bg-accent"
                    type="button"
                  >
                    {emoji ? (
                      <StatusEmoji className="h-5 w-5" value={emoji} />
                    ) : (
                      "\uD83D\uDCAC"
                    )}
                  </button>
                </PopoverTrigger>
                {emoji ? (
                  <button
                    aria-label={t("status.clearEmojiAria")}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-muted text-2xs leading-none text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEmoji("");
                    }}
                    type="button"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <PopoverContent
                align="start"
                sideOffset={4}
                className="w-auto overflow-hidden rounded-2xl p-0"
              >
                <EmojiPicker autoFocus onSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
            <Input
              autoFocus
              data-testid="set-status-input"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("status.placeholder")}
              value={text}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const presetText = t(preset.textKey);
              return (
                <button
                  className="rounded-full border border-input px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  data-testid={`set-status-preset-${preset.id}`}
                  key={preset.id}
                  onClick={() =>
                    handlePresetClick({ text: presetText, emoji: preset.emoji })
                  }
                  type="button"
                >
                  {preset.emoji} {presetText}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              {hasExistingStatus ? (
                <Button
                  data-testid="set-status-clear"
                  onClick={handleClear}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {t("status.clear")}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="set-status-cancel"
                onClick={() => onOpenChange(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t("common.cancel")}
              </Button>
              <Button
                data-testid="set-status-save"
                disabled={!text.trim() && !emoji}
                onClick={handleSave}
                size="sm"
                type="button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
