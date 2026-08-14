import type { WorkflowApproval } from "@/shared/api/types";
import { useT } from "@/shared/i18n";

type WorkflowApprovalCardProps = {
  approval: WorkflowApproval;
};

export function WorkflowApprovalCard({ approval }: WorkflowApprovalCardProps) {
  const t = useT();
  const isExpired = new Date(approval.expiresAt) < new Date();

  if (approval.status !== "pending" || isExpired) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
      data-testid="workflow-approval-card"
    >
      <p className="mb-2 text-sm font-medium">
        {t("workflows.approval.required")}
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        {t("workflows.approval.approver", { spec: approval.approverSpec })}
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        {t("workflows.approval.expires", {
          date: new Date(approval.expiresAt).toLocaleString(),
        })}
      </p>
      <p className="text-xs text-muted-foreground" role="status">
        {t("workflows.approval.desktopUnavailable")}
      </p>
    </div>
  );
}
