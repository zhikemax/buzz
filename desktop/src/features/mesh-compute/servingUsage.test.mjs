import assert from "node:assert/strict";
import { test } from "node:test";

import { deriveServingIndicator } from "./servingUsage.ts";

function usage(overrides = {}) {
  return {
    inflight: 0,
    peakInflight: 0,
    requestsServed: 0,
    tokensServed: 0,
    tokensPerSecond: 0,
    localAttempts: 0,
    remoteAttempts: 0,
    endpointAttempts: 0,
    peers: 0,
    ...overrides,
  };
}

test("hidden when not sharing", () => {
  const i = deriveServingIndicator(usage({ requestsServed: 5 }), false);
  assert.equal(i.show, false);
});

test("hidden when usage not yet fetched", () => {
  const i = deriveServingIndicator(null, true);
  assert.equal(i.show, false);
});

test("sharing but nothing served yet -> idle, no detail", () => {
  const i = deriveServingIndicator(usage(), true);
  assert.equal(i.show, true);
  assert.equal(i.active, false);
  assert.equal(i.hasRemoteConsumers, false);
  assert.equal(i.labelKey, "settings.compute.usage.idleYet");
  assert.equal(i.detailKey, null);
});

test("only local agent traffic -> not a remote consumer", () => {
  const i = deriveServingIndicator(
    usage({ requestsServed: 4, localAttempts: 4, tokensPerSecond: 30 }),
    true,
  );
  assert.equal(i.hasRemoteConsumers, false);
  assert.equal(i.labelKey, "settings.compute.usage.idleNow");
  assert.equal(i.detailKey, "settings.compute.usage.servedSessionPlural");
  assert.equal(i.detailParams?.count, 4);
});

test("local agent live now -> serving your agent", () => {
  const i = deriveServingIndicator(
    usage({ inflight: 1, localAttempts: 2, tokensPerSecond: 28 }),
    true,
  );
  assert.equal(i.active, true);
  assert.equal(i.hasRemoteConsumers, false);
  assert.equal(i.labelKey, "settings.compute.usage.servingLocal");
  assert.equal(i.labelParams?.count, 1);
});

test("remote consumer, not live -> used by another member (headline case)", () => {
  const i = deriveServingIndicator(
    usage({
      requestsServed: 7,
      remoteAttempts: 6,
      endpointAttempts: 1,
      peers: 2,
    }),
    true,
  );
  assert.equal(i.hasRemoteConsumers, true);
  assert.equal(i.active, false);
  assert.equal(i.labelKey, "settings.compute.usage.usedByMemberPlural");
  assert.equal(i.labelParams?.count, 7); // remote+endpoint = 7
  assert.equal(i.detailKey, "settings.compute.usage.peersDetailPlural");
  assert.equal(i.detailParams?.peers, 2);
});

test("remote consumer live now -> in use now, singular peer/request grammar", () => {
  const i = deriveServingIndicator(
    usage({ inflight: 1, remoteAttempts: 1, peers: 1, tokensPerSecond: 31 }),
    true,
  );
  assert.equal(i.active, true);
  assert.equal(i.hasRemoteConsumers, true);
  assert.equal(i.labelKey, "settings.compute.usage.inUseLive");
  assert.equal(i.detailKey, "settings.compute.usage.peersDetail");
  assert.equal(i.detailParams?.peers, 1);
});
