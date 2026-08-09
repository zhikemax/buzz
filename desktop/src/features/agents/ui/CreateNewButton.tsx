import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { useT } from "@/shared/i18n";

type CreateNewButtonProps = {
  ariaLabel?: string;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
  variant?: "default" | "outline";
};

export function CreateNewButton({
  ariaLabel,
  disabled = false,
  label,
  onClick,
  variant = "default",
}: CreateNewButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("common.new");
  return (
    <Button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      size="sm"
      type="button"
      variant={variant}
    >
      <Plus className="h-4 w-4" />
      {resolvedLabel}
    </Button>
  );
}
