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
import { PRIVATE_CHANNEL_ADD_DENIED_MESSAGE } from "@/features/channels/lib/channelMemberAdmission";

type NonMemberMentionDialogProps = {
  /** False in a private channel the viewer doesn't own/administer. */
  canInvite: boolean;
  error: string | null;
  isInvitePending: boolean;
  names: string[];
  onDismiss: () => void;
  onDoNothing: () => void;
  onInvite: () => void;
  open: boolean;
};

export function NonMemberMentionDialog({
  canInvite,
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
            {canInvite
              ? names.length === 1
                ? t("msg.mentionOutsideOne", { name: joinedNames })
                : t("msg.mentionOutsideMany", { names: joinedNames })
              : names.length === 1
                ? t("msg.mentionOutsideOneDenied", {
                    name: joinedNames,
                    denied: PRIVATE_CHANNEL_ADD_DENIED_MESSAGE,
                  })
                : t("msg.mentionOutsideManyDenied", {
                    names: joinedNames,
                    denied: PRIVATE_CHANNEL_ADD_DENIED_MESSAGE,
                  })}
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
            {canInvite ? t("msg.doNothing") : t("msg.sendAnyway")}
          </Button>
          {canInvite ? (
            <Button
              disabled={isInvitePending}
              onClick={onInvite}
              size="sm"
              type="button"
            >
              {isInvitePending ? t("msg.inviting") : t("msg.invite")}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
