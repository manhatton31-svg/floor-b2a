import { createHmac, timingSafeEqual } from "node:crypto";
import { findEntitlement } from "./desk-token.ts";
import { DESK_PLAN_ID, DESK_PRODUCT_ID } from "./site.ts";

export const WHOP_API = "https://api.whop.com/api/v1";
export const WHOP_API_VERSION = "2026-08-14";

export const WHOP_GRANT_EVENTS = new Set([
  "payment.succeeded",
  "membership.activated",
  "membership.went_valid",
]);

const ACTIVE_MEMBERSHIP = new Set(["active", "completed", "trialing", "canceling"]);
const PAID_PAYMENT = new Set(["paid"]);
const PAID_SUBSTATUS = new Set(["succeeded"]);

export type WhopIds = {
  payment_id?: string;
  membership_id?: string;
  receipt_id?: string;
  code?: string;
};

export type WhopGrant = {
  ok: true;
  membership_id?: string;
  payment_id?: string;
  plan_id?: string;
  product_id?: string;
  amount: number;
  cash: boolean;
  settled: boolean;
  status: string;
};

export type WhopFail = { ok: false; reason: string; field?: string };

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nestedId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const rec = asRecord(value);
  return rec ? asText(rec.id) : "";
}

function asAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  }
  return 0;
}

export function whopApiKey(): string {
  return (process.env.WHOP_API_KEY || "").trim();
}

export function whopWebhookSecret(): string {
  return (process.env.WHOP_WEBHOOK_SECRET || "").trim();
}

export function isDeskPlan(planId: string, productId: string): boolean {
  return planId === DESK_PLAN_ID || productId === DESK_PRODUCT_ID;
}

export function idsFromUnknown(input: unknown): WhopIds {
  const rec = asRecord(input) ?? {};
  return {
    payment_id: asText(rec.payment_id || rec.paymentId),
    membership_id: asText(rec.membership_id || rec.membershipId),
    receipt_id: asText(rec.receipt_id || rec.receiptId),
    code: asText(rec.code || rec.license_key || rec.licenseKey),
  };
}

export function classifyId(raw: string): "payment" | "membership" | "receipt" | "unknown" {
  const id = raw.trim();
  if (id.startsWith("pay_")) return "payment";
  if (id.startsWith("mem_")) return "membership";
  if (id.startsWith("rcpt_")) return "receipt";
  return "unknown";
}

export function hmacKeys(secret: string): Buffer[] {
  const keys = [Buffer.from(secret, "utf8")];
  if (secret.startsWith("ws_")) {
    keys.push(Buffer.from(secret.slice(3), "utf8"));
    try {
      keys.push(Buffer.from(secret.slice(3), "base64"));
    } catch {
      // ignore
    }
  }
  if (secret.startsWith("whsec_")) {
    try {
      keys.push(Buffer.from(secret.slice(6), "base64"));
    } catch {
      // ignore
    }
  }
  return keys;
}

export function signWhopWebhook(secret: string, id: string, timestamp: string, body: string): string {
  const signed = `${id}.${timestamp}.${body}`;
  const digest = createHmac("sha256", hmacKeys(secret)[0]).update(signed).digest("base64");
  return `v1,${digest}`;
}

