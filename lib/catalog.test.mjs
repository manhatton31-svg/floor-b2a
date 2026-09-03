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
  assert.match(src, /Open a desk · \$49 once · 12 months/);
  assert.doesNotMatch(src, /12-month access/);
});

test("house product list is the real FLOOR desk", () => {
  const src = readFileSync(new URL("./catalog.ts", import.meta.url), "utf8");
  assert.match(src, /title: "FLOOR desk"/);
  assert.match(src, /kind: "digital"/);
  assert.match(src, /checkout: DESK_CHECKOUT/);
  assert.match(src, /checkout_url: DESK_CHECKOUT/);
  assert.match(src, /0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10/);
  assert.match(src, /D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL/);
  assert.match(src, /49000000/);
  assert.match(src, /USDC\.base\.asset/);
  assert.match(src, /USDC\.solana\.asset/);
  const site = readFileSync(new URL("./site.ts", import.meta.url), "utf8");
  assert.match(site, /whop\.com\/checkout\/plan_j7hRIj9BQowga/);
  const payment = readFileSync(new URL("./payment.ts", import.meta.url), "utf8");
  assert.match(payment, /0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/);
  assert.match(payment, /EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/);
  assert.doesNotMatch(src, /gmv/i);
  assert.doesNotMatch(src, /FLOORQA/);
  assert.doesNotMatch(src, /PRIVATE_KEY|sk_live|seed phrase/i);
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
