import * as React from "react";

import { Badge } from "@/shared/ui/badge";
import type { ManagedAgent, PresenceStatus } from "@/shared/api/types";
import { useT, type TranslateFn } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

/** Grace period after mount before treating "running + no presence" as "Starting…" */
const PRESENCE_GRACE_MS = 15_000;

function statusLabel(status: ManagedAgent["status"], t: TranslateFn): string {
  switch (status) {
    case "running":
      return t("agents.statusRunning");
    case "stopped":
      return t("agents.statusStopped");
    case "deployed":
      return t("agents.statusDeployed");
    default:
      return status.replace(/_/g, " ");
  }
}

export function AgentStatusBadge({
  className,
  isWorking,
  presenceLoaded,
  presenceStatus,
  sentenceCase = false,
  status,
}: {
  className?: string;
  isWorking?: boolean;
  presenceLoaded: boolean;
  presenceStatus: PresenceStatus | undefined;
  sentenceCase?: boolean;
  status: ManagedAgent["status"];
}) {
  const t = useT();
  const [inGracePeriod, setInGracePeriod] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setInGracePeriod(false), PRESENCE_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);

  const isActive = status === "running" || status === "deployed";
  const isStarting =
    !inGracePeriod &&
    presenceLoaded &&
    status === "running" &&
    (!presenceStatus || presenceStatus === "offline");

  const variant: "default" | "warning" | "secondary" = isWorking
    ? "default"
    : isStarting
      ? "warning"
      : isActive
        ? "default"
        : "secondary";

  const rawLabel = isWorking
    ? t("sidebar.working")
    : isStarting
      ? t("agents.starting")
      : statusLabel(status, t);
  const label = sentenceCase
    ? `${rawLabel.charAt(0).toUpperCase()}${rawLabel.slice(1)}`
    : rawLabel;

  return (
    <Badge
      className={cn(className, isWorking && "motion-safe:animate-pulse")}
      variant={variant}
    >
      {label}
    </Badge>
  );
}
