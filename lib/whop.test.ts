import assert from "node:assert/strict";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { mintVerifiedDeskToken } from "./desk-token.ts";
import {
  classifyId,
  grantFromWebhookEvent,
  grantFromWhopObject,
  isDeskPlan,
  signWhopWebhook,
  verifyWhopSignature,
} from "./whop.ts";

const PLAN = "plan_j7hRIj9BQowga";
const PRODUCT = "prod_U1yrk71ovYrSx";

test("desk plan matches locked ids", () => {
  assert.equal(isDeskPlan(PLAN, ""), true);
  assert.equal(isDeskPlan("", PRODUCT), true);
  assert.equal(isDeskPlan("plan_other", "prod_other"), false);
});

test("classifyId treats rcpt_ as our unpaid buy intent", () => {
  assert.equal(classifyId("pay_abc"), "payment");
  assert.equal(classifyId("mem_abc"), "membership");
  assert.equal(classifyId("rcpt_abc"), "receipt");
});

test("paid desk payment grants cash settle", () => {
  const grant = grantFromWhopObject("payment", {
    id: "pay_1",
    status: "paid",
    substatus: "succeeded",
    usd_total: 49,
    plan: { id: PLAN },
    product: { id: PRODUCT },
    membership: { id: "mem_1" },
  });
  assert.equal(grant.ok, true);
  if (!grant.ok) return;
  assert.equal(grant.cash, true);
  assert.equal(grant.settled, true);
  assert.equal(grant.membership_id, "mem_1");
});

test("zero dollar promo membership may mint access but is not cash", () => {
  const grant = grantFromWhopObject("membership", {
    id: "mem_promo",
    status: "active",
    plan: PLAN,
    product: PRODUCT,
    initial_price_paid: "$0.00",
  });
  assert.equal(grant.ok, true);
  if (!grant.ok) return;
  assert.equal(grant.cash, false);
  assert.equal(grant.settled, false);
});

test("wrong plan does not grant", () => {
  const grant = grantFromWhopObject("payment", {
    id: "pay_2",
    status: "paid",
    plan: { id: "plan_other" },
    product: { id: "prod_other" },
    usd_total: 49,
  });
  assert.equal(grant.ok, false);
});

test("unpaid payment does not grant", () => {
  const grant = grantFromWhopObject("payment", {
    id: "pay_3",
    status: "pending",
    plan: { id: PLAN },
    usd_total: 49,
  });
  assert.equal(grant.ok, false);
});

test("webhook payment.succeeded and membership aliases grant", () => {
  const payment = grantFromWebhookEvent({
    type: "payment.succeeded",
    data: {
      id: "pay_4",
      status: "paid",
      plan: { id: PLAN },
      usd_total: 49,
      membership: "mem_4",
    },
  });
  assert.equal(payment.ok, true);

  const activated = grantFromWebhookEvent({
    type: "membership.activated",
    data: { id: "mem_5", status: "active", plan: { id: PLAN } },
  });
  assert.equal(activated.ok, true);

  const legacy = grantFromWebhookEvent({
    type: "membership.went_valid",
    data: { id: "mem_6", status: "active", product: { id: PRODUCT } },
  });
  assert.equal(legacy.ok, true);

  const ignored = grantFromWebhookEvent({ type: "payment.failed", data: { id: "pay_x" } });
  assert.equal(ignored.ok, false);
  assert.equal("ignore" in ignored && ignored.ignore, true);
});

test("webhook signature accepts the full ws_ secret", () => {
  const secret = "ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const id = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = '{"type":"payment.succeeded"}';
  const signature = signWhopWebhook(secret, id, timestamp, body);
  assert.equal(verifyWhopSignature({ secret, id, timestamp, signature, body }).ok, true);
  assert.equal(verifyWhopSignature({ secret, id, timestamp, signature: "v1,nope", body }).ok, false);
  assert.equal(
    verifyWhopSignature({ secret, id, timestamp: String(Number(timestamp) - 400), signature, body }).ok,
    false,
  );
});

test("verified mint is idempotent on membership_id and payment_id", () => {
  const file = `desk-tokens-test-${process.pid}-${Date.now()}.json`;
  process.env.FLOOR_TOKENS_FILE = file;
  const first = mintVerifiedDeskToken({
    membership_id: "mem_same",
    payment_id: "pay_same",
    cash: true,
    settled: true,
  });
  const second = mintVerifiedDeskToken({
    membership_id: "mem_same",
    payment_id: "pay_other",
    cash: true,
    settled: true,
  });
  const third = mintVerifiedDeskToken({
    membership_id: "mem_other",
    payment_id: "pay_same",
    cash: false,
    settled: false,
  });
  assert.equal(first.reused, false);
  assert.equal(second.token, first.token);
  assert.equal(second.reused, true);
  assert.equal(third.token, first.token);
  try {
    unlinkSync(join(process.cwd(), "data", file));
  } catch {
    // ignore
  }
});
