import { CopyButton } from "@/features/agents/ui/CopyButton";
import { useT } from "@/shared/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type WorkflowWebhookSecretDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  relayHttpUrl: string;
  webhookSecret: string;
  workflowId: string;
};

export function WorkflowWebhookSecretDialog({
  onOpenChange,
  open,
  relayHttpUrl,
  webhookSecret,
  workflowId,
}: WorkflowWebhookSecretDialogProps) {
  const t = useT();
  const webhookUrl = `${relayHttpUrl}/hooks/${workflowId}`;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("workflows.webhook.title")}</DialogTitle>
          <DialogDescription>{t("workflows.webhook.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("workflows.webhook.url")}
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
              {webhookUrl}
            </pre>
            <CopyButton label={t("workflows.webhook.copyUrl")} value={webhookUrl} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("workflows.webhook.secretHeader")}
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
              {webhookSecret}
            </pre>
            <CopyButton
              label={t("workflows.webhook.copySecret")}
              value={webhookSecret}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
