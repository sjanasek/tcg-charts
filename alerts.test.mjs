import test from "node:test";
import assert from "node:assert/strict";
import { shouldFire } from "./alerts.mjs";

test("Alarm feuert nur beim Unterschreiten", () => {
  assert.equal(shouldFire([120, 110, 95], 100), true);
  assert.equal(shouldFire([120, 95, 90], 100), false);
  assert.equal(shouldFire([120, null, 95], 100), true);
  assert.equal(shouldFire([120, 105], 100), false);
  assert.equal(shouldFire([95], 100), true);
  assert.equal(shouldFire([], 100), false);
});
