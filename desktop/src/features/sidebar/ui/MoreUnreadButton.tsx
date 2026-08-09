import { topChromeInset } from "@/shared/layout/chromeLayout";
import { useT } from "@/shared/i18n";
import { UnreadPill, unreadCountLabel } from "@/shared/ui/UnreadPill";

export function MoreUnreadButton({
  bottomClassName = "bottom-0",
  count,
  label,
  onClick,
  position,
  testId,
}: {
  bottomClassName?: string;
  count: number;
  label?: string;
  onClick: () => void;
  position: "top" | "bottom";
  testId: string;
}) {
  const t = useT();
  const positionClassName =
    position === "top" ? topChromeInset.top : bottomClassName;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center py-1 ${positionClassName}`}
    >
      <UnreadPill
        direction={position === "top" ? "up" : "down"}
        emphasis="primary"
        label={label ?? unreadCountLabel(count, t)}
        onClick={onClick}
        testId={testId}
      />
    </div>
  );
}
