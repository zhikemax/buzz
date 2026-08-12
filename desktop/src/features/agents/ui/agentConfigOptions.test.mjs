import assert from "node:assert/strict";
import test from "node:test";

import { translate } from "../../../shared/i18n/locale.ts";

import {
  getDefaultPersonaRuntime,
  getPersonaModelOptions,
  getPersonaProviderOptions,
  getProviderApiKeyEnvVar,
  getProviderApiKeyGuideUrl,
  getProviderApiKeyLabel,
  resetConfigForHarnessChange,
  runtimeSupportsLlmProviderSelection,
  runtimeSupportsVendorLoginTab,
  runtimeUsesAimaxHugGatewayAuth,
} from "./agentConfigOptions.tsx";
import { formatModelDiscoveryErrorStatus } from "./personaModelDiscoveryStatus.ts";


const t = (key, params) => translate("en", key, params);

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRuntime(id, availability = "available") {
  return {
    id,
    label: id,
    command: id,
    defaultArgs: [],
    mcpCommand: null,
    availability,
  };
}

// ── getPersonaProviderOptions — hideProviderIds ───────────────────────────────

test("getPersonaProviderOptions lists aimaxhug first among concrete providers", () => {
  const options = getPersonaProviderOptions("", "buzz-agent", t, "", new Set());
  const concrete = options.filter((o) => o.id !== "");
  assert.equal(concrete[0]?.id, "aimaxhug");
  assert.equal(concrete[0]?.label, "AimaxHug");
});

test("getPersonaProviderOptions returns databricks v1 and v2 when hideProviderIds is empty", () => {
  const options = getPersonaProviderOptions("", "buzz-agent", t, "", new Set());
  const ids = options.map((o) => o.id);
  assert.ok(ids.includes("databricks"), "databricks v1 present");
  assert.ok(ids.includes("databricks_v2"), "databricks v2 present");
});

test("getPersonaProviderOptions hides databricks v1 when it is in hideProviderIds", () => {
  const options = getPersonaProviderOptions(
    "",
    "buzz-agent",
    t,
    "",
    new Set(["databricks"]),
  );
  const ids = options.map((o) => o.id);
  assert.ok(!ids.includes("databricks"), "databricks v1 hidden");
  assert.ok(ids.includes("databricks_v2"), "databricks v2 still present");
});

test("getPersonaProviderOptions appends (current) tail for a saved databricks v1 value even when hidden", () => {
  // An agent already persisted with v1 must still render its saved value.
  const options = getPersonaProviderOptions(
    "databricks",
    "buzz-agent",
    t,
    "",
    new Set(["databricks"]),
  );
  const tail = options.at(-1);
  assert.equal(tail?.id, "databricks");
  assert.equal(tail?.label, "databricks (current)");
});

test("getPersonaProviderOptions with no hideProviderIds omits the tail for a known provider", () => {
  const options = getPersonaProviderOptions("anthropic", "buzz-agent", t);
  const tail = options.at(-1);
  // "anthropic" is a known id — no (current) tail appended
  assert.ok(
    tail?.id !== "anthropic" || tail?.label === "Anthropic",
    "no duplicate tail for known provider",
  );
});

test("getPersonaProviderOptions appends (current) tail for an unknown saved provider", () => {
  const options = getPersonaProviderOptions("my-custom-llm", "buzz-agent", t);
  const tail = options.at(-1);
  assert.equal(tail?.id, "my-custom-llm");
  assert.equal(tail?.label, "my-custom-llm (current)");
});

// ── getDefaultPersonaRuntime — buzz-agent first ───────────────────────────────

test("getDefaultPersonaRuntime honors an available global preference", () => {
  const runtimes = [
    makeRuntime("buzz-agent"),
    makeRuntime("goose"),
    makeRuntime("claude"),
  ];
  assert.equal(getDefaultPersonaRuntime(runtimes, "claude")?.id, "claude");
});

test("getDefaultPersonaRuntime ignores an unavailable global preference", () => {
  const runtimes = [
    makeRuntime("buzz-agent"),
    makeRuntime("claude", "not_installed"),
  ];
  assert.equal(getDefaultPersonaRuntime(runtimes, "claude")?.id, "buzz-agent");
});

test("getDefaultPersonaRuntime returns buzz-agent over goose when both are available", () => {
  const runtimes = [
    makeRuntime("goose"),
    makeRuntime("buzz-agent"),
    makeRuntime("claude"),
  ];
  const result = getDefaultPersonaRuntime(runtimes);
  assert.equal(result?.id, "buzz-agent");
});

