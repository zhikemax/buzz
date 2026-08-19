import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveModelDiscoveryPending,
  getDiscoveredPersonaModelOptions,
  isCacheableDiscoveryResponse,
  isSuccessfulEmptyDiscovery,
  synthesizeEmptyDiscoveryStatus,
} from "./usePersonaModelDiscovery.ts";

function response(overrides = {}) {
  return {
    agentName: "mock",
    agentVersion: "0.0.0",
    models: [],
    agentDefaultModel: null,
    selectedModel: null,
    supportsSwitching: true,
    ...overrides,
  };
}


function t(key, params = {}) {
  const catalog = {
    "agents.editFailed": "Edit failed",
    "agents.editingFile": "Editing file",
    "agents.editedFile": "Edited file",
    "agents.labelFailed": `${params.label} failed`,
    "agents.activityResponding": "Responding",
    "agents.activityUserPrompt": "User prompt",
    "agents.activityPlanning": "Planning",
    "agents.defaultModel": "Default model",
    "agents.defaultAuto": "Default (auto)",
    "agents.thisAgentCapitalized": "This agent",
    "agents.thisProvider": "this provider",
    "agents.reportedNoModels":
      `${params.name} reported no models. Check that the CLI is installed and signed in, then reopen this screen.`,
    "agents.unknownModelDiscoveryError": "Unknown model discovery error",
    "agents.discoveryWaitingRoster":
      "Buzz is waiting for the relay's member roster. Try again shortly; if this persists, check the relay's membership configuration.",
    "agents.discoveryNoSharingMembers":
      "No members are sharing compute right now. On a member machine, open Settings > Compute, choose a model, and turn on Share this machine.",
    "agents.discoverySharedComputeUnavailable":
      "This version of Buzz cannot use shared compute. Update Buzz or choose another provider.",
    "agents.discoverySharedComputeMalformed":
      "Buzz received an invalid shared compute status. Check the member machine, then try again.",
    "agents.discoverySharedComputeCheckFailed":
      "Buzz couldn't check shared compute through the relay. Check your relay connection and try again.",
    "agents.discoveryAuthRequired":
      `${params.name} requires sign-in before models can load. Sign in with the ${params.namePossessive} CLI in a terminal, then try again.`,
    "agents.agentPossessive": "agent's",
    "agents.discoveryAnthropicKeyRequired":
      "Enter an Anthropic API key to load Anthropic models.",
    "agents.discoveryOpenaiCompatKeyRequired":
      "Enter an OpenAI runtime API key (OPENAI_COMPAT_API_KEY) to load OpenAI models.",
    "agents.discoveryUsingBuiltIn":
      `Using built-in model options. Could not load live models for ${params.provider}.`,
    "settings.agents.defaultModel": "Default model",
    "settings.agents.defaultModelWithId": `Default model (${params.model})`,
    "settings.agents.provider.openaiCompat": "OpenAI-compatible",
    "settings.agents.provider.relayMesh": "Buzz shared compute",
  };
  return catalog[key] ?? key;
}
test("merges the harness's own 'default' catalog entry into the canonical default row", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: "default", name: null, description: null },
        { id: "claude-opus-4-8", name: null, description: null },
        { id: "claude-sonnet-5", name: null, description: null },
      ],
    }),
    "",
  t);

  // Exactly one default row (id ""), and no raw "default" entry remains.
  assert.deepEqual(
    options.map((option) => option.id),
    ["", "claude-opus-4-8", "claude-sonnet-5"],
  );
  assert.equal(options[0].label, "Default model");
});

test("default row shows the harness-reported current model when available", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      agentDefaultModel: "gpt-5.5[high]",
      models: [
        { id: "gpt-5.5", name: "GPT-5.5", description: null },
        { id: "gpt-5.4", name: "GPT-5.4", description: null },
      ],
    }),
    "",
  t);

  assert.equal(options[0].id, "");
  assert.equal(options[0].label, "Default model (gpt-5.5[high])");
  assert.deepEqual(
    options.slice(1).map((option) => option.id),
    ["gpt-5.5", "gpt-5.4"],
  );
});

test("the 'default' id match is case-insensitive and trimmed", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: " Default ", name: null, description: null },
        { id: "claude-sonnet-5", name: null, description: null },
      ],
    }),
    "",
  t);

  assert.deepEqual(
    options.map((option) => option.id),
    ["", "claude-sonnet-5"],
  );
});

test("explicit-model providers get no default row (no harness default entry)", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: "goose-claude-4-6-sonnet", name: null, description: null },
      ],
    }),
    "anthropic",
  t);

  assert.deepEqual(
    options.map((option) => option.id),
    ["goose-claude-4-6-sonnet"],
  );
});

