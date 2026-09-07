import assert from "node:assert/strict";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { findEntitlement, recordEntitlement } from "./desk-token.ts";
import { handleWhopWebhook } from "./whop-webhook.ts";
import { DESK_PLAN_ID, DESK_PRODUCT_ID } from "./site.ts";
import { resolveDeskGrant, signWhopWebhook } from "./whop.ts";

const SECRET = "ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const saved = {
  tokens: process.env.FLOOR_TOKENS_FILE,
  webhook: process.env.WHOP_WEBHOOK_SECRET,
  api: process.env.WHOP_API_KEY,
};

function isolateStore(): string {
  const file = `desk-tokens-hook-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
  process.env.FLOOR_TOKENS_FILE = file;
  return file;
}

function cleanup(file: string) {
  try {
    unlinkSync(join(process.cwd(), "data", file));
  } catch {
    // ignore
  }
}

function restoreEnv() {
  if (saved.tokens === undefined) delete process.env.FLOOR_TOKENS_FILE;
  else process.env.FLOOR_TOKENS_FILE = saved.tokens;
  if (saved.webhook === undefined) delete process.env.WHOP_WEBHOOK_SECRET;
  else process.env.WHOP_WEBHOOK_SECRET = saved.webhook;
  if (saved.api === undefined) delete process.env.WHOP_API_KEY;
  else process.env.WHOP_API_KEY = saved.api;
}

function signedRequest(bodyObj: unknown, id = `msg_${Date.now()}`) {
  const body = JSON.stringify(bodyObj);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signWhopWebhook(SECRET, id, timestamp, body);
  return new Request("http://127.0.0.1/api/webhooks/whop", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": signature,
    },
    body,
  });
}

test("webhook without secret is 503 and does not record", async () => {
  const file = isolateStore();
  delete process.env.WHOP_WEBHOOK_SECRET;
  delete process.env.WHOP_API_KEY;
  try {
    const res = await handleWhopWebhook(
      new Request("http://127.0.0.1/api/webhooks/whop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "payment.succeeded",
          data: { id: "pay_nosecret", status: "paid", plan: { id: DESK_PLAN_ID }, usd_total: 49 },
        }),
      }),
    );
    assert.equal(res.status, 503);
    assert.match(await res.text(), /WHOP_WEBHOOK_SECRET/);
    assert.equal(findEntitlement({ payment_id: "pay_nosecret" }), null);
  } finally {
    cleanup(file);
    restoreEnv();
  }
});

test("unsigned webhook body is 401 and does not record entitlement", async () => {
  const file = isolateStore();
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  delete process.env.WHOP_API_KEY;
  try {
    const res = await handleWhopWebhook(
      new Request("http://127.0.0.1/api/webhooks/whop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "webhook-id": "msg_unsigned",
          "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "webhook-signature": "v1,nope",
        },
        body: JSON.stringify({
          type: "payment.succeeded",
          data: { id: "pay_forged", status: "paid", plan: { id: DESK_PLAN_ID }, usd_total: 49 },
        }),
      }),
    );
    assert.equal(res.status, 401);
    assert.match(await res.text(), /signature|Webhook/i);
    assert.equal(findEntitlement({ payment_id: "pay_forged" }), null);
  } finally {
    cleanup(file);
    restoreEnv();
  }
});

test("signed payment.succeeded records entitlement for later mint", async () => {
  const file = isolateStore();
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  delete process.env.WHOP_API_KEY;
  try {
    const res = await handleWhopWebhook(
      signedRequest(
        {
          type: "payment.succeeded",
          data: {
            id: "pay_ok",
            status: "paid",
            plan: { id: DESK_PLAN_ID },
            product: { id: DESK_PRODUCT_ID },
            usd_total: 49,
            membership: "mem_ok",
          },
        },
        "msg_ok",
      ),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      recorded: boolean;
      payment_id?: string;
      membership_id?: string;
      plan?: string;
      cash?: boolean;
    };
    assert.equal(body.ok, true);
    assert.equal(body.recorded, true);
    assert.equal(body.payment_id, "pay_ok");
    assert.equal(body.membership_id, "mem_ok");
    assert.equal(body.plan, DESK_PLAN_ID);
    assert.equal(body.cash, true);

    const row = findEntitlement({ payment_id: "pay_ok" });
    assert.ok(row);
    assert.equal(row.membership_id, "mem_ok");
    assert.equal(row.plan, DESK_PLAN_ID);
    assert.equal(row.cash, true);

    const grant = await resolveDeskGrant({ payment_id: "pay_ok" });
    assert.equal(grant.ok, true);
    if (grant.ok) {
      assert.equal(grant.plan_id, DESK_PLAN_ID);
      assert.equal(grant.membership_id, "mem_ok");
    }
  } finally {
    cleanup(file);
    restoreEnv();
  }
});

test("signed membership.activated records entitlement", async () => {
  const file = isolateStore();
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  delete process.env.WHOP_API_KEY;
  try {
    const res = await handleWhopWebhook(
      signedRequest(
        {
          type: "membership.activated",
          data: { id: "mem_active", status: "active", plan: DESK_PLAN_ID },
        },
        "msg_mem",
      ),
    );
    assert.equal(res.status, 200);
    const row = findEntitlement({ membership_id: "mem_active" });
    assert.ok(row);
    assert.equal(row.plan, DESK_PLAN_ID);
  } finally {
    cleanup(file);
    restoreEnv();
  }
});

test("signed webhook for another plan is ignored", async () => {
  const file = isolateStore();
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  delete process.env.WHOP_API_KEY;
  try {
    const res = await handleWhopWebhook(
      signedRequest(
        {
          type: "payment.succeeded",
          data: { id: "pay_other", status: "paid", plan: { id: "plan_other" }, usd_total: 49 },
        },
        "msg_other",
      ),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ignored?: boolean };
    assert.equal(body.ignored, true);
    assert.equal(findEntitlement({ payment_id: "pay_other" }), null);
  } finally {
    cleanup(file);
    restoreEnv();
  }
});

test("recordEntitlement upserts payment and membership on the same row", () => {
  const file = isolateStore();
  try {
    const first = recordEntitlement({
      payment_id: "pay_merge",
      plan_id: DESK_PLAN_ID,
      cash: true,
      settled: true,
      amount: 49,
    });
    const second = recordEntitlement({
      payment_id: "pay_merge",
      membership_id: "mem_merge",
      plan_id: DESK_PLAN_ID,
      cash: true,
      settled: true,
      amount: 49,
    });
    assert.ok(first);
    assert.ok(second);
    assert.equal(second.payment_id, "pay_merge");
    assert.equal(second.membership_id, "mem_merge");
    assert.equal(findEntitlement({ membership_id: "mem_merge" })?.payment_id, "pay_merge");
  } finally {
    cleanup(file);
    restoreEnv();
  }
});
