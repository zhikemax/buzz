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
import { Button, buttonVariants } from "@/shared/ui/button";
import { useT } from "@/shared/i18n";

// Archive is relay-scoped + reversible (NIP-IA), so this gates with a calm,
// reassuring confirmation rather than a destructive warning. The confirm action
// renders `secondary` to match the trigger and the non-alarming tone — we pass
// the secondary classes straight to `AlertDialogAction` (whose base style is the
// default/primary variant) so tailwind-merge overrides the primary background;
// `asChild` + a nested Button would concatenate both variants and leave the
// primary fill winning on source order.
export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isBot,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isBot: boolean;
  isPending: boolean;
}) {
  const t = useT();
  const title = isBot
    ? t("agents.archiveAgentConfirmTitle")
    : t("agents.archiveIdentityConfirmTitle");

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent data-testid="archive-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {isBot
              ? t("agents.archiveConfirmDescAgent")
              : t("agents.archiveConfirmDescPerson")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* The list + closing paragraph sit outside AlertDialogDescription on
            purpose — that component renders a <p>, which can't legally contain
            a <ul> or another block <p>. */}
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>{t("agents.archiveBulletSearch")}</li>
          <li>
            {t("agents.archiveBulletSpaceBefore")}{" "}
            <span className="font-medium text-foreground">
              {t("agents.archiveBulletSpaceEmphasis")}
            </span>{" "}
            {t("agents.archiveBulletSpaceAfter")}
          </li>
          <li>{t("agents.archiveBulletUnarchive")}</li>
        </ul>
        {isBot ? (
          <p className="text-sm text-muted-foreground">
            {t("agents.archiveAlsoDeleteHint")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "secondary" })}
            data-testid="archive-confirm-action"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? t("agents.archiving") : t("common.archive")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