test("relay-mesh keeps its automatic routing default row", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [{ id: "llama-3", name: "Llama 3", description: null }],
    }),
    "relay-mesh",
  t);

  assert.equal(options[0].id, "");
  assert.equal(options[0].label, "Default (auto)");
});

test("returns null when discovery is unsupported or empty", () => {
  assert.equal(
    getDiscoveredPersonaModelOptions(
      response({ supportsSwitching: false }),
      "",
  t),
    null,
  );
  assert.equal(getDiscoveredPersonaModelOptions(null, "", t), null);
});

// ── synthesizeEmptyDiscoveryStatus ────────────────────────────────────────────

test("synthesizeEmptyDiscoveryStatus_emptyModels_producesWarningStatus", () => {
  const status = synthesizeEmptyDiscoveryStatus(
    response({ models: [], agentName: "Claude Code" }),
    "",
  t);
  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /Claude Code/);
  assert.match(status?.message ?? "", /reported no models/);
});

test("synthesizeEmptyDiscoveryStatus_supportsSwitchingFalse_producesWarningStatus", () => {
  const status = synthesizeEmptyDiscoveryStatus(
    response({
      supportsSwitching: false,
      models: [{ id: "gpt-4", name: "GPT-4", description: null }],
      agentName: "Codex",
    }),
    "",
  t);
  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /Codex/);
});

test("synthesizeEmptyDiscoveryStatus_withUsableModels_returnsNull", () => {
  assert.equal(
    synthesizeEmptyDiscoveryStatus(
      response({
        models: [
          { id: "claude-sonnet-5", name: "Claude Sonnet 5", description: null },
        ],
        agentName: "Claude Code",
      }),
      "",
  t),
    null,
  );
});

test("synthesizeEmptyDiscoveryStatus_emptyAgentName_usesGenericFallback", () => {
  const status = synthesizeEmptyDiscoveryStatus(
    response({ models: [], agentName: "" }),
    "",
  t);
  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /This agent/);
});

// ── isCacheableDiscoveryResponse ──────────────────────────────────────────────

test("isCacheableDiscoveryResponse_withUsableModels_returnsTrue", () => {
  assert.equal(
    isCacheableDiscoveryResponse(
      response({
        models: [
          { id: "claude-sonnet-5", name: "Claude Sonnet 5", description: null },
        ],
      }),
      "",
      t,
    ),
    true,
  );
});

test("isCacheableDiscoveryResponse_emptyModels_returnsFalse", () => {
  // An empty-result response must not be cached so close→reopen retries
  // discovery after the user installs or signs into the CLI.
  assert.equal(
    isCacheableDiscoveryResponse(response({ models: [] }), "", t),
    false,
  );
});

test("isCacheableDiscoveryResponse_supportsSwitchingFalse_returnsFalse", () => {
  assert.equal(
    isCacheableDiscoveryResponse(
      response({
        supportsSwitching: false,
        models: [{ id: "gpt-4", name: "GPT-4", description: null }],
      }),
      "",
      t,
    ),
    false,
  );
});

// ── deriveModelDiscoveryPending ────────────────────────────────────────────────

test("deriveModelDiscoveryPending_stillLoading_isTrue", () => {
  assert.equal(
    deriveModelDiscoveryPending({
      modelDiscoveryLoading: true,
      modelDiscoveryKey: "key",
      activeModelDiscoveryData: null,
      activeModelDiscoveryStatus: null,
    }),
    true,
  );
});

test("deriveModelDiscoveryPending_keySetDataNullStatusNull_isTrue", () => {
  // A key is set but neither data nor status has arrived yet → still pending.
  assert.equal(
    deriveModelDiscoveryPending({
      modelDiscoveryLoading: false,
      modelDiscoveryKey: "key",
      activeModelDiscoveryData: null,
      activeModelDiscoveryStatus: null,
    }),
    true,
  );
});

test("deriveModelDiscoveryPending_resolvedEmptyResponse_isNotPending", () => {
  // A resolved-but-empty response sets data non-null and status to a warning.
  // Neither condition for pending is met — the hook must not spin forever.
  const emptyResponse = response({ models: [] });
  const warningStatus = { message: "no models", tone: "warning" };
  assert.equal(
    deriveModelDiscoveryPending({
      modelDiscoveryLoading: false,
      modelDiscoveryKey: "key",
      activeModelDiscoveryData: emptyResponse,
      activeModelDiscoveryStatus: warningStatus,
    }),
    false,
  );
});

