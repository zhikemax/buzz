import { Code, Plus } from "lucide-react";
import * as React from "react";

import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { WorkflowStepCard } from "./WorkflowStepCard";
import { FieldLabel, FormSelect } from "./workflowFormPrimitives";
import {
  DEFAULT_FORM_STATE,
  TRIGGER_TYPES,
  formatWorkflowParseError,
  formStateToYaml,
  nextStepId,
  triggerLabel,
  yamlToFormState,
} from "./workflowFormTypes";
import type {
  StepFormState,
  TriggerConfig,
  TriggerType,
  WorkflowFormState,
  WorkflowParseError,
} from "./workflowFormTypes";

function TriggerConfigFields({
  trigger,
  onUpdate,
}: {
  trigger: TriggerConfig;
  onUpdate: (trigger: TriggerConfig) => void;
}) {
  const t = useT();

  switch (trigger.on) {
    case "message_posted":
    case "diff_posted":
      return (
        <div className="space-y-1.5">
          <FieldLabel htmlFor="wf-trigger-filter">
            {t("workflows.form.filter")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            id="wf-trigger-filter"
            onChange={(event) =>
              onUpdate({ ...trigger, filter: event.target.value })
            }
            placeholder={t("workflows.form.filterPlaceholder")}
            value={trigger.filter ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            {t("workflows.form.filterHint")}
          </p>
        </div>
      );
    case "reaction_added":
      return (
        <div className="space-y-1.5">
          <FieldLabel htmlFor="wf-trigger-emoji">
            {t("workflows.form.emojiFilter")}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            id="wf-trigger-emoji"
            onChange={(event) =>
              onUpdate({ ...trigger, emoji: event.target.value })
            }
            placeholder={t("workflows.form.emojiPlaceholder")}
            value={trigger.emoji ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            {t("workflows.form.emojiHint")}
          </p>
        </div>
      );
    case "webhook":
      return (
        <p className="text-xs text-muted-foreground">
          {t("workflows.form.webhookHint")}
        </p>
      );
    case "schedule":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="wf-trigger-cron">
              {t("workflows.form.cron")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              id="wf-trigger-cron"
              onChange={(event) =>
                onUpdate({ ...trigger, cron: event.target.value })
              }
              placeholder={t("workflows.form.cronPlaceholder")}
              value={trigger.cron ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="wf-trigger-interval">
              {t("workflows.form.interval")}
            </FieldLabel>
            <Input
              autoCapitalize="off"
              id="wf-trigger-interval"
              onChange={(event) =>
                onUpdate({ ...trigger, interval: event.target.value })
              }
              placeholder={t("workflows.form.intervalPlaceholder")}
              value={trigger.interval ?? ""}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("workflows.form.scheduleHint")}
          </p>
        </div>
      );
    default:
      return null;
  }
}

type WorkflowFormBuilderProps = {
  disabled?: boolean;
  onChange: (yaml: string) => void;
  yaml: string;
};

export function WorkflowFormBuilder({
  disabled,
  onChange,
  yaml,
}: WorkflowFormBuilderProps) {
  const t = useT();
  // Parse once on mount instead of calling yamlToFormState three times
  const initialParseRef = React.useRef(yaml ? yamlToFormState(yaml) : null);
  const [mode, setMode] = React.useState<"form" | "yaml">(
    initialParseRef.current === null || initialParseRef.current.ok
      ? "form"
      : "yaml",
  );
  const [formState, setFormState] = React.useState<WorkflowFormState>(
    initialParseRef.current?.ok
      ? initialParseRef.current.state
      : DEFAULT_FORM_STATE,
  );
  const [parseError, setParseError] = React.useState<WorkflowParseError | null>(
    initialParseRef.current !== null && !initialParseRef.current.ok
      ? initialParseRef.current.error
      : null,
  );

  const updateFormState = React.useCallback(
    (next: WorkflowFormState) => {
      setFormState(next);
      onChange(formStateToYaml(next));
    },
    [onChange],
  );

  const handleToggleMode = React.useCallback(() => {
    if (mode === "form") {
      setMode("yaml");
      setParseError(null);
    } else {
      const result = yamlToFormState(yaml);
      if (result.ok) {
        setFormState(result.state);
        setParseError(null);
        setMode("form");
      } else {
        setParseError(result.error);
      }
    }
  }, [mode, yaml]);

  const addStep = React.useCallback(() => {
    updateFormState({
      ...formState,
      steps: [
        ...formState.steps,
        { id: nextStepId(formState.steps), action: "delay" },
      ],
    });
  }, [formState, updateFormState]);

  const removeStep = React.useCallback(
    (index: number) => {
      updateFormState({
        ...formState,
        steps: formState.steps.filter((_, i) => i !== index),
      });
    },
    [formState, updateFormState],
  );

  const updateStep = React.useCallback(
    (index: number, step: StepFormState) => {
      const next = [...formState.steps];
      next[index] = step;
      updateFormState({ ...formState, steps: next });
    },
    [formState, updateFormState],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          className="h-7 gap-1.5 text-xs"
          disabled={disabled}
          onClick={handleToggleMode}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Code className="h-4 w-4" />
          {mode === "form"
            ? t("workflows.form.editYaml")
            : t("workflows.form.backToForm")}
        </Button>
      </div>

      {parseError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {t("workflows.form.cannotSwitch", {
            error: formatWorkflowParseError(t, parseError),
          })}
        </p>
      ) : null}

      {mode === "yaml" ? (
        <div className="space-y-1.5">
          <Textarea
            autoCapitalize="off"
            className="min-h-[240px] resize-y font-mono text-xs"
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            value={yaml}
          />
          <p className="text-xs text-muted-foreground">
            {t("workflows.form.yamlHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="wf-name">{t("workflows.form.name")}</FieldLabel>
            <Input
              autoCapitalize="off"
              autoCorrect="off"
              disabled={disabled}
              id="wf-name"
              onChange={(event) =>
                updateFormState({ ...formState, name: event.target.value })
              }
              placeholder={t("workflows.form.namePlaceholder")}
              value={formState.name}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="wf-description">
              {t("workflows.form.description")}
            </FieldLabel>
            <Textarea
              autoCapitalize="off"
              className="min-h-[72px] resize-y text-sm"
              disabled={disabled}
              id="wf-description"
              onChange={(event) =>
                updateFormState({
                  ...formState,
                  description: event.target.value,
                })
              }
              placeholder={t("workflows.form.descriptionPlaceholder")}
              value={formState.description}
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
            <Checkbox
              checked={formState.enabled}
              disabled={disabled}
              id="wf-enabled"
              onCheckedChange={(checked) =>
                updateFormState({
                  ...formState,
                  enabled: checked === true,
                })
              }
            />
            <label className="text-sm" htmlFor="wf-enabled">
              {t("workflows.form.enabled")}
            </label>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="wf-trigger-type">
                {t("workflows.form.trigger")}
              </FieldLabel>
              <FormSelect
                disabled={disabled}
                id="wf-trigger-type"
                onChange={(value) =>
                  updateFormState({
                    ...formState,
                    trigger: { on: value as TriggerType },
                  })
                }
                value={formState.trigger.on}
              >
                {TRIGGER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {triggerLabel(t, type)}
                  </option>
                ))}
              </FormSelect>
            </div>
            <TriggerConfigFields
              onUpdate={(trigger) => updateFormState({ ...formState, trigger })}
              trigger={formState.trigger}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>{t("workflows.form.steps")}</FieldLabel>
              <Button
                className="h-7 gap-1.5 text-xs"
                disabled={disabled}
                onClick={addStep}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {t("workflows.form.addStep")}
              </Button>
            </div>

            {formState.steps.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("workflows.form.noSteps")}
              </p>
            ) : (
              <div className="space-y-2">
                {formState.steps.map((step, index) => (
                  <WorkflowStepCard
                    disabled={disabled}
                    index={index}
                    key={step.id}
                    onRemove={() => removeStep(index)}
                    onUpdate={(updated) => updateStep(index, updated)}
                    step={step}
                    triggerType={formState.trigger.on}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
