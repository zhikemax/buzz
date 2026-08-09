import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

type NonMemberMentionDialogProps = {
  error: string | null;
  isInvitePending: boolean;
  names: string[];
  onDismiss: () => void;
  onDoNothing: () => void;
  onInvite: () => void;
  open: boolean;
};

export function NonMemberMentionDialog({
  error,
  isInvitePending,
  names,
  onDismiss,
  onDoNothing,
  onInvite,
  open,
}: NonMemberMentionDialogProps) {
  const t = useT();
  const joinedNames = names.join(", ");
  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDismiss();
        }
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("msg.mentionOutsideTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {names.length === 1
              ? t("msg.mentionOutsideOne", { name: joinedNames })
              : t("msg.mentionOutsideMany", { names: joinedNames })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <Button
            disabled={isInvitePending}
            onClick={onDoNothing}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("msg.doNothing")}
          </Button>
          <Button
            disabled={isInvitePending}
            onClick={onInvite}
            size="sm"
            type="button"
          >
            {isInvitePending ? t("msg.inviting") : t("msg.invite")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
