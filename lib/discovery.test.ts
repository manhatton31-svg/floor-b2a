import assert from "node:assert/strict";
import test from "node:test";
import { DIRECTORY_SUBMISSIONS } from "./directories.ts";
import { agentDiscovery, x402Discovery } from "./discovery.ts";
import { HOUSE_DESK_PAYTO } from "./catalog.ts";
import { USDC } from "./payment.ts";

const ORIGIN = "https://floor-desk-ecru.vercel.app";

test("x402 discovery lists the house desk on both rails and does not claim settle", () => {
  const doc = x402Discovery(ORIGIN);
  assert.equal(doc.x402Version, 2);
  assert.equal(doc.kind, "resource-server");
  assert.equal(doc.settlement, "not_settled");
  assert.equal(doc.checkout, "https://whop.com/checkout/plan_j7hRIj9BQowga");
  assert.equal(doc.supplier, "FLOOR");
  assert.equal(doc.processor, "Whop");
  assert.equal(doc.desk.price, "$49 once for 12 months");
  assert.equal(doc.desk.subscription, false);
  assert.equal("facilitator" in doc, false);
  assert.doesNotMatch(JSON.stringify(doc), /bazaar|gmv|\/settle/i);

  assert.equal(doc.resources.length, 2);
  const pay = doc.resources.find((row) => row.method === "GET");
  const buy = doc.resources.find((row) => row.method === "POST");
  assert.equal(pay?.url, `${ORIGIN}/pay/floor-desk`);
  assert.equal(buy?.url, `${ORIGIN}/api/buy`);
  assert.deepEqual(buy?.body, { item_id: "floor-desk" });
  assert.equal(pay?.checkout_url, doc.checkout);
  assert.equal(buy?.checkout_url, doc.checkout);

  for (const row of doc.resources) {
    assert.equal(row.price, "49");
    assert.equal(row.item_id, "floor-desk");
    assert.equal(row.accepts.length, 2);
    const base = row.accepts.find((accept) => accept.network === "base");
    const sol = row.accepts.find((accept) => accept.network === "solana");
    assert.equal(base?.payTo, HOUSE_DESK_PAYTO.base);
    assert.equal(base?.asset, USDC.base.asset);
    assert.equal(base?.maxAmountRequired, "49000000");
    assert.equal(sol?.payTo, HOUSE_DESK_PAYTO.solana);
    assert.equal(sol?.asset, USDC.solana.asset);
    assert.equal(sol?.maxAmountRequired, "49000000");
  }
});

test("agent.json and directory tape point at the live x402 and llmstxt.info rows", () => {
  const agent = agentDiscovery(ORIGIN);
  assert.equal(agent.x402, `${ORIGIN}/.well-known/x402`);
  assert.equal(agent.settlement, "not_settled");

  assert.equal(DIRECTORY_SUBMISSIONS.length, 4);
  assert.equal(DIRECTORY_SUBMISSIONS[0].name, "Grok Agent Store");
  assert.equal(DIRECTORY_SUBMISSIONS[1].name, "LLMS Central");
  assert.equal(DIRECTORY_SUBMISSIONS[2].name, "Zearches Software & SaaS Tools");
  assert.deepEqual(DIRECTORY_SUBMISSIONS[3], {
    name: "llmstxt.info",
    url: "https://llmstxt.info/directory/?search=floor",
    note: "Live free listing · host floor-desk-ecru.vercel.app · submitted https://floor-desk-ecru.vercel.app/llms.txt · 2026-09-03",
  });
  assert.equal(
    DIRECTORY_SUBMISSIONS.some((row) => /meshkore/i.test(JSON.stringify(row))),
    false,
  );
});
