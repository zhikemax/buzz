import { MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";

import { useT } from "@/shared/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

type DeleteActionMenuProps = {
  labelKey: "post" | "reply";
  onConfirm: () => void;
  iconSize?: "sm" | "md";
};

export function DeleteActionMenu({
  labelKey,
  onConfirm,
}: DeleteActionMenuProps) {
  const t = useT();
  const [isOpen, setIsOpen] = React.useState(false);
  const iconClass = "h-4 w-4";
  const label =
    labelKey === "post" ? t("forum.deletePost") : t("forum.deleteReply");

  return (
    <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <MoreHorizontal className={iconClass} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("forum.deleteConfirmAction", { label })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirmDialog
        label={label}
        onConfirm={onConfirm}
        onOpenChange={setIsOpen}
        open={isOpen}
      />
    </div>
  );
}
