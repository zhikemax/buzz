/**
 * Vendor CLI login panel for Agent Defaults (Claude Code, Codex, …).
 *
 * Configuration (API key) and vendor sign-in are separate paths. Either is
 * enough to run; when both are set, spawn prefers vendor login until revoked.
 */
import * as React from "react";

import {
  useAcpAuthMethodsQuery,
  useAcpRuntimesQuery,
  useConnectAcpRuntimeMutation,
  useDisconnectAcpRuntimeMutation,
} from "@/features/agents/hooks";
import type { AcpRuntimeCatalogEntry } from "@/shared/api/types";
import { useT } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

export function AgentDefaultsCliLoginPanel({
  configApiKeyReady,
  runtime,
}: {
  /** True when Configuration tab has a usable provider API key. */
  configApiKeyReady: boolean;
  runtime: AcpRuntimeCatalogEntry;
}) {
  const t = useT();
  const runtimesQuery = useAcpRuntimesQuery();
  const liveRuntime =
    runtimesQuery.data?.find((entry) => entry.id === runtime.id) ?? runtime;
  const canConnect =
    liveRuntime.availability === "available" &&
    (liveRuntime.authStatus.status === "logged_out" ||
      liveRuntime.authStatus.status === "unknown");
  const methodsQuery = useAcpAuthMethodsQuery(liveRuntime.id, {
    enabled: canConnect || liveRuntime.authStatus.status === "logged_in",
  });
  const connectMutation = useConnectAcpRuntimeMutation();
  const disconnectMutation = useDisconnectAcpRuntimeMutation();
  const [terminalHint, setTerminalHint] = React.useState(false);
  const [isWaiting, setIsWaiting] = React.useState(false);

  React.useEffect(() => {
    if (!isWaiting) return;
    if (liveRuntime.authStatus.status === "logged_in") {
      setIsWaiting(false);
      setTerminalHint(false);
      return;
    }
    const interval = window.setInterval(() => {
      void runtimesQuery.refetch();
    }, 2_000);
    const timeout = window.setTimeout(() => setIsWaiting(false), 120_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isWaiting, liveRuntime.authStatus.status, runtimesQuery]);

  const methods = methodsQuery.data?.methods ?? [];
  const loginHint = (liveRuntime.loginHint ?? "").trim();

  if (liveRuntime.availability !== "available") {
    return (
      <div
        className="space-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
        data-testid="agent-defaults-cli-login-unavailable"
      >
        <p>{t("settings.agents.cliLogin.installFirst", { label: liveRuntime.label })}</p>
        {liveRuntime.installHint.trim().length > 0 ? (
          <p className="whitespace-pre-line">{liveRuntime.installHint}</p>
        ) : null}
      </div>
    );
  }

  if (liveRuntime.authStatus.status === "logged_in") {
    return (
      <div
        className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"
        data-testid="agent-defaults-cli-login-ready"
      >
        <div className="space-y-1">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            {t("settings.agents.cliLogin.signedIn", { label: liveRuntime.label })}
          </p>
          <p className="text-muted-foreground">
            {configApiKeyReady
              ? t("settings.agents.cliLogin.signedInPreferLogin")
              : t("settings.agents.cliLogin.signedInOnly")}
          </p>
        </div>
        <Button
          disabled={disconnectMutation.isPending}
          onClick={() => {
            disconnectMutation.mutate(liveRuntime.id);
          }}
          size="sm"
          type="button"
          variant="outline"
          data-testid="agent-defaults-cli-logout"
        >
          {disconnectMutation.isPending ? (
            <Spinner className="mr-1.5 h-3.5 w-3.5 border-2" />
          ) : null}
          {t("settings.agents.cliLogin.revoke")}
        </Button>
        {disconnectMutation.error instanceof Error ? (
          <p className="text-sm text-destructive">
            {t("settings.agents.cliLogin.revokeFailed", {
              error: disconnectMutation.error.message,
            })}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
      data-testid="agent-defaults-cli-login-panel"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("settings.agents.cliLogin.title", { label: liveRuntime.label })}
        </p>
        {configApiKeyReady ? (
          <p className="text-sm text-muted-foreground">
            {t("settings.agents.cliLogin.configReadyOptional")}
          </p>
        ) : loginHint ? (
          <p className="text-sm text-muted-foreground">{loginHint}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {methods.length > 0
          ? methods.map((method) => (
              <Button
                disabled={connectMutation.isPending || isWaiting}
                key={method.id}
                onClick={() => {
                  connectMutation.mutate(
                    {
                      methodId: method.id,
                      runtimeId: liveRuntime.id,
                    },
                    {
                      onSuccess: (result) => {
                        setIsWaiting(true);
                        if (result.launched && method.type === "terminal") {
                          setTerminalHint(true);
                        }
                      },
                    },
                  );
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {connectMutation.isPending &&
                connectMutation.variables?.methodId === method.id ? (
                  <Spinner className="mr-1.5 h-3.5 w-3.5 border-2" />
                ) : null}
                {method.name || method.id}
              </Button>
            ))
          : (
              <Button
                disabled={methodsQuery.isFetching}
                onClick={() => void methodsQuery.refetch()}
                size="sm"
                type="button"
                variant="outline"
              >
                {methodsQuery.isFetching ? (
                  <Spinner className="mr-1.5 h-3.5 w-3.5 border-2" />
                ) : null}
                {t("settings.agents.cliLogin.loadMethods")}
              </Button>
            )}
      </div>

      {isWaiting ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.agents.cliLogin.waiting")}
        </p>
      ) : null}
      {terminalHint ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.agents.terminalSignInHint", {
            label: liveRuntime.label,
          })}
        </p>
      ) : null}
      {methodsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">
          {t("settings.agents.signInOptionsFailed", {
            error: methodsQuery.error.message,
          })}
        </p>
      ) : null}
      {connectMutation.error instanceof Error ? (
        <p className="text-sm text-destructive">
          {t("settings.agents.connectFailed", {
            label: liveRuntime.label,
            error: connectMutation.error.message,
          })}
        </p>
      ) : null}
    </div>
  );
}