export function verifyWhopSignature(input: {
  secret: string;
  id: string;
  timestamp: string;
  signature: string;
  body: string;
  now?: number;
}): { ok: true } | { ok: false; reason: string } {
  const { secret, id, timestamp, signature, body } = input;
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "Missing webhook-id, webhook-timestamp, or webhook-signature." };
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "webhook-timestamp is not a unix time." };
  }
  const now = input.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    return { ok: false, reason: "webhook-timestamp is too old or too far in the future." };
  }

  const signed = `${id}.${timestamp}.${body}`;
  const offered = signature
    .split(/[\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .map((part) => part.slice(3));
  if (!offered.length) {
    return { ok: false, reason: "webhook-signature is not a v1 signature." };
  }

  for (const key of hmacKeys(secret)) {
    const expected = createHmac("sha256", key).update(signed).digest("base64");
    for (const got of offered) {
      const a = Buffer.from(expected);
      const b = Buffer.from(got);
      if (a.length === b.length && timingSafeEqual(a, b)) return { ok: true };
    }
  }
  return { ok: false, reason: "Webhook signature did not match." };
}

function grantFromMembership(row: Record<string, unknown>): WhopGrant | WhopFail {
  const plan_id = nestedId(row.plan) || asText(row.plan_id);
  const product_id = nestedId(row.product) || asText(row.product_id);
  if (!isDeskPlan(plan_id, product_id)) {
    return { ok: false, reason: "That membership is not the FLOOR desk plan.", field: "membership_id" };
  }
  const status = asText(row.status).toLowerCase();
  if (!ACTIVE_MEMBERSHIP.has(status)) {
    return {
      ok: false,
      reason: "That desk membership is not active. Pay first, then come back.",
      field: "membership_id",
    };
  }
  const amount = asAmount(row.initial_price_paid ?? row.formatted_renewal_price);
  return {
    ok: true,
    membership_id: asText(row.id),
    plan_id,
    product_id,
    amount,
    cash: amount > 0,
    settled: amount > 0,
    status,
  };
}

function grantFromPayment(row: Record<string, unknown>): WhopGrant | WhopFail {
  const plan_id = nestedId(row.plan) || asText(row.plan_id);
  const product_id = nestedId(row.product) || asText(row.product_id);
  if (!isDeskPlan(plan_id, product_id)) {
    return { ok: false, reason: "That payment is not the FLOOR desk plan.", field: "payment_id" };
  }
  const status = asText(row.status).toLowerCase();
  const substatus = asText(row.substatus).toLowerCase();
  const paid = PAID_PAYMENT.has(status) || PAID_SUBSTATUS.has(substatus);
  if (!paid) {
    return { ok: false, reason: "That payment is not paid yet. Pay first, then come back.", field: "payment_id" };
  }
  const amount = asAmount(row.usd_total ?? row.total ?? row.settlement_amount ?? row.subtotal);
  return {
    ok: true,
    payment_id: asText(row.id),
    membership_id: nestedId(row.membership) || asText(row.membership_id),
    plan_id,
    product_id,
    amount,
    cash: amount > 0,
    settled: amount > 0,
    status: substatus || status,
  };
}

export function grantFromWhopObject(kind: "payment" | "membership", row: unknown): WhopGrant | WhopFail {
  const rec = asRecord(row);
  if (!rec || !asText(rec.id)) {
    return { ok: false, reason: "Whop did not return that record." };
  }
  return kind === "payment" ? grantFromPayment(rec) : grantFromMembership(rec);
}

export function idsFromWebhookData(type: string, data: unknown): WhopIds {
  const rec = asRecord(data) ?? {};
  const id = asText(rec.id);
  const payment_id =
    (type.startsWith("payment.") && id.startsWith("pay_") ? id : "") ||
    nestedId(rec.payment) ||
    asText(rec.payment_id);
  const membership_id =
    (type.startsWith("membership.") && id.startsWith("mem_") ? id : "") ||
    nestedId(rec.membership) ||
    asText(rec.membership_id);
  return { payment_id, membership_id };
}

export function grantFromWebhookEvent(
  event: unknown,
): WhopGrant | WhopFail | { ok: false; ignore: true; reason: string } {
  const rec = asRecord(event);
  if (!rec) return { ok: false, ignore: true, reason: "Empty webhook." };
  const type = asText(rec.type);
  if (!WHOP_GRANT_EVENTS.has(type)) {
    return { ok: false, ignore: true, reason: `Ignored ${type || "event"}.` };
  }
  const data = rec.data ?? rec;
  const result = type.startsWith("payment.")
    ? grantFromWhopObject("payment", data)
    : grantFromWhopObject("membership", data);
  if (result.ok) {
    const ids = idsFromWebhookData(type, data);
    if (!result.payment_id && ids.payment_id) result.payment_id = ids.payment_id;
    if (!result.membership_id && ids.membership_id) result.membership_id = ids.membership_id;
  }
  return result;
}

function payloadHasDeskIds(data: unknown): boolean {
  const rec = asRecord(data);
  if (!rec) return false;
  const plan = nestedId(rec.plan) || asText(rec.plan_id);
  const product = nestedId(rec.product) || asText(rec.product_id);
  return Boolean(plan || product);
}

/** Prefer the signed payload. If plan/product are missing, confirm via the Whop API. */
export async function resolveWebhookGrant(
  event: unknown,
): Promise<WhopGrant | WhopFail | { ok: false; ignore: true; reason: string }> {
  const parsed = grantFromWebhookEvent(event);
  if (parsed.ok || ("ignore" in parsed && parsed.ignore)) return parsed;
  const rec = asRecord(event);
  const type = asText(rec?.type);
  const data = rec?.data ?? rec;
  if (payloadHasDeskIds(data)) return parsed;
  const ids = idsFromWebhookData(type, data);
  if (!ids.payment_id && !ids.membership_id) return parsed;
  if (!whopApiKey()) return parsed;
  return verifyDeskPurchase(ids);
}

export async function whopGet(path: string): Promise<{ ok: true; data: unknown } | { ok: false; reason: string }> {
  const key = whopApiKey();
  if (!key) {
    return { ok: false, reason: "WHOP_API_KEY is not set. This site cannot confirm a Whop membership." };
  }
  try {
    const res = await fetch(`${WHOP_API}${path}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Api-Version-Date": WHOP_API_VERSION,
      },
      cache: "no-store",
    });
    if (res.status === 404) {
      return { ok: false, reason: "Whop does not have that payment or membership." };
    }
    if (!res.ok) {
      return { ok: false, reason: `Whop API returned ${res.status}.` };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, reason: "Could not reach Whop." };
  }
}

export function grantFromStoredEntitlement(ids: WhopIds): WhopGrant | null {
  const stored = findEntitlement(ids);
  if (!stored || !isDeskPlan(stored.plan, stored.product_id || "")) return null;
  return {
    ok: true,
    payment_id: stored.payment_id,
    membership_id: stored.membership_id,
    plan_id: stored.plan,
    product_id: stored.product_id,
    amount: stored.amount,
    cash: stored.cash,
    settled: stored.settled,
    status: "recorded",
  };
}

/** Webhook entitlement first. Whop API is the optional fast path when the id is present but no row yet. */
export async function resolveDeskGrant(ids: WhopIds): Promise<WhopGrant | WhopFail> {
  const receipt = ids.receipt_id || "";
  if (classifyId(receipt) === "receipt") {
    return {
      ok: false,
      reason: "That receipt_id is an unpaid buy intent, not a Whop payment. Pay the desk checkout first.",
      field: "receipt_id",
    };
  }
  const stored = grantFromStoredEntitlement(ids);
  if (stored) return stored;
  return verifyDeskPurchase(ids);
}

export async function verifyDeskPurchase(ids: WhopIds): Promise<WhopGrant | WhopFail> {
  const payment_id = ids.payment_id || (classifyId(ids.receipt_id || "") === "payment" ? ids.receipt_id : "");
  const membership_id = ids.membership_id || (classifyId(ids.receipt_id || "") === "membership" ? ids.receipt_id : "");
  const receipt = ids.receipt_id || "";
  const code = ids.code || "";

  if (classifyId(receipt) === "receipt") {
    return {
      ok: false,
      reason: "That receipt_id is an unpaid buy intent, not a Whop payment. Pay the desk checkout first.",
      field: "receipt_id",
    };
  }

  if (payment_id) {
    const got = await whopGet(`/payments/${encodeURIComponent(payment_id)}`);
    if (!got.ok) return { ok: false, reason: got.reason, field: "payment_id" };
    return grantFromWhopObject("payment", got.data);
  }

  if (membership_id) {
    const got = await whopGet(`/memberships/${encodeURIComponent(membership_id)}`);
    if (!got.ok) return { ok: false, reason: got.reason, field: "membership_id" };
    return grantFromWhopObject("membership", got.data);
  }

  if (code) {
    const kind = classifyId(code);
    if (kind === "payment") {
      const got = await whopGet(`/payments/${encodeURIComponent(code)}`);
      if (!got.ok) return { ok: false, reason: got.reason, field: "code" };
      return grantFromWhopObject("payment", got.data);
    }
    const got = await whopGet(`/memberships/${encodeURIComponent(code)}`);
    if (!got.ok) return { ok: false, reason: got.reason, field: "code" };
    return grantFromWhopObject("membership", got.data);
  }

  return {
    ok: false,
    reason: "Send a Whop payment_id or membership_id. This page does not mint on honor.",
    field: "payment_id",
  };
}
