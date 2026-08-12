import {
  AIMAXHUG_PROVIDER_ID,
  requiredCredentialEnvKeys,
  runtimeUsesAimaxHugGatewayAuth,
} from "@/features/agents/ui/agentConfigOptions";
import type {
  AcpRuntimeCatalogEntry,
  GlobalAgentConfig,
} from "@/shared/api/types";

export type AgentReadinessResult =
  | { ready: true; reason: "cli"; runtimeLabel: string }
  | { ready: true; reason: "buzz-agent" }
  | { ready: false };

function aimaxHugGatewayUnlocks(
  runtimeId: string,
  globalConfig: GlobalAgentConfig,
): boolean {
  if (!runtimeUsesAimaxHugGatewayAuth(runtimeId)) {
    return false;
  }
  const provider = globalConfig.provider?.trim() || AIMAXHUG_PROVIDER_ID;
  if (provider !== AIMAXHUG_PROVIDER_ID) {
    return false;
  }
  return (globalConfig.env_vars.OPENAI_COMPAT_API_KEY ?? "").trim().length > 0;
}

function cliAuthReady(
  runtime: AcpRuntimeCatalogEntry,
  globalConfig: GlobalAgentConfig,
): boolean {
  if (runtime.availability !== "available") {
    return false;
  }
  if (
    runtime.authStatus.status === "logged_in" ||
    runtime.authStatus.status === "not_applicable"
  ) {
    return true;
  }
  return (
    runtime.authStatus.status === "logged_out" &&
    aimaxHugGatewayUnlocks(runtime.id, globalConfig)
  );
}

/**
 * Determine whether the user has a working agent path configured.
 *
 * CLI path: the preferred Claude or Codex runtime is available and logged in
 * (or unlocked via AimaxHug API key). Provider path: the preferred Buzz Agent
 * or Goose runtime has provider and model set, plus all required credential
 * env vars for that provider.
 *
 * Returns enough info for the UI to say which path matched, or that neither did.
 */
export function resolveAgentReadiness(
  runtimes: readonly AcpRuntimeCatalogEntry[],
  globalConfig: GlobalAgentConfig,
  scope: "any" | "preferred" = "any",
): AgentReadinessResult {
  if (scope === "any") {
    for (const runtime of runtimes) {
      if (runtime.id === "buzz-agent") continue;
      if (cliAuthReady(runtime, globalConfig)) {
        return { ready: true, reason: "cli", runtimeLabel: runtime.label };
      }
    }
  }

  const preferredRuntime =
    scope === "preferred"
      ? runtimes.find(
          (runtime) => runtime.id === globalConfig.preferred_runtime,
        )
      : runtimes.find((runtime) => runtime.id === "buzz-agent");
  if (preferredRuntime?.availability !== "available") {
    return { ready: false };
  }

  if (
    (preferredRuntime.id === "claude" || preferredRuntime.id === "codex") &&
    cliAuthReady(preferredRuntime, globalConfig)
  ) {
    return {
      ready: true,
      reason: "cli",
      runtimeLabel: preferredRuntime.label,
    };
  }

  if (preferredRuntime.id !== "buzz-agent" && preferredRuntime.id !== "goose") {
    return { ready: false };
  }

  const provider = globalConfig.provider?.trim() ?? "";
  const model = globalConfig.model?.trim() ?? "";
  if (provider.length > 0 && model.length > 0) {
    const required = requiredCredentialEnvKeys(preferredRuntime.id, provider);
    const allKeysPresent = required.every(
      (key) => (globalConfig.env_vars[key] ?? "").trim().length > 0,
    );
    if (allKeysPresent) {
      return { ready: true, reason: "buzz-agent" };
    }
  }

  return { ready: false };
}
