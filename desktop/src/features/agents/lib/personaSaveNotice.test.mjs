import assert from "node:assert/strict";
import test from "node:test";

import { personaSaveNotice } from "./personaSaveNotice.ts";

/** Identity translate — returns the English catalog string shape for asserts. */
function t(key, params = {}) {
  const catalog = {
    "agents.updatedNamed": `Updated ${params.name}.`,
    "agents.updatedAndPublished": `Updated ${params.name} and published it to the community catalog.`,
    "agents.updatedPublishQueued": `Updated ${params.name}. Publishing to the community catalog is queued and will appear after the relay accepts the update.`,
  };
  return catalog[key] ?? key;
}

test("test_plain_save_notice_says_nothing_about_the_catalog", () => {
  const notice = personaSaveNotice("Helper", null, t);
  assert.equal(notice, "Updated Helper.");
  assert.ok(!/catalog/i.test(notice));
});

test("test_accepted_publish_notice_claims_the_catalog_has_the_edit", () => {
  assert.match(
    personaSaveNotice("Helper", "published", t),
    /published it to the community catalog/,
  );
});

// The whole point of routing "Save and publish" through the dedicated command is
// that a queued edit must NOT be reported as published — the relay hasn't taken
// it yet, so the catalog still shows the old definition.
test("test_queued_publish_notice_does_not_claim_the_edit_is_published", () => {
  const notice = personaSaveNotice("Helper", "queued", t);
  assert.match(notice, /queued/);
  assert.ok(
    !/\bpublished\b/.test(notice),
    "a queued edit must not be described as published",
  );
});
