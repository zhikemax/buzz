import assert from "node:assert/strict";
import test from "node:test";

import { formatModelDiscoveryErrorStatus } from "./personaModelDiscoveryStatus.ts";


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
test("model discovery status names missing Anthropic credentials", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("config: ANTHROPIC_API_KEY required"),
    "anthropic",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /Anthropic API key/);
  assert.match(status?.message ?? "", /Anthropic models/);
});

test("model discovery status names missing OpenAI-compatible credentials", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("config: OPENAI_COMPAT_API_KEY required"),
    "openai-compat",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /OpenAI runtime API key/);
  assert.match(status?.message ?? "", /OPENAI_COMPAT_API_KEY/);
  assert.match(status?.message ?? "", /OpenAI models/);
});

test("Buzz shared compute names the empty state and next action", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("no Buzz shared compute serving members are available"),
    "relay-mesh",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /No members are sharing compute/);
  assert.match(status?.message ?? "", /Settings > Compute/);
});

test("Buzz shared compute distinguishes relay lookup failures", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("Buzz shared compute model discovery failed: relay offline"),
    "relay-mesh",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /couldn't check shared compute/);
  assert.match(status?.message ?? "", /relay connection/);
});

test("Buzz shared compute names a missing relay member roster", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("Buzz shared compute is waiting for the current member roster"),
    "relay-mesh",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /waiting for the relay's member roster/);
  assert.match(status?.message ?? "", /membership configuration/);
  assert.doesNotMatch(status?.message ?? "", /relay connection/);
});

test("model discovery status stays quiet for missing Databricks defaults", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("config: DATABRICKS_HOST required"),
    "databricks",
    t,
  );

  assert.equal(status, null);
});

test("Databricks sign-in-required is a muted note pointing at the picker and CLI", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error(
      "Databricks sign-in is required; save this agent, then open its model picker to sign in, or run `buzz-agent auth databricks`",
    ),
    "databricks_v2",
  );

  assert.equal(status?.tone, "muted");
  assert.match(status?.message ?? "", /model picker/);
  assert.match(status?.message ?? "", /buzz-agent auth databricks/);
});

test("Databricks sign-in failure warns and points at the explicit retry", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("Databricks sign-in failed: oauth callback: access_denied"),
    "databricks_v2",
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /didn't complete/);
  assert.match(status?.message ?? "", /model picker/);
});

test("Databricks sign-in timeout warns and points at the explicit retry", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error(
      "Databricks sign-in timed out; open the model picker to retry, or run `buzz-agent auth databricks`",
    ),
    "databricks_v2",
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /didn't complete/);
  assert.match(status?.message ?? "", /buzz-agent auth databricks/);
});

test("other Databricks discovery failures fall through to the generic notice", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("Databricks model discovery failed: relay offline"),
    "databricks_v2",
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /Using built-in model options/);
});

test("auth-required errors name the agent and ask for sign-in", () => {
  // Real shape from run_agent_models_command wrapping buzz-acp stderr when
  // cursor-agent is signed out (spec ErrorCode::AuthRequired text).
  const status = formatModelDiscoveryErrorStatus(
    new Error(
      "buzz-acp models failed (exit 1): agent communication failed: Agent reported error (code -32000): Authentication required",
    ),
    "",
    t,
    "Cursor",
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /Cursor requires sign-in/);
  assert.match(status?.message ?? "", /Sign in with the Cursor CLI/);
});

test("auth-required copy degrades gracefully without an agent label", () => {
  const status = formatModelDiscoveryErrorStatus(
    new Error("Agent reported error (code -32000): Authentication required"),
    "",
    t,
  );

  assert.equal(status?.tone, "warning");
  assert.match(status?.message ?? "", /This agent requires sign-in/);
});

test("non-auth -32000 errors do NOT get the sign-in copy", () => {
  // -32000 is the catch-all fallback code for unclassified agent errors
  // (agent_error_from_json unwrap_or(-32000)); only the spec-reserved
  // "Authentication required" text may route to the sign-in message.
  const status = formatModelDiscoveryErrorStatus(
    new Error(
      "buzz-acp models failed (exit 1): Agent reported error (code -32000): model catalog fetch timed out",
    ),
    "anthropic",
    t,
    "Cursor",
  );

  assert.equal(status?.tone, "warning");
  assert.doesNotMatch(status?.message ?? "", /sign-in/i);
  assert.match(status?.message ?? "", /Using built-in model options/);
});
