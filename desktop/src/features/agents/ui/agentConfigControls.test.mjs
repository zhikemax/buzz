import assert from "node:assert/strict";
import test from "node:test";

import { translate } from "../../../shared/i18n/locale.ts";
import {
  MODEL_NO_MODELS_VALUE,
  appendNoModelsSentinel,
  resolveDefaultModelLabel,
  resolveModelFieldStatusMessage,
} from "./agentConfigControls.tsx";

const t = (key, params) => translate("en", key, params);

test("uses the harness-discovered default model label for an unset model", () => {
  assert.equal(
    resolveDefaultModelLabel({
      discoveredModelOptions: [
        { id: "", label: "Default model (claude-sonnet-5)" },
        { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      ],
      isSharedCompute: false,
      t,
    }),
    "Default model (claude-sonnet-5)",
  );
});

test("falls back to a generic harness default when discovery has no current model", () => {
  assert.equal(
    resolveDefaultModelLabel({
      discoveredModelOptions: [{ id: "", label: "Default model" }],
      isSharedCompute: false,
      t,
    }),
    "Default model",
  );
});

test("an explicit inherited default label wins over harness discovery", () => {
  assert.equal(
    resolveDefaultModelLabel({
      defaultModelLabel: "Default model (team-model)",
      discoveredModelOptions: [
        { id: "", label: "Default model (claude-sonnet-5)" },
      ],
      isSharedCompute: false,
      t,
    }),
    "Default model (team-model)",
  );
});

test("shared compute describes Auto's collective behavior", () => {
  assert.equal(
    resolveDefaultModelLabel({
      discoveredModelOptions: null,
      isSharedCompute: true,
      t,
    }),
    "Auto (collective when available)",
  );
});

// ── appendNoModelsSentinel ─────────────────────────────────────────────────────

test("appendNoModelsSentinel_emptyOptionsDiscoveryFinished_addsDisabledRow", () => {
  const options = appendNoModelsSentinel([], false, t);
  assert.equal(options.length, 1);
  assert.equal(options[0].disabled, true);
  assert.equal(options[0].label, "No models found");
  assert.equal(options[0].value, MODEL_NO_MODELS_VALUE);
});

test("appendNoModelsSentinel_emptyOptionsDiscoveryLoading_doesNotAddRow", () => {
  const options = appendNoModelsSentinel([], true, t);
  assert.equal(options.length, 0);
});

test("appendNoModelsSentinel_nonEmptyOptionsDiscoveryFinished_doesNotAddRow", () => {
  const options = appendNoModelsSentinel(
    [{ label: "Default model", value: "" }],
    false,
    t,
  );
  assert.equal(options.length, 1);
  assert.equal(options[0].label, "Default model");
});

test("model status omits provider selection guidance before discovery", () => {
  assert.equal(
    resolveModelFieldStatusMessage({
      discoveredModelOptions: null,
      loading: false,
      status: null,
      t,
    }),
    null,
  );
});

test("model status preserves loading, discovery, and saved-state messages", () => {
  assert.equal(
    resolveModelFieldStatusMessage({
      discoveredModelOptions: null,
      loading: true,
      status: null,
      t,
    }),
    "Loading models...",
  );
  assert.equal(
    resolveModelFieldStatusMessage({
      discoveredModelOptions: null,
      loading: false,
      status: { message: "Couldn't load models", tone: "warning" },
      t,
    }),
    "Couldn't load models",
  );
  assert.equal(
    resolveModelFieldStatusMessage({
      discoveredModelOptions: [],
      loading: false,
      status: null,
      t,
    }),
    "Saved changes take effect on the next start.",
  );
});
