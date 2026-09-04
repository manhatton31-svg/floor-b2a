import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { dataFile, readJsonFile, writeJsonFile } from "./data-file.ts";
import { DESK_TOKEN_COOKIE, tokenFromCookie } from "./desk-ack.ts";

type TokenRow = {
  hash: string;
  at: string;
  item_id: string;
  test?: boolean;
  membership_id?: string;
  payment_id?: string;
  cash?: boolean;
  settled?: boolean;
};

type TokenStore = {
  tokens: TokenRow[];
  memberships: Record<string, string>;
  payments: Record<string, string>;
  webhooks: string[];
};

export type VerifiedGrant = {
  membership_id?: string;
  payment_id?: string;
  cash: boolean;
  settled: boolean;
  item_id?: string;
};

export type VerifiedMint = {
  token: string;
  reused: boolean;
  membership_id?: string;
  payment_id?: string;
  cash: boolean;
  settled: boolean;
};

function storePath(): string {
  return dataFile(process.env.FLOOR_TOKENS_FILE || "desk-tokens.json", "floor-desk-tokens.json");
}

function emptyStore(): TokenStore {
  return { tokens: [], memberships: {}, payments: {}, webhooks: [] };
}

function readStore(): TokenStore {
  const parsed = readJsonFile<unknown>(storePath(), emptyStore());
  if (Array.isArray(parsed)) {
    return { tokens: parsed.filter(isTokenRow), memberships: {}, payments: {}, webhooks: [] };
  }
  if (!parsed || typeof parsed !== "object") return emptyStore();
  const rec = parsed as Partial<TokenStore>;
  return {
    tokens: Array.isArray(rec.tokens) ? rec.tokens.filter(isTokenRow) : [],
    memberships: asStringMap(rec.memberships),
    payments: asStringMap(rec.payments),
    webhooks: Array.isArray(rec.webhooks) ? rec.webhooks.filter((id): id is string => typeof id === "string") : [],
  };
}

function isTokenRow(row: unknown): row is TokenRow {
  return (
    !!row &&
    typeof row === "object" &&
    typeof (row as TokenRow).hash === "string" &&
    typeof (row as TokenRow).item_id === "string"
  );
}

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string" && raw.startsWith("desk_")) out[key] = raw;
  }
  return out;
}

function writeStore(store: TokenStore) {
  writeJsonFile(storePath(), {
    tokens: store.tokens.slice(-500),
    memberships: store.memberships,
    payments: store.payments,
    webhooks: store.webhooks.slice(-200),
  });
}

function readRows(): TokenRow[] {
  return readStore().tokens;
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Not a public mint. Call mintVerifiedDeskToken after Whop confirm, or mintTestDeskToken for QA. */
export function issueDeskToken(item_id: string): string {
  throw new Error(`desk_token is not minted without a verified settle (${item_id})`);
}

/**
 * QA only. Callers must have already matched FLOOR_TEST_DESK_SECRET.
 * This is not a Whop membership check and must not be treated as a sale.
 */
export function mintTestDeskToken(item_id = "floor-desk"): string {
  const token = `desk_${randomBytes(24).toString("base64url")}`;
  const store = readStore();
  store.tokens.push({ hash: hashSecret(token), at: new Date().toISOString(), item_id, test: true });
  writeStore(store);
  return token;
}

/** Mint or reuse a desk_token after Whop verify. Same membership_id / payment_id returns the same token. */
export function mintVerifiedDeskToken(grant: VerifiedGrant): VerifiedMint {
  const store = readStore();
  const membership_id = grant.membership_id?.trim() || undefined;
  const payment_id = grant.payment_id?.trim() || undefined;
  const existing =
    (membership_id && store.memberships[membership_id]) ||
    (payment_id && store.payments[payment_id]) ||
    "";
  if (existing.startsWith("desk_") && store.tokens.some((row) => row.hash === hashSecret(existing))) {
    if (membership_id) store.memberships[membership_id] = existing;
    if (payment_id) store.payments[payment_id] = existing;
    writeStore(store);
    return {
      token: existing,
      reused: true,
      membership_id,
      payment_id,
      cash: grant.cash,
      settled: grant.settled,
    };
  }

  const token = `desk_${randomBytes(24).toString("base64url")}`;
  store.tokens.push({
    hash: hashSecret(token),
    at: new Date().toISOString(),
    item_id: grant.item_id || "floor-desk",
    membership_id,
    payment_id,
    cash: grant.cash,
    settled: grant.settled,
  });
  if (membership_id) store.memberships[membership_id] = token;
  if (payment_id) store.payments[payment_id] = token;
  writeStore(store);
  return {
    token,
    reused: false,
    membership_id,
    payment_id,
    cash: grant.cash,
    settled: grant.settled,
  };
}

export function seenWebhookId(id: string): boolean {
  const raw = id.trim();
  if (!raw) return false;
  return readStore().webhooks.includes(raw);
}

export function rememberWebhookId(id: string): boolean {
  const raw = id.trim();
  if (!raw) return false;
  const store = readStore();
  if (store.webhooks.includes(raw)) return true;
  store.webhooks.push(raw);
  writeStore(store);
  return false;
}

export function hasDeskToken(token: string): boolean {
  const raw = token.trim();
  if (!raw.startsWith("desk_")) return false;
  const hash = hashSecret(raw);
  return readRows().some((row) => row.hash === hash);
}

export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = header.trim().match(/^Bearer\s+(\S+)$/i);
  return match?.[1] || null;
}

export function deskTokenFromRequest(request: Request): string | null {
  const header = bearerToken(request.headers.get("authorization"));
  if (header) return header;
  return tokenFromCookie(request.headers.get("cookie"));
}

export function testDeskSecret(): string {
  return (process.env.FLOOR_TEST_DESK_SECRET || "").trim();
}

export function testDeskSecretConfigured(): boolean {
  return testDeskSecret().length >= 16;
}

export function testDeskSecretMatches(candidate: string): boolean {
  const expected = testDeskSecret();
  if (!testDeskSecretConfigured()) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export { DESK_TOKEN_COOKIE };
