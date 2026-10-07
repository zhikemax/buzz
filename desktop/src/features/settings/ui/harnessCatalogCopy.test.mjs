import assert from "node:assert/strict";
import test from "node:test";

import { harnessDescription } from "./harnessCatalogCopy.ts";

test("Pi catalog entry maps to its curated description message key", () => {
  // Fork: descriptions are i18n MessageKeys resolved via t() at render time.
  assert.equal(harnessDescription("pi"), "settings.agents.harnessDesc.pi");
});
