import * as React from "react";
import { stringify as yamlStringify } from "yaml";

import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "@/features/workflows/hooks";
import type { Channel, Workflow } from "@/shared/api/types";
import { getRelayHttpUrl } from "@/shared/api/tauri";
import { useT, type MessageKey } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ChannelCombobox } from "./ChannelCombobox";
import { WorkflowFormBuilder } from "./WorkflowFormBuilder";
import { WorkflowWebhookSecretDialog } from "./WorkflowWebhookSecretDialog";
import { FieldLabel } from "./workflowFormPrimitives";

type DialogMode = "create" | "edit" | "duplicate";

type WorkflowDialogProps = {
  channels: Channel[];
  mode: DialogMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workflow?: Workflow | null;
};

function getInitialYaml(
  mode: DialogMode,
  workflow: Workflow | null | undefined,
  copySuffix: string,
): string {
  if (!workflow) return "";
  const def = { ...workflow.definition };
  if (mode === "duplicate") {
    def.name = `${def.name ?? workflow.name}${copySuffix}`;
  }
  return yamlStringify(def);
}

const TITLES = {
  create: "workflows.dialog.create.title",
  edit: "workflows.dialog.edit.title",
  duplicate: "workflows.dialog.duplicate.title",
} satisfies Record<DialogMode, MessageKey>;

const SUBMIT_LABELS = {
  create: "common.create",
  edit: "common.save",
  duplicate: "workflows.dialog.duplicate.submit",
} satisfies Record<DialogMode, MessageKey>;

const PENDING_LABELS = {
  create: "workflows.dialog.create.pending",
  edit: "common.saving",
  duplicate: "workflows.dialog.duplicate.pending",
} satisfies Record<DialogMode, MessageKey>;

export function WorkflowDialog({
  channels,
  mode,
  onOpenChange,
  open,
  workflow,
}: WorkflowDialogProps) {
  const t = useT();
  const channelId =
    mode === "edit" && workflow?.channelId
      ? workflow.channelId
      : (channels[0]?.id ?? "");

  const [selectedChannelId, setSelectedChannelId] = React.useState(channelId);
  const [yamlDefinition, setYamlDefinition] = React.useState(() =>
    getInitialYaml(mode, workflow, t("workflows.duplicateSuffix")),
  );
  const [savedWebhookInfo, setSavedWebhookInfo] = React.useState<{
    relayHttpUrl: string;
    webhookSecret: string;
    workflowId: string;
  } | null>(null);

  const createMutation = useCreateWorkflowMutation(selectedChannelId);
  const updateMutation = useUpdateWorkflowMutation(workflow?.id ?? "");
  const mutation = mode === "edit" ? updateMutation : createMutation;

  const selectedChannel =
    channels.find((c) => c.id === selectedChannelId) ?? null;

  const defaultChannelId = channels[0]?.id ?? "";
  const workflowChannelId = workflow?.channelId ?? null;
  const resetCreate = createMutation.reset;
  const resetUpdate = updateMutation.reset;

  // Re-initialize when dialog opens or workflow/mode changes
  React.useEffect(() => {
    if (open) {
      const newChannelId =
        mode === "edit" && workflowChannelId
          ? workflowChannelId
          : defaultChannelId;
      setSelectedChannelId(newChannelId);
      setYamlDefinition(getInitialYaml(mode, workflow, t("workflows.duplicateSuffix")));
      setSavedWebhookInfo(null);
      resetCreate();
      resetUpdate();
    }
  }, [
    open,
    mode,
    workflow,
    workflowChannelId,
    defaultChannelId,
    resetCreate,
    resetUpdate,
    t,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetCreate();
        resetUpdate();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetCreate, resetUpdate],
  );

  async function handleSubmit() {
    if (!selectedChannelId || !yamlDefinition.trim()) return;

    try {
      const saved = await mutation.mutateAsync(yamlDefinition);
      handleOpenChange(false);
      if (saved.webhookSecret) {
        const relayHttpUrl = await getRelayHttpUrl();
        setSavedWebhookInfo({
          relayHttpUrl,
          webhookSecret: saved.webhookSecret,
          workflowId: saved.workflow.id,
        });
      }
    } catch {
      // React Query stores the error; keep the dialog open.
    }
  }

  const showChannelSelector = mode !== "edit" && channels.length > 1;
  const showChannelInfo = mode !== "edit" && channels.length === 1;

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t(TITLES[mode])}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? t("workflows.dialog.edit.description")
                : channels.length === 1
                  ? t("workflows.dialog.create.singleChannel")
                  : t("workflows.dialog.create.multiChannel")}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            {showChannelSelector ? (
              <div className="space-y-1.5">
                <FieldLabel htmlFor="wf-channel-select">
                  {t("workflows.dialog.channel")}
                </FieldLabel>
                <ChannelCombobox
                  channels={channels}
                  disabled={mutation.isPending}
                  id="wf-channel-select"
                  onChange={(value) => {
                    mutation.reset();
                    setSelectedChannelId(value);
                  }}
                  value={selectedChannelId}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedChannel
                    ? t("workflows.dialog.newBelongsTo", {
                        name: selectedChannel.name,
                      })
                    : t("workflows.dialog.joinChannelFirst")}
                </p>
              </div>
            ) : (showChannelInfo || mode === "edit") && selectedChannel ? (
              <p className="text-sm text-muted-foreground">
                {mode === "edit"
                  ? t("workflows.dialog.editingIn")
                  : t("workflows.dialog.creatingIn")}{" "}
                <span className="font-medium text-foreground">
                  {selectedChannel.name}
                </span>
                .
              </p>
            ) : null}

            <WorkflowFormBuilder
              disabled={mutation.isPending}
              onChange={(yaml) => {
                mutation.reset();
                setYamlDefinition(yaml);
              }}
              yaml={yamlDefinition}
            />

            {mutation.error instanceof Error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutation.error.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={
                !selectedChannelId ||
                !yamlDefinition.trim() ||
                mutation.isPending
              }
              onClick={handleSubmit}
              type="button"
            >
              {mutation.isPending
                ? t(PENDING_LABELS[mode])
                : t(SUBMIT_LABELS[mode])}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {savedWebhookInfo ? (
        <WorkflowWebhookSecretDialog
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSavedWebhookInfo(null);
            }
          }}
          open
          relayHttpUrl={savedWebhookInfo.relayHttpUrl}
          webhookSecret={savedWebhookInfo.webhookSecret}
          workflowId={savedWebhookInfo.workflowId}
        />
      ) : null}
    </>
  );
}
