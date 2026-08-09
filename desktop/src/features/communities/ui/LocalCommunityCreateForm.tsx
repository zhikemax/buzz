import * as React from "react";

import { normalizeRelayUrl } from "@/features/communities/relayProbe";
import { getDefaultRelayUrl } from "@/shared/api/tauri";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { ONBOARDING_PRIMARY_CTA_CLASS } from "@/features/onboarding/ui/OnboardingChrome";
import { OnboardingFooter } from "@/features/onboarding/ui/OnboardingFooter";

const LOCAL_FALLBACK_RELAY_URL = "ws://localhost:13000";

type LocalCommunityCreateFormProps = {
  error?: string | null;
  isSubmitting?: boolean;
  onBack: () => void;
  onCreate: (input: { name: string; relayUrl: string }) => void;
  variant?: "dialog" | "onboarding";
};

export function LocalCommunityCreateForm({
  error = null,
  isSubmitting = false,
  onBack,
  onCreate,
  variant = "onboarding",
}: LocalCommunityCreateFormProps) {
  const t = useT();
  const formId = React.useId();
  const [name, setName] = React.useState("");
  const [relayUrl, setRelayUrl] = React.useState(LOCAL_FALLBACK_RELAY_URL);
  const [formError, setFormError] = React.useState<string | null>(null);
  const isOnboarding = variant === "onboarding";

  React.useEffect(() => {
    let cancelled = false;
    void getDefaultRelayUrl()
      .then((url) => {
        if (cancelled || !url.trim()) return;
        setRelayUrl(url.trim());
      })
      .catch(() => {
        // Keep the local Docker fallback when the native default is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t("onboard.localCreateNameRequired"));
      return;
    }
    const normalized = normalizeRelayUrl(relayUrl);
    if (!normalized) {
      setFormError(t("onboard.localCreateRelayInvalid"));
      return;
    }
    setFormError(null);
    onCreate({ name: trimmedName, relayUrl: normalized });
  };

  const fields = (
    <div className={cn("w-full space-y-4", isOnboarding ? "max-w-[520px]" : "")}>
      <div className="space-y-1.5 text-left">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="local-community-name"
        >
          {t("onboard.localCreateName")}
        </label>
        <Input
          autoComplete="off"
          autoFocus
          className={
            isOnboarding
              ? "h-11 rounded-xl border-input bg-background/70 px-4 shadow-none"
              : "h-11 rounded-xl border-input bg-muted/40 px-3 shadow-none"
          }
          data-testid="local-community-name"
          disabled={isSubmitting}
          id="local-community-name"
          onChange={(event) => {
            setName(event.target.value);
            setFormError(null);
          }}
          placeholder={t("onboard.localCreateNamePlaceholder")}
          value={name}
        />
      </div>
      <div className="space-y-1.5 text-left">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="local-community-relay"
        >
          {t("onboard.relayUrl")}
        </label>
        <Input
          autoComplete="off"
          className={
            isOnboarding
              ? "h-11 rounded-xl border-input bg-background/70 px-4 font-mono text-sm shadow-none"
              : "h-11 rounded-xl border-input bg-muted/40 px-3 font-mono text-sm shadow-none"
          }
          data-testid="local-community-relay"
          disabled={isSubmitting}
          id="local-community-relay"
          onChange={(event) => {
            setRelayUrl(event.target.value);
            setFormError(null);
          }}
          placeholder={LOCAL_FALLBACK_RELAY_URL}
          spellCheck={false}
          value={relayUrl}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {t("onboard.localCreateRelayHint")}
        </p>
      </div>
      {formError || error ? (
        <p className="text-sm text-destructive" role="alert">
          {formError ?? error}
        </p>
      ) : null}
    </div>
  );

  if (!isOnboarding) {
    return (
      <form className="space-y-5" id={formId} onSubmit={handleSubmit}>
        {fields}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            disabled={isSubmitting}
            onClick={onBack}
            type="button"
            variant="outline"
          >
            {t("common.back")}
          </Button>
          <Button
            data-testid="local-community-create-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {t("onboard.localCreateSubmit")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="flex min-h-[calc(100dvh-15.625rem)] w-full flex-col items-center text-center"
      id={formId}
      onSubmit={handleSubmit}
    >
      <div className="w-full max-w-[620px]">
        <h1 className="text-title font-normal">
          {t("onboard.createACommunity")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/80">
          {t("onboard.localCreateHint")}
        </p>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
        <Card
          className="w-full max-w-[560px] px-6 py-6"
          data-testid="local-community-create-card"
          variant="textured"
        >
          {fields}
        </Card>
      </div>
      <OnboardingFooter>
        <Button
          className={ONBOARDING_PRIMARY_CTA_CLASS}
          data-testid="local-community-create-submit"
          disabled={isSubmitting}
          form={formId}
          type="submit"
        >
          {t("onboard.localCreateSubmit")}
        </Button>
        <Button
          className="h-9 rounded-full bg-foreground/10 px-6 hover:bg-foreground/15"
          disabled={isSubmitting}
          onClick={onBack}
          type="button"
          variant="ghost"
        >
          {t("common.back")}
        </Button>
      </OnboardingFooter>
    </form>
  );
}
