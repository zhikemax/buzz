import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

type PersonaAddedByProps = {
  className?: string;
  label?: string;
};

export function PersonaAddedBy({ className, label }: PersonaAddedByProps) {
  const t = useT();
  return (
    <p className={cn("truncate text-xs leading-tight", className)}>
      <span className="text-muted-foreground/55">{t("agents.addedBy")}</span>{" "}
      <span className="text-muted-foreground">{label ?? t("agents.you")}</span>
    </p>
  );
}
