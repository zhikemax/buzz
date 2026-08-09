import type { AgentTeam } from "@/shared/api/types";
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
import { useT } from "@/shared/i18n";

type TeamDeleteDialogProps = {
  open: boolean;
  team: AgentTeam | null;
  onConfirm: (team: AgentTeam) => void;
  onOpenChange: (open: boolean) => void;
};

export function TeamDeleteDialog({
  open,
  team,
  onConfirm,
  onOpenChange,
}: TeamDeleteDialogProps) {
  const t = useT();
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("agents.deleteTeamTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {team
              ? `Delete "${team.name}". Already-deployed agents are not affected, but this team template will no longer be available.`
              : t("agents.deleteThisTeam")}
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
                if (team) {
                  onConfirm(team);
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
