import { stringify as yamlStringify, parse as yamlParse } from "yaml";

import type { MessageKey, TranslateFn } from "@/shared/i18n";

export const TRIGGER_TYPES = [
  "message_posted",
  "reaction_added",
  "diff_posted",
  "webhook",
  "schedule",
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const ACTION_TYPES = [
  "delay",
  "send_message",
  "send_dm",
  "call_webhook",
  "request_approval",
  "add_reaction",
  "set_channel_topic",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export type TriggerConfig = {
  on: TriggerType;
  filter?: string;
  emoji?: string;
  cron?: string;
  interval?: string;
};

export type HeaderFormState = {
  id: string;
  key: string;
  value: string;
};

export type StepFormState = {
  id: string;
  name?: string;
  action: ActionType;
  condition?: string;
  timeoutSecs?: string;
  duration?: string;
  text?: string;
  channel?: string;
  to?: string;
  url?: string;
  method?: string;
  headers?: HeaderFormState[];
  body?: string;
  emoji?: string;
  topic?: string;
  from?: string;
  message?: string;
  timeout?: string;
};

export type WorkflowFormState = {
  name: string;
  description: string;
  enabled: boolean;
  trigger: TriggerConfig;
  steps: StepFormState[];
};

export const DEFAULT_FORM_STATE: WorkflowFormState = {
  name: "",
  description: "",
  enabled: true,
  trigger: { on: "message_posted" },
  steps: [],
};

export const TRIGGER_LABEL_KEYS: Record<TriggerType, MessageKey> = {
  message_posted: "workflows.trigger.message_posted",
  reaction_added: "workflows.trigger.reaction_added",
  diff_posted: "workflows.trigger.diff_posted",
  webhook: "workflows.trigger.webhook",
  schedule: "workflows.trigger.schedule",
};

export const ACTION_LABEL_KEYS: Record<ActionType, MessageKey> = {
  delay: "workflows.action.delay",
  send_message: "workflows.action.send_message",
  send_dm: "workflows.action.send_dm",
  call_webhook: "workflows.action.call_webhook",
  request_approval: "workflows.action.request_approval",
  add_reaction: "workflows.action.add_reaction",
  set_channel_topic: "workflows.action.set_channel_topic",
};

export function triggerLabel(t: TranslateFn, type: TriggerType): string {
  return t(TRIGGER_LABEL_KEYS[type]);
}

export function actionLabel(t: TranslateFn, type: ActionType): string {
  return t(ACTION_LABEL_KEYS[type]);
}

export type WorkflowParseError = {
  key: MessageKey;
  params?: Record<string, string>;
};

export function formatWorkflowParseError(
  t: TranslateFn,
  error: WorkflowParseError,
): string {
  return t(error.key, error.params);
}

function toHeaderRows(
  headers: unknown,
  stepId: string,
): HeaderFormState[] | undefined {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return undefined;
  }

  const rows = Object.entries(headers).map(([key, value], index) => ({
    id: `${stepId}_header_${index + 1}`,
    key,
    value: typeof value === "string" ? value : String(value),
  }));

  return rows.length > 0 ? rows : undefined;
}

function headersToRecord(
  headers: HeaderFormState[] | undefined,
): Record<string, string> | undefined {
  if (!headers) return undefined;

  const entries = headers
    .map(({ key, value }) => [key.trim(), value] as const)
    .filter(([key]) => key.length > 0);

  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function parseTimeoutSecs(timeoutSecs: string | undefined): number | undefined {
  if (!timeoutSecs) return undefined;
  const trimmed = timeoutSecs.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return parsed > 0 ? parsed : undefined;
}

function actionFieldsForStep(step: StepFormState): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (step.name?.trim()) fields.name = step.name.trim();
  if (step.condition?.trim()) fields.if = step.condition.trim();
  const timeoutSecs = parseTimeoutSecs(step.timeoutSecs);
  if (timeoutSecs !== undefined) fields.timeout_secs = timeoutSecs;

  switch (step.action) {
    case "delay":
      if (step.duration) fields.duration = step.duration;
      break;
    case "send_message":
      if (step.text) fields.text = step.text;
      if (step.channel) fields.channel = step.channel;
      break;
    case "send_dm":
      if (step.to) fields.to = step.to;
      if (step.text) fields.text = step.text;
      break;
    case "call_webhook":
      if (step.url) fields.url = step.url;
      fields.method = step.method || "POST";
      {
        const headers = headersToRecord(step.headers);
        if (headers) fields.headers = headers;
      }
      if (step.body) fields.body = step.body;
      break;
    case "request_approval":
      if (step.from) fields.from = step.from;
      if (step.message) fields.message = step.message;
      if (step.timeout) fields.timeout = step.timeout;
      break;
    case "add_reaction":
      if (step.emoji) fields.emoji = step.emoji;
      break;
    case "set_channel_topic":
      if (step.topic) fields.topic = step.topic;
      break;
  }
  return fields;
}

export function formStateToYaml(state: WorkflowFormState): string {
  const trigger: Record<string, unknown> = { on: state.trigger.on };
  if (
    (state.trigger.on === "message_posted" ||
      state.trigger.on === "diff_posted") &&
    state.trigger.filter
  ) {
    trigger.filter = state.trigger.filter;
  }
  if (state.trigger.on === "reaction_added" && state.trigger.emoji) {
    trigger.emoji = state.trigger.emoji;
  }
  if (state.trigger.on === "schedule") {
    if (state.trigger.cron) trigger.cron = state.trigger.cron;
    if (state.trigger.interval) trigger.interval = state.trigger.interval;
  }

  const steps = state.steps.map((step) => ({
    id: step.id,
    action: step.action,
    ...actionFieldsForStep(step),
  }));

  const workflow: Record<string, unknown> = {
    name: state.name,
    trigger,
    steps,
  };

  if (state.description.trim()) {
    workflow.description = state.description.trim();
  }
  if (!state.enabled) {
    workflow.enabled = false;
  }

  return yamlStringify(workflow);
}

const STEP_ID_PATTERN = /^step_(\d+)$/;

export function nextStepId(existingSteps: StepFormState[]): string {
  const existingIds = new Set(existingSteps.map((s) => s.id));
  let maxN = 0;
  for (const id of existingIds) {
    const match = STEP_ID_PATTERN.exec(id);
    if (match) maxN = Math.max(maxN, Number(match[1]));
  }
  let n = maxN + 1;
  while (existingIds.has(`step_${n}`)) n++;
  return `step_${n}`;
}

export function yamlToFormState(
  yaml: string,
):
  | { ok: true; state: WorkflowFormState }
  | { ok: false; error: WorkflowParseError } {
  try {
    const parsed = yamlParse(yaml);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: { key: "workflows.error.yamlMustBeObject" } };
    }

    const triggerOn = parsed.trigger?.on;
    if (triggerOn && !TRIGGER_TYPES.includes(triggerOn as TriggerType)) {
      return {
        ok: false,
        error: {
          key: "workflows.error.unsupportedTrigger",
          params: { type: String(triggerOn) },
        },
      };
    }
    const trigger: TriggerConfig = {
      on: (triggerOn as TriggerType) ?? TRIGGER_TYPES[0],
      filter: parsed.trigger?.filter ?? undefined,
      emoji: parsed.trigger?.emoji ?? undefined,
      cron: parsed.trigger?.cron ?? undefined,
      interval: parsed.trigger?.interval ?? undefined,
    };

    const rawSteps = parsed.steps ?? [];
    if (!Array.isArray(rawSteps)) {
      return { ok: false, error: { key: "workflows.error.stepsMustBeList" } };
    }

    for (const step of rawSteps) {
      if (step.action && !ACTION_TYPES.includes(step.action as ActionType)) {
        return {
          ok: false,
          error: {
            key: "workflows.error.unsupportedAction",
            params: { action: String(step.action) },
          },
        };
      }
    }

    const steps: StepFormState[] = rawSteps.map(
      (step: Record<string, unknown>, index: number) => ({
        id: (step.id as string) ?? `step_${index + 1}`,
        name: step.name as string | undefined,
        action: (step.action as ActionType) ?? ACTION_TYPES[0],
        condition: step.if as string | undefined,
        timeoutSecs:
          step.timeout_secs !== undefined
            ? String(step.timeout_secs)
            : undefined,
        duration: step.duration as string | undefined,
        text: step.text as string | undefined,
        channel: step.channel as string | undefined,
        to: step.to as string | undefined,
        url: step.url as string | undefined,
        method: step.method as string | undefined,
        headers: toHeaderRows(
          step.headers,
          (step.id as string) ?? `step_${index + 1}`,
        ),
        body: step.body as string | undefined,
        emoji: step.emoji as string | undefined,
        topic: step.topic as string | undefined,
        from: step.from as string | undefined,
        message: step.message as string | undefined,
        timeout: step.timeout as string | undefined,
      }),
    );

    return {
      ok: true,
      state: {
        name: (parsed.name as string) ?? "",
        description: (parsed.description as string) ?? "",
        enabled: parsed.enabled !== false,
        trigger,
        steps,
      },
    };
  } catch {
    return { ok: false, error: { key: "workflows.error.invalidYaml" } };
  }
}