test("getDefaultPersonaRuntime falls back to goose when buzz-agent is unavailable", () => {
  const runtimes = [
    makeRuntime("buzz-agent", "not_installed"),
    makeRuntime("goose"),
  ];
  const result = getDefaultPersonaRuntime(runtimes);
  assert.equal(result?.id, "goose");
});

test("getDefaultPersonaRuntime returns first available when neither buzz-agent nor goose is available", () => {
  const runtimes = [
    makeRuntime("buzz-agent", "adapter_missing"),
    makeRuntime("goose", "cli_missing"),
    makeRuntime("claude"),
  ];
  const result = getDefaultPersonaRuntime(runtimes);
  assert.equal(result?.id, "claude");
});

test("getDefaultPersonaRuntime returns null for an empty list", () => {
  assert.equal(getDefaultPersonaRuntime([]), null);
});

test("getDefaultPersonaRuntime returns null when no runtime is available", () => {
  const runtimes = [
    makeRuntime("buzz-agent", "not_installed"),
    makeRuntime("goose", "cli_missing"),
  ];
  assert.equal(getDefaultPersonaRuntime(runtimes), null);
});

// ── runtimeSupportsLlmProviderSelection — provider gating ────────────────────

test("runtimeSupportsLlmProviderSelection is true for buzz-agent and goose", () => {
  assert.equal(runtimeSupportsLlmProviderSelection("buzz-agent"), true);
  assert.equal(runtimeSupportsLlmProviderSelection("goose"), true);
});

test("runtimeSupportsLlmProviderSelection is true for codex, claude, and catalog CLIs", () => {
  assert.equal(runtimeSupportsLlmProviderSelection("codex"), true);
  assert.equal(runtimeSupportsLlmProviderSelection("claude"), true);
  assert.equal(runtimeSupportsLlmProviderSelection("amp"), true);
});

test("runtimeSupportsLlmProviderSelection is false for empty id", () => {
  assert.equal(runtimeSupportsLlmProviderSelection(""), false);
});

test("runtimeSupportsVendorLoginTab covers claude and codex", () => {
  assert.equal(
    runtimeSupportsVendorLoginTab({ id: "claude", loginHint: null }),
    true,
  );
  assert.equal(
    runtimeSupportsVendorLoginTab({ id: "codex", loginHint: "" }),
    true,
  );
  assert.equal(
    runtimeSupportsVendorLoginTab({ id: "amp", loginHint: null }),
    false,
  );
  assert.equal(
    runtimeSupportsVendorLoginTab({
      id: "amp",
      loginHint: "Run amp login",
    }),
    true,
  );
});

test("runtimeUsesAimaxHugGatewayAuth covers catalog CLIs but not goose/buzz-agent", () => {
  assert.equal(runtimeUsesAimaxHugGatewayAuth("amp"), true);
  assert.equal(runtimeUsesAimaxHugGatewayAuth("cursor"), true);
  assert.equal(runtimeUsesAimaxHugGatewayAuth("codex"), true);
  assert.equal(runtimeUsesAimaxHugGatewayAuth("claude"), true);
  assert.equal(runtimeUsesAimaxHugGatewayAuth("buzz-agent"), false);
  assert.equal(runtimeUsesAimaxHugGatewayAuth("goose"), false);
});

test("resetConfigForHarnessChange clears model but keeps compatible provider", () => {
  const config = {
    env_vars: { BUZZ_AGENT_THINKING_EFFORT: "high", KEEP_ME: "yes" },
    model: "claude-opus",
    preferred_runtime: "buzz-agent",
    provider: "anthropic",
  };

  assert.deepEqual(resetConfigForHarnessChange(config, "claude"), {
    env_vars: { KEEP_ME: "yes" },
    model: null,
    preferred_runtime: "claude",
    provider: "anthropic",
  });
});

test("resetConfigForHarnessChange preserves compatible provider selection", () => {
  const config = {
    env_vars: { KEEP_ME: "yes" },
    model: "old-model",
    preferred_runtime: "claude",
    provider: "anthropic",
  };

  assert.deepEqual(resetConfigForHarnessChange(config, "goose"), {
    env_vars: { KEEP_ME: "yes" },
    model: null,
    preferred_runtime: "goose",
    provider: "anthropic",
  });
});

test("resetConfigForHarnessChange does not carry relay mesh to Goose", () => {
  const config = {
    env_vars: {},
    model: "auto",
    preferred_runtime: "buzz-agent",
    provider: "relay-mesh",
  };

  assert.equal(resetConfigForHarnessChange(config, "goose").provider, null);
});

// ── getPersonaModelOptions — all harnesses honor provider selection ─────────

test("getPersonaModelOptions for codex with anthropic filters out zero-value default", () => {
  const options = getPersonaModelOptions("codex", "anthropic");
  const zeroValue = options.find((o) => o.id === "");
  assert.equal(
    zeroValue,
    undefined,
    "explicit-model provider must not allow zero-value selection",
  );
});

