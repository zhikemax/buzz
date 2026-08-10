import type { TranslateFn } from "@/shared/i18n";

export type PersonaModelDiscoveryStatus = {
  message: string;
  tone: "muted" | "warning";
};

function errorMessage(error: unknown, t: TranslateFn): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return t("agents.unknownModelDiscoveryError");
  }
}

function providerObjectLabel(provider: string, t: TranslateFn): string {
  switch (provider.trim()) {
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    case "openai-compat":
      return t("settings.agents.provider.openaiCompat");
    case "relay-mesh":
      return t("settings.agents.provider.relayMesh");
    default:
      return provider.trim() || t("agents.thisProvider");
  }
}

function isEmptySharedComputeError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("shared compute status is not published") ||
    normalized.includes("no buzz shared compute serving members") ||
    normalized.includes("no live buzz shared compute models") ||
    normalized.includes("no live member is serving") ||
    normalized.includes("requires a live serving member")
  );
}

export function formatModelDiscoveryErrorStatus(
  error: unknown,
  provider: string,
  t: TranslateFn,
  agentLabel?: string,
): PersonaModelDiscoveryStatus | null {
  const message = errorMessage(error, t);

  if (provider.trim() === "relay-mesh") {
    if (message.includes("waiting for the current member roster")) {
      return {
        message: t("agents.discoveryWaitingRoster"),
        tone: "warning",
      };
    }

    if (isEmptySharedComputeError(message)) {
      return {
        message: t("agents.discoveryNoSharingMembers"),
        tone: "warning",
      };
    }

    if (message.includes("shared compute is not available in this build")) {
      return {
        message: t("agents.discoverySharedComputeUnavailable"),
        tone: "warning",
      };
    }

    if (message.includes("shared compute status is malformed")) {
      return {
        message: t("agents.discoverySharedComputeMalformed"),
        tone: "warning",
      };
    }

    return {
      message: t("agents.discoverySharedComputeCheckFailed"),
      tone: "warning",
    };
  }

  // Spec-reserved auth error text (agent-client-protocol ErrorCode::AuthRequired),
  // surfaced verbatim through buzz-acp's stderr — generic across conformant
  // harnesses (e.g. cursor-agent when not signed in). Match the message text,
  // NOT code -32000: that code is also the catch-all fallback for unclassified
  // errors, so matching it would swallow unrelated failures into "sign in".
  if (message.toLowerCase().includes("authentication required")) {
    const label = agentLabel?.trim();
    const name = label || t("agents.thisAgentCapitalized");
    const namePossessive = label || t("agents.agentPossessive");
    return {
      message: t("agents.discoveryAuthRequired", { name, namePossessive }),
      tone: "warning",
    };
  }

  if (message.includes("ANTHROPIC_API_KEY required")) {
    return {
      message: t("agents.discoveryAnthropicKeyRequired"),
      tone: "warning",
    };
  }

  if (message.includes("OPENAI_COMPAT_API_KEY required")) {
    return {
      message: t("agents.discoveryOpenaiCompatKeyRequired"),
      tone: "warning",
    };
  }

  if (
    message.includes("DATABRICKS_HOST required") ||
    message.includes("DATABRICKS_MODEL required") ||
    message.includes("BUZZ_AGENT_PROVIDER is required")
  ) {
    return null;
  }

  return {
    message: t("agents.discoveryUsingBuiltIn", {
      provider: providerObjectLabel(provider, t),
    }),
    tone: "warning",
  };
}
