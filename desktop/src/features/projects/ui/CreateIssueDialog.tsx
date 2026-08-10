import { useT } from "@/shared/i18n";
import {
  CreateProjectWorkItemDialog,
  type CreateProjectWorkItemDialogInput,
} from "./CreateProjectWorkItemDialog";

export type CreateIssueDialogInput = CreateProjectWorkItemDialogInput;

export function CreateIssueDialog({
  isCreating,
  onCreate,
  onOpenChange,
  open,
  projectName,
}: {
  isCreating: boolean;
  onCreate: (input: CreateIssueDialogInput) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectName: string;
}) {
  const t = useT();
  return (
    <CreateProjectWorkItemDialog
      bodyPlaceholder={t("projects.issue.create.bodyPlaceholder")}
      description={t("projects.issue.create.inRepo", { name: projectName })}
      isCreating={isCreating}
      itemName="issue"
      onCreate={onCreate}
      onOpenChange={onOpenChange}
      open={open}
      title={t("projects.issue.create.title")}
      titlePlaceholder={t("projects.issue.create.titlePlaceholder")}
    />
  );
}
