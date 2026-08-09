import type { AgentPersona } from "@/shared/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { useT, type TranslateFn } from "@/shared/i18n";

type PersonaDeleteDialogProps = {
  open: boolean;
  persona: AgentPersona | null;
  /** Number of managed-agent instances backed by this persona. Omit or pass 0 to suppress the instance-count sentence. */
  instanceCount?: number;
  onConfirm: (persona: AgentPersona) => void;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirmation copy for deleting a persona. Pure so the cascade archival
 * disclosure stays unit-testable without a renderer: whenever instances are
 * cascade-deleted, each one's identity is also archived on the relay
 * (NIP-IA), and that durable side effect must be disclosed before the
 * destructive confirm — matching the direct agent-delete dialog.
 */
export function personaDeleteDescription(
  persona: AgentPersona | null,
  instanceCount: number,
  t: TranslateFn,
): string {
  if (!persona) {
    return t("agents.deleteThis");
  }
  if (instanceCount === 0) {
    return t("agents.deleteNamed", { name: persona.displayName });
  }
  const cascade =
    instanceCount === 1
      ? t("agents.deleteCascadeOne")
      : t("agents.deleteCascadeMany", { count: instanceCount });
  return t("agents.deleteNamedCascade", {
    name: persona.displayName,
    cascade,
  });
}

export function PersonaDeleteDialog({
  open,
  persona,
  instanceCount = 0,
  onConfirm,
  onOpenChange,
}: PersonaDeleteDialogProps) {
  const t = useT();
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("agents.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {personaDeleteDescription(persona, instanceCount, t)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => {
                if (persona) {
                  onConfirm(persona);
                }
              }}
              type="button"
              variant="destructive"
            >
              {t("common.delete")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
