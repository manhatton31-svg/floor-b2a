import assert from "node:assert/strict";
import test from "node:test";

test("protocol id is floor.b2a/v1", () => {
  assert.equal("floor.b2a/v1", "floor.b2a/v1");
});

test("house catalog response shape stays honest", () => {
  const catalog = {
    protocol: "floor.b2a/v1",
    generated_at: new Date().toISOString(),
    items: [],
  };
  assert.deepEqual(Object.keys(catalog).sort(), [
    "generated_at",
    "items",
    "protocol",
  ]);
  assert.equal(catalog.items.length, 0);
  assert.ok(!("gmv" in catalog));
  assert.ok(!("fills" in catalog));
  assert.ok(!("agent_purchases" in catalog));
});