test("deriveModelDiscoveryPending_noKey_isNotPending", () => {
  // key=null means discovery is not expected (e.g. dialog closed).
  assert.equal(
    deriveModelDiscoveryPending({
      modelDiscoveryLoading: false,
      modelDiscoveryKey: null,
      activeModelDiscoveryData: null,
      activeModelDiscoveryStatus: null,
    }),
    false,
  );
});

// ── isSuccessfulEmptyDiscovery ────────────────────────────────────────────────

test("isSuccessfulEmptyDiscovery_resolvedEmptyResponse_isTrue", () => {
  assert.equal(
    isSuccessfulEmptyDiscovery({
      activeModelDiscoveryData: response({ models: [] }),
      discoveredModelOptions: null,
      modelDiscoveryPending: false,
    }),
    true,
  );
});

test("isSuccessfulEmptyDiscovery_thrownFailure_isFalse", () => {
  // Failure path leaves data null — must not be treated as successful empty.
  assert.equal(
    isSuccessfulEmptyDiscovery({
      activeModelDiscoveryData: null,
      discoveredModelOptions: null,
      modelDiscoveryPending: false,
    }),
    false,
  );
});

test("isSuccessfulEmptyDiscovery_withUsableModels_isFalse", () => {
  assert.equal(
    isSuccessfulEmptyDiscovery({
      activeModelDiscoveryData: response({
        models: [
          { id: "claude-sonnet-5", name: "Claude Sonnet 5", description: null },
        ],
      }),
      discoveredModelOptions: [
        { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      ],
      modelDiscoveryPending: false,
    }),
    false,
  );
});

test("isSuccessfulEmptyDiscovery_stillPending_isFalse", () => {
  assert.equal(
    isSuccessfulEmptyDiscovery({
      activeModelDiscoveryData: null,
      discoveredModelOptions: null,
      modelDiscoveryPending: true,
    }),
    false,
  );
});

// ── Discovered rows resolve through the shared label resolver ────────────────
// Discovery can return a Databricks endpoint with a null or blank `name`
// (v1 catalogs, and any harness that echoes IDs only). Those rows must still
// show the curated registry name rather than the raw endpoint ID.

test("discoveredRow_knownDatabricksIdWithNullName_showsCuratedName", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [{ id: "databricks-gpt-5-5", name: null, description: null }],
    }),
    "",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-gpt-5-5", label: "GPT-5.5" },
  ]);
});

test("discoveredRow_knownDatabricksIdWithBlankName_showsCuratedName", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: "databricks-claude-opus-4-7", name: "   ", description: null },
      ],
    }),
    "",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-claude-opus-4-7", label: "Claude Opus 4.7" },
  ]);
});

test("discoveredRow_unknownCustomEndpointWithNoName_showsRawId", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: "databricks-team-2025-01", name: null, description: null },
      ],
    }),
    "",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-team-2025-01", label: "databricks-team-2025-01" },
  ]);
});

test("discoveredRow_nonblankDiscoveredName_winsOverRegistry", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        { id: "databricks-gpt-5-5", name: "Workspace GPT", description: null },
      ],
    }),
    "",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-gpt-5-5", label: "Workspace GPT" },
  ]);
});

// ── Real buzz-agent discovery shape: name echoes the id ─────────────────────
// buzz-agent's Databricks discovery emits {id, name: id} on every path (the
// API has no display-name field). The echoed name must not short-circuit the
// registry tier, so a known id still shows its curated label.

test("discoveredRow_knownDatabricksIdEchoedName_showsCuratedName", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        {
          id: "databricks-gpt-5-5",
          name: "databricks-gpt-5-5",
          description: null,
        },
      ],
    }),
    "databricks_v2",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-gpt-5-5", label: "GPT-5.5" },
  ]);
});

test("discoveredRow_unknownDatabricksIdEchoedName_showsRawId", () => {
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        {
          id: "databricks-team-2025-01",
          name: "databricks-team-2025-01",
          description: null,
        },
      ],
    }),
    "databricks_v2",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-team-2025-01", label: "databricks-team-2025-01" },
  ]);
});

test("discoveredRow_defaultCatalogSuffixedName_winsOverRegistry", () => {
  // The auth-empty fallback carries a distinct curated+suffixed name; tier 1
  // correctly keeps it rather than re-deriving the bare label.
  const options = getDiscoveredPersonaModelOptions(
    response({
      models: [
        {
          id: "databricks-gpt-5-5",
          name: "GPT-5.5 (default catalog)",
          description: null,
        },
      ],
    }),
    "databricks_v2",
  );

  assert.deepEqual(options.slice(1), [
    { id: "databricks-gpt-5-5", label: "GPT-5.5 (default catalog)" },
  ]);
});
