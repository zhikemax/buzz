import assert from "node:assert/strict";
import test from "node:test";

import { resolveAgentCardModelLabel } from "./agentCardModelLabel.ts";


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
test("resolveAgentCardModelLabel — unspawned definition with explicit model renders the model, not inherited", () => {
  const label = resolveAgentCardModelLabel({
    agent: undefined,
    personaModel: "gpt-5",
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "gpt-5");
});

test("resolveAgentCardModelLabel — unspawned definition with no model renders the default", () => {
  const label = resolveAgentCardModelLabel({
    agent: undefined,
    personaModel: null,
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "Default model (claude-sonnet)");
});

test("resolveAgentCardModelLabel — linked instance inheriting the global default ignores stale persona.model", () => {
  const label = resolveAgentCardModelLabel({
    agent: { modelSource: "global", model: "stale-model" },
    personaModel: "gpt-5",
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "Default model (claude-sonnet)");
});

test("resolveAgentCardModelLabel — linked instance with no modelSource (legacy/unset) is treated as inherited", () => {
  const label = resolveAgentCardModelLabel({
    agent: { modelSource: null, model: "stale-model" },
    personaModel: "gpt-5",
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "Default model (claude-sonnet)");
});

test("resolveAgentCardModelLabel — linked instance with an explicit resolved model renders that model", () => {
  const label = resolveAgentCardModelLabel({
    agent: { modelSource: "definition", model: "gpt-5" },
    personaModel: "should-not-be-used",
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "gpt-5");
});

test("resolveAgentCardModelLabel — non-inherited agent with a blank resolved model falls back to the default", () => {
  const label = resolveAgentCardModelLabel({
    agent: { modelSource: "instance_legacy", model: "  " },
    personaModel: null,
    defaultModel: "claude-sonnet",
    t,
  });
  assert.equal(label, "Default model (claude-sonnet)");
});