test("getPersonaModelOptions for codex with no provider returns default model", () => {
  const options = getPersonaModelOptions("codex", "");
  assert.equal(options.length, 1);
  assert.equal(options[0]?.id, "");
});

test("getPersonaModelOptions for buzz-agent with anthropic filters out zero-value default", () => {
  // anthropic requires explicit model — zero-value option is filtered out
  const options = getPersonaModelOptions("buzz-agent", "anthropic");
  const zeroValue = options.find((o) => o.id === "");
  assert.equal(
    zeroValue,
    undefined,
    "explicit-model provider must not allow zero-value selection",
  );
});

test("getPersonaModelOptions for buzz-agent with no provider returns default model", () => {
  const options = getPersonaModelOptions("buzz-agent", "");
  assert.equal(options.length, 1);
  assert.equal(options[0]?.id, "");
});

// ── formatModelDiscoveryErrorStatus — runtime unavailable ────────────────────
//
// When selectedRuntime.availability !== "available", AgentDefinitionDialog and
// usePersonaModelDiscovery now call formatModelDiscoveryErrorStatus with a
// synthetic "Runtime not available: <availability>" error. Verify the status
// is non-null (so the UI surfaces the reason) for each unavailability reason.

test("formatModelDiscoveryErrorStatus returns a non-null status for runtime unavailable errors", () => {
  for (const availability of [
    "adapter_missing",
    "cli_missing",
    "not_installed",
  ]) {
    const status = formatModelDiscoveryErrorStatus(
      new Error(`Runtime not available: ${availability}`),
      "anthropic",
      t,
    );
    assert.ok(
      status !== null,
      `should return a status for availability=${availability}`,
    );
    assert.ok(typeof status?.message === "string", "status has a message");
    assert.ok(typeof status?.tone === "string", "status has a tone");
  }
});

// ── getProviderApiKeyLabel — provider-accurate credential field labels ────────
//
// Each provider with a secretEnvVar must have a distinct label. The helper
// is the single source of truth used by all three credential field surfaces;
// if it regresses the field labels diverge silently and the OpenRouter / compat
// mislabeling recurs.

test("getProviderApiKeyLabel_aimaxhug_returns_aimaxhug_label", () => {
  assert.equal(getProviderApiKeyLabel("aimaxhug"), "AimaxHug API Key");
});

test("getProviderApiKeyEnvVar_aimaxhug_uses_openai_compat_key", () => {
  assert.equal(getProviderApiKeyEnvVar("aimaxhug"), "OPENAI_COMPAT_API_KEY");
});

test("getProviderApiKeyGuideUrl_aimaxhug_points_at_console", () => {
  assert.equal(
    getProviderApiKeyGuideUrl("aimaxhug"),
    "https://api.aimaxhug.cloud",
  );
});

test("getProviderApiKeyLabel_anthropic_returns_anthropic_label", () => {
  assert.equal(getProviderApiKeyLabel("anthropic"), "Anthropic API Key");
});

test("getProviderApiKeyLabel_openai_returns_openai_runtime_label", () => {
  assert.equal(getProviderApiKeyLabel("openai"), "OpenAI Runtime API Key");
});

test("getProviderApiKeyLabel_openai_compat_returns_distinct_label", () => {
  // openai and openai-compat must have distinct labels — both use
  // OPENAI_COMPAT_API_KEY but carry different semantic identities.
  assert.equal(
    getProviderApiKeyLabel("openai-compat"),
    "OpenAI-compatible Runtime API Key",
  );
});

test("getProviderApiKeyLabel_openrouter_returns_openrouter_label", () => {
  // Key fix: OpenRouter was mislabeled "OpenAI API Key" before this change.
  assert.equal(getProviderApiKeyLabel("openrouter"), "OpenRouter API Key");
});

test("getProviderApiKeyLabel_databricks_returns_null", () => {
  // Databricks uses OAuth PKCE — no typed-secret label.
  assert.equal(getProviderApiKeyLabel("databricks"), null);
});

test("getProviderApiKeyLabel_databricks_v2_returns_null", () => {
  assert.equal(getProviderApiKeyLabel("databricks_v2"), null);
});

test("getProviderApiKeyLabel_unknown_provider_returns_null", () => {
  assert.equal(getProviderApiKeyLabel("some-unknown-provider"), null);
});

test("getProviderApiKeyLabel_provider_id_trimmed_and_lowercased", () => {
  // Mirrors getProviderApiKeyEnvVar normalisation behaviour.
  assert.equal(getProviderApiKeyLabel(" Anthropic "), "Anthropic API Key");
});
