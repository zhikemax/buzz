import type * as React from "react";
import { useT, type TranslateFn } from "@/shared/i18n";
import type { InheritedDefault } from "./bakedEnvHelpers";
import { getPersonaProviderOptions } from "./agentConfigOptions";
import { Button } from "@/shared/ui/button";

function providerLabel(providerId: string, t: TranslateFn) {
  const option = getPersonaProviderOptions("", "buzz-agent", t).find(
    (candidate) => candidate.id === providerId,
  );
  return option?.label ?? providerId;
}

export function formatAiDefaultsSummary({
  provider,
  model,
  t,
}: {
  provider: InheritedDefault;
  model: InheritedDefault;
  t: TranslateFn;
}) {
  const parts = [
    provider.value ? providerLabel(provider.value, t) : null,
    model.value || null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(" · ") : "Not configured";
}

export function AgentAiDefaultsNotice({
  isConfigured = true,
  onEditDefaults,
  triggerRef,
  explicitModel,
  explicitProvider,
  harness,
  inheritedModel,
  inheritedProvider,
}: {
  isConfigured?: boolean;
  onEditDefaults: () => void;
  triggerRef?: React.Ref<HTMLButtonElement>;
  explicitModel: string;
  explicitProvider: string;
  harness?: string;
  inheritedModel: InheritedDefault;
  inheritedProvider: InheritedDefault;
}) {
  const t = useT();
  const provider = explicitProvider.trim() || inheritedProvider.value;
  const model = explicitModel.trim() || inheritedModel.value;

  if (!isConfigured) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5"
        data-testid="agent-ai-defaults-notice"
      >
        <p className="text-sm font-medium text-foreground">
          Global defaults not set
        </p>
        <Button
          className="shrink-0"
          data-testid="set-ai-defaults"
          onClick={onEditDefaults}
          ref={triggerRef}
          size="sm"
          type="button"
          variant="outline"
        >
          Set
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1" data-testid="agent-ai-defaults-notice">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-sm">
        {harness !== undefined ? (
          <>
            <dt className="text-muted-foreground">Harness</dt>
            <dd className="truncate text-foreground">
              {harness || "Not configured"}
            </dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">Provider</dt>
        <dd className="truncate text-foreground">
          {provider ? providerLabel(provider, t) : "Not configured"}
        </dd>
        <dt className="text-muted-foreground">Model</dt>
        <dd className="truncate text-foreground">
          {model || "Not configured"}
        </dd>
      </dl>
      <Button
        className="h-auto px-0 py-1"
        data-testid="edit-ai-defaults"
        onClick={onEditDefaults}
        ref={triggerRef}
        size="xs"
        type="button"
        variant="link"
      >
        Edit global defaults
      </Button>
    </div>
  );
}
