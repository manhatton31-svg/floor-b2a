import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const FORBIDDEN = [
  ["keep the", "desk"].join(" "),
  ["keep the", "seat"].join(" "),
  ["merchant", "seat"].join(" "),
  "lifetime",
  "indefinite",
  "isn't human",
  "agents fill skus",
];

test("public CTA is the kernel string", () => {
  const src = readFileSync(new URL("./site.ts", import.meta.url), "utf8");
  assert.match(src, /Open a desk · \$49 once for 12 months/);
  assert.doesNotMatch(src, /12-month access/);
});

test("house product list stays honest", () => {
  const catalog = {
    protocol: "floor.b2a/v1",
    generated_at: new Date().toISOString(),
    items: [],
    settlement: "not_settled",
  };
  assert.equal(catalog.protocol, "floor.b2a/v1");
  assert.equal(catalog.items.length, 0);
  assert.equal(catalog.settlement, "not_settled");
  assert.ok(!("gmv" in catalog));
});

test("source copy has no banned lifetime or clever lines", () => {
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
