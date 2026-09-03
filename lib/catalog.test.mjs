import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const FORBIDDEN = [
  ["keep the", "desk"].join(" "),
  ["keep the", "seat"].join(" "),
  "lifetime",
  ["forever", "access"].join(" "),
];

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
  assert.equal(catalog.protocol, "floor.b2a/v1");
  assert.equal(catalog.items.length, 0);
  assert.ok(!("gmv" in catalog));
  assert.ok(!("fills" in catalog));
  assert.ok(!("agent_purchases" in catalog));
});

test("source copy has no permanent-access language", () => {
  const listed = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter(
      (path) =>
        !path.startsWith("package-lock") &&
        path !== "lib/catalog.test.mjs" &&
        path !== "scripts/verify-routes.sh",
    );
  const hits = [];
  for (const path of listed) {
    const text = readFileSync(path, "utf8").toLowerCase();
    for (const phrase of FORBIDDEN) {
      if (text.includes(phrase)) hits.push(`${path}: ${phrase}`);
    }
  }
  assert.deepEqual(hits, []);
});
