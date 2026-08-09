import * as React from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CircleArrowUp, ExternalLink } from "lucide-react";

import { useUpdaterContext } from "./hooks/UpdaterProvider";
import { shouldShowSidebarUpdateCard } from "./sidebarUpdateCardVisibility";
import { SidebarCompactActionCard } from "@/shared/ui/sidebar-action-card";
import { Spinner } from "@/shared/ui/spinner";
import { useT } from "@/shared/i18n";

type SidebarUpdateCardProps = {
  onDismiss: () => void;
};

type SidebarUpdateCompactCardProps = SidebarUpdateCardProps & {
  actionTestId?: string;
  testId?: string;
};

export function SidebarUpdateCompactCard({
  actionTestId,
  onDismiss,
  testId = "sidebar-update-card-compact",
}: SidebarUpdateCompactCardProps) {
  const t = useT();
  const { installAndRelaunch, status } = useUpdaterContext();
  const [isUpdatePending, setIsUpdatePending] = React.useState(false);
  const updatePendingRef = React.useRef(false);
  const updateFrameRef = React.useRef<number | null>(null);
  const updateTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (updateFrameRef.current !== null) {
        window.cancelAnimationFrame(updateFrameRef.current);
      }
      if (updateTimeoutRef.current !== null) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      updatePendingRef.current = false;
    };
  }, []);

  const handleUpdate = React.useCallback(() => {
    if (updatePendingRef.current) {
      return;
    }

    updatePendingRef.current = true;
    setIsUpdatePending(true);
    updateFrameRef.current = window.requestAnimationFrame(() => {
      updateFrameRef.current = null;
      updateTimeoutRef.current = window.setTimeout(() => {
        updateTimeoutRef.current = null;
        void installAndRelaunch()
          .catch((error) => {
            console.error("[SidebarUpdateCard] update failed:", error);
          })
          .finally(() => {
            updatePendingRef.current = false;
            setIsUpdatePending(false);
          });
      }, 0);
    });
  }, [installAndRelaunch]);

  const pending = isUpdatePending || status.state === "installing";

  return (
    <SidebarCompactActionCard
      actionAriaLabel={t("update.now")}
      actionDisabled={pending}
      actionTestId={actionTestId}
      description={pending ? t("update.updating") : t("update.clickToUpdate")}
      dismissLabel={t("update.dismiss")}
      icon={
        pending ? (
          <Spinner aria-hidden="true" className="h-5 w-5 border-2" />
        ) : (
          <CircleArrowUp aria-hidden="true" className="h-5 w-5" />
        )
      }
      iconKey={pending ? "pending" : "idle"}
      onAction={handleUpdate}
      onDismiss={onDismiss}
      testId={testId}
      title={t("update.ready")}
    />
  );
}

export function SidebarUpdateCard({ onDismiss }: SidebarUpdateCardProps) {
  const t = useT();
  const { status } = useUpdaterContext();

  if (!shouldShowSidebarUpdateCard(status)) {
    return null;
  }

  if (status.state === "manual-required") {
    return (
      <SidebarCompactActionCard
        actionAriaLabel={t("update.downloadGithub")}
        actionTestId="sidebar-update-download-github"
        description={t("update.appImageHint", { version: status.version })}
        dismissLabel={t("update.dismiss")}
        icon={<ExternalLink aria-hidden="true" className="h-5 w-5" />}
        iconKey="manual"
        onAction={() => void openUrl(status.releaseUrl)}
        onDismiss={onDismiss}
        testId="sidebar-update-card-manual"
        title={t("update.available")}
      />
    );
  }

  return (
    <SidebarUpdateCompactCard
      actionTestId="sidebar-update-now"
      onDismiss={onDismiss}
      testId="sidebar-update-card"
    />
  );
}
