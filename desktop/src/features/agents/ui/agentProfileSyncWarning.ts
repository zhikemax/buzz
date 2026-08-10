import { toast } from "sonner";

import type { TranslateFn } from "@/shared/i18n";

export function showAgentProfileSyncWarning(
  agentName: string,
  profileSyncError: string | null,
  t: TranslateFn,
) {
  if (!profileSyncError) return;
  toast.warning(
    t("agents.profileSyncWarning", {
      name: agentName,
      error: profileSyncError,
    }),
  );
}
