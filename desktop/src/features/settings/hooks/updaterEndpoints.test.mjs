import assert from "node:assert/strict";
import test from "node:test";

import {
  FORK_GITHUB_REPO,
  GITHUB_RELEASES_URL,
  UPDATER_LATEST_JSON_URL,
} from "./updaterEndpoints.ts";

test("fork updater endpoints point at zhikemax/buzz", () => {
  assert.equal(FORK_GITHUB_REPO, "zhikemax/buzz");
  assert.equal(
    GITHUB_RELEASES_URL,
    "https://github.com/zhikemax/buzz/releases/latest",
  );
  assert.equal(
    UPDATER_LATEST_JSON_URL,
    "https://github.com/zhikemax/buzz/releases/download/buzz-desktop-latest/latest.json",
  );
  assert.ok(!GITHUB_RELEASES_URL.includes("block/buzz"));
  assert.ok(!UPDATER_LATEST_JSON_URL.includes("block/buzz"));
});
