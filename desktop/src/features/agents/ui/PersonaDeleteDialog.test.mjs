import assert from "node:assert/strict";
import test from "node:test";

import { personaDeleteDescription } from "./PersonaDeleteDialog.tsx";

const en = {
  "agents.deleteThis": "Delete this agent.",
  "agents.deleteNamed": "Delete {name}.",
  "agents.deleteCascadeOne":
    "Also deletes 1 agent instance and archives its identity on the relay, so it no longer appears in member lists or mention suggestions.",
  "agents.deleteCascadeMany":
    "Also deletes {count} agent instances and archives their identities on the relay, so they no longer appear in member lists or mention suggestions.",
  "agents.deleteNamedCascade": "Delete {name}. {cascade}",
};

const t = (key, params) => {
  let result = en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replaceAll(`{${k}}`, String(v));
    }
  }
  return result;
};

// Regression guard for the persona-cascade consent copy: deleting a persona
// with instances also archives each instance's identity on the relay
// (NIP-IA 9035), a durable externally visible side effect. The confirmation
// dialog must disclose it before the destructive confirm, exactly like the
// direct agent-delete dialog does.

const persona = { displayName: "Scout" };

test("cascade delete discloses relay archival (plural)", () => {
  const copy = personaDeleteDescription(persona, 3, t);
  assert.match(copy, /deletes 3 agent instances/);
  assert.match(copy, /archives their identities on the relay/);
});

test("cascade delete discloses relay archival (singular)", () => {
  const copy = personaDeleteDescription(persona, 1, t);
  assert.match(copy, /deletes 1 agent instance /);
  assert.match(copy, /archives its identity on the relay/);
});

test("no instances → no archival claim (nothing is archived)", () => {
  const copy = personaDeleteDescription(persona, 0, t);
  assert.equal(copy, "Delete Scout.");
  assert.doesNotMatch(copy, /archiv/i);
});

test("null persona keeps the generic fallback", () => {
  assert.equal(personaDeleteDescription(null, 2, t), "Delete this agent.");
});
