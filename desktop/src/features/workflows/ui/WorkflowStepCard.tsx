import { Trash2 } from "lucide-react";

import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { FieldLabel, FormSelect } from "./workflowFormPrimitives";
import { ACTION_TYPES, actionLabel } from "./workflowFormTypes";
import { WorkflowWebhookHeadersEditor } from "./WorkflowWebhookHeadersEditor";
import type {
  ActionType,
  StepFormState,
  TriggerType,
} from "./workflowFormTypes";

function BackendSupportHint({ action }: { action: StepFormState["action"] }) {
  const t = useT();

  switch (action) {
    case "send_dm":
      return (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
          {t("workflows.step.backend.sendDm")}
        </p>
      );
    case "set_channel_topic":
      return (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
          {t("workflows.step.backend.setTopic")}
        </p>
      );
    case "request_approval":
      return (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
          {t("workflows.step.backend.approval")}
        </p>
      );
    default:
      return null;
  }
}

function StepConfigFields({
  step,
  prefix,
  disabled,
  triggerType,
  onUpdate,
}: {
  step: StepFormState;
  prefix: string;
  disabled?: boolean;
  triggerType: TriggerType;
  onUpdate: (step: StepFormState) => void;
}) {
  const t = useT();

  switch (step.action) {
    case "delay":
      return (
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-duration`}>
            {t("workflows.step.duration")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            disabled={disabled}
            id={`${prefix}-duration`}
            onChange={(event) =>
              onUpdate({ ...step, duration: event.target.value })
            }
            placeholder={t("workflows.step.durationPlaceholder")}
            value={step.duration ?? ""}
          />
        </div>
      );
    case "send_message":
      return (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-text`}>
              {t("workflows.step.messageText")}
            </FieldLabel>
            <Textarea
              autoCapitalize="off"
              className="min-h-[60px] resize-y text-xs"
              disabled={disabled}
              id={`${prefix}-text`}
              onChange={(event) =>
                onUpdate({ ...step, text: event.target.value })
              }
              placeholder={t("workflows.step.messageTextPlaceholder")}
              value={step.text ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-channel`}>
              {t("workflows.step.channelOverride")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-channel`}
              onChange={(event) =>
                onUpdate({ ...step, channel: event.target.value })
              }
              placeholder={t("workflows.step.channelUuidPlaceholder")}
              value={step.channel ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              {t("workflows.step.channelHint")}
            </p>
            {triggerType === "webhook" && !(step.channel ?? "").trim() ? (
              <p className="text-xs text-amber-700">
                {t("workflows.step.webhookChannelWarning")}
              </p>
            ) : null}
          </div>
        </div>
      );
    case "send_dm":
      return (
        <div className="space-y-2">
          <BackendSupportHint action={step.action} />
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-to`}>
              {t("workflows.step.toPubkey")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-to`}
              onChange={(event) =>
                onUpdate({ ...step, to: event.target.value })
              }
              placeholder={t("workflows.step.toPlaceholder")}
              value={step.to ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-text`}>
              {t("workflows.step.messageText")}
            </FieldLabel>
            <Textarea
              autoCapitalize="off"
              className="min-h-[60px] resize-y text-xs"
              disabled={disabled}
              id={`${prefix}-text`}
              onChange={(event) =>
                onUpdate({ ...step, text: event.target.value })
              }
              placeholder={t("workflows.step.dmContentPlaceholder")}
              value={step.text ?? ""}
            />
          </div>
        </div>
      );
    case "call_webhook":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-url`}>
              {t("workflows.step.url")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-url`}
              onChange={(event) =>
                onUpdate({ ...step, url: event.target.value })
              }
              placeholder="https://..."
              value={step.url ?? ""}
            />
            {step.url && !step.url.startsWith("https://") ? (
              <p className="text-xs text-destructive">
                {t("workflows.step.urlHttpsError")}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-method`}>
              {t("workflows.step.method")}
            </FieldLabel>
            <FormSelect
              disabled={disabled}
              id={`${prefix}-method`}
              onChange={(value) => onUpdate({ ...step, method: value })}
              value={step.method ?? "POST"}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </FormSelect>
          </div>
          <WorkflowWebhookHeadersEditor
            disabled={disabled}
            headers={step.headers ?? []}
            onChange={(headers) => onUpdate({ ...step, headers })}
            stepId={step.id || prefix}
          />
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-body`}>
              {t("workflows.step.body")}
            </FieldLabel>
            <Textarea
              autoCapitalize="off"
              className="min-h-[60px] resize-y font-mono text-xs"
              disabled={disabled}
              id={`${prefix}-body`}
              onChange={(event) =>
                onUpdate({ ...step, body: event.target.value })
              }
              placeholder={t("workflows.step.bodyPlaceholder")}
              value={step.body ?? ""}
            />
          </div>
        </div>
      );
    case "request_approval":
      return (
        <div className="space-y-2">
          <BackendSupportHint action={step.action} />
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-from`}>
              {t("workflows.step.approver")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-from`}
              onChange={(event) =>
                onUpdate({ ...step, from: event.target.value })
              }
              placeholder={t("workflows.step.approverPlaceholder")}
              value={step.from ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-message`}>
              {t("workflows.step.approvalMessage")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-message`}
              onChange={(event) =>
                onUpdate({ ...step, message: event.target.value })
              }
              placeholder={t("workflows.step.approvalMessagePlaceholder")}
              value={step.message ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-timeout`}>
              {t("workflows.step.timeout")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-timeout`}
              onChange={(event) =>
                onUpdate({ ...step, timeout: event.target.value })
              }
              placeholder={t("workflows.step.timeoutDurationPlaceholder")}
              value={step.timeout ?? ""}
            />
          </div>
        </div>
      );
    case "add_reaction":
      return (
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-emoji`}>
            {t("workflows.step.emoji")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            disabled={disabled}
            id={`${prefix}-emoji`}
            onChange={(event) =>
              onUpdate({ ...step, emoji: event.target.value })
            }
            placeholder={t("workflows.form.emojiPlaceholder")}
            value={step.emoji ?? ""}
          />
        </div>
      );
    case "set_channel_topic":
      return (
        <div className="space-y-2">
          <BackendSupportHint action={step.action} />
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${prefix}-topic`}>
              {t("workflows.step.topic")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              disabled={disabled}
              id={`${prefix}-topic`}
              onChange={(event) =>
                onUpdate({ ...step, topic: event.target.value })
              }
              placeholder={t("workflows.step.topicPlaceholder")}
              value={step.topic ?? ""}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function WorkflowStepCard({
  index,
  disabled,
  onRemove,
  onUpdate,
  step,
  triggerType,
}: {
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  onUpdate: (step: StepFormState) => void;
  step: StepFormState;
  triggerType: TriggerType;
}) {
  const t = useT();
  const prefix = `wf-step-${index}`;

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t("workflows.step.title", { n: index + 1 })}
        </span>
        <Button
          aria-label={t("workflows.step.removeAria")}
          className="h-7 w-7"
          disabled={disabled}
          onClick={onRemove}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-id`}>
            {t("workflows.step.id")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            disabled={disabled}
            id={`${prefix}-id`}
            onChange={(event) => onUpdate({ ...step, id: event.target.value })}
            placeholder={t("workflows.step.idPlaceholder")}
            value={step.id}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-name`}>
            {t("workflows.step.name")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            disabled={disabled}
            id={`${prefix}-name`}
            onChange={(event) =>
              onUpdate({ ...step, name: event.target.value })
            }
            placeholder={t("workflows.step.namePlaceholder")}
            value={step.name ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-action`}>
            {t("workflows.step.action")}
          </FieldLabel>
          <FormSelect
            disabled={disabled}
            id={`${prefix}-action`}
            onChange={(value) => {
              const next = { ...step, action: value as ActionType };
              if (value === "call_webhook" && !next.method) {
                next.method = "POST";
              }
              onUpdate(next);
            }}
            value={step.action}
          >
            {ACTION_TYPES.map((action) => (
              <option key={action} value={action}>
                {actionLabel(t, action)}
              </option>
            ))}
          </FormSelect>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${prefix}-timeout-secs`}>
            {t("workflows.step.timeoutSecs")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            disabled={disabled}
            id={`${prefix}-timeout-secs`}
            inputMode="numeric"
            onChange={(event) =>
              onUpdate({ ...step, timeoutSecs: event.target.value })
            }
            placeholder={t("workflows.step.timeoutPlaceholder")}
            value={step.timeoutSecs ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor={`${prefix}-condition`}>
          {t("workflows.step.condition")}
        </FieldLabel>
        <Input
          autoCapitalize="off"
          disabled={disabled}
          id={`${prefix}-condition`}
          onChange={(event) =>
            onUpdate({ ...step, condition: event.target.value })
          }
          placeholder={t("workflows.step.conditionPlaceholder")}
          value={step.condition ?? ""}
        />
      </div>

      <StepConfigFields
        disabled={disabled}
        onUpdate={onUpdate}
        prefix={prefix}
        step={step}
        triggerType={triggerType}
      />
    </div>
  );
}
