import { toast } from "sonner";

import { copyTextToSystemClipboard } from "@/shared/api/tauriMedia";
import { detectLocale, translate, type MessageKey } from "@/shared/i18n";

/** Write plain text through the native clipboard integration. */
export async function writeTextToClipboard(text: string): Promise<void> {
  await copyTextToSystemClipboard(text);
}

/** Copy plain text and show standard success/error feedback. */
export function copyTextToClipboard(text: string, successMessage?: string) {
  void writeTextToClipboard(text)
    .then(() => {
      toast.success(
        successMessage ??
          translate(detectLocale(), "common.copiedClipboard" satisfies MessageKey),
      );
    })
    .catch(() => {
      toast.error(translate(detectLocale(), "common.failedCopyClipboard"));
    });
}
