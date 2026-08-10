import type { ManagedAgent } from "@/shared/api/types";
import { useT } from "@/shared/i18n";

type AddChannelBotReuseGuardProps = {
  reusableAgent: ManagedAgent;
  forceNew: boolean;
  onForceNewChange: (forceNew: boolean) => void;
  disabled: boolean;
};

export function AddChannelBotReuseGuard({
  reusableAgent,
  forceNew,
  onForceNewChange,
  disabled,
}: AddChannelBotReuseGuardProps) {
  const t = useT();
  const statusLabel =
    reusableAgent.status === "running" || reusableAgent.status === "deployed"
      ? t("channel.addBot.statusRunning")
      : t("channel.addBot.statusStopped");

  return (
    <div className="space-y-2" data-testid="agent-instance-mode">
      <label className="text-sm font-medium" htmlFor="agent-instance-mode">
        {t("channel.addBot.instanceLabel")}
      </label>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
        disabled={disabled}
        id="agent-instance-mode"
        onChange={(e) => onForceNewChange(e.target.value === "new")}
        value={forceNew ? "new" : "reuse"}
      >
        <option value="reuse">{t("channel.addBot.reuseExisting")}</option>
        <option value="new">{t("channel.addBot.createNewInstance")}</option>
      </select>
      <p className="text-xs text-muted-foreground">
        {t("channel.addBot.reuseHint", {
          name: reusableAgent.name,
          status: statusLabel,
        })}
      </p>
    </div>
  );
}
