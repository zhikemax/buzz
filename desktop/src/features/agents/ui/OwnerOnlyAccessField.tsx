import type { RespondToMode } from "@/shared/api/types";
import { useT } from "@/shared/i18n";
import {
  CreateAgentRespondToField,
  OWNER_ONLY_ACCESS_DISABLED_REASON_KEY,
} from "./RespondToField";

export function OwnerOnlyAccessField({
  accessLocked,
  allowlist,
  disabled,
  mode,
  onAllowlistChange,
  onModeChange,
}: {
  accessLocked: boolean;
  allowlist: string[];
  disabled: boolean;
  mode: RespondToMode;
  onAllowlistChange: (allowlist: string[]) => void;
  onModeChange: (mode: RespondToMode) => void;
}) {
  const t = useT();
  return (
    <CreateAgentRespondToField
      allowlist={accessLocked ? [] : allowlist}
      disabled={disabled || accessLocked}
      disabledReason={
        accessLocked ? t(OWNER_ONLY_ACCESS_DISABLED_REASON_KEY) : undefined
      }
      mode={accessLocked ? "owner-only" : mode}
      onAllowlistChange={onAllowlistChange}
      onModeChange={onModeChange}
      variant="persona"
    />
  );
}
