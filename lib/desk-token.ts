import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { dataFile, readJsonFile, writeJsonFile } from "./data-file.ts";
import { DESK_TOKEN_COOKIE, tokenFromCookie } from "./desk-ack.ts";

type TokenRow = { hash: string; at: string; item_id: string; test?: boolean };

function storePath(): string {
  return dataFile(process.env.FLOOR_TOKENS_FILE || "desk-tokens.json", "floor-desk-tokens.json");
}

function readRows(): TokenRow[] {
  const parsed = readJsonFile<unknown>(storePath(), []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (row): row is TokenRow =>
      !!row &&
      typeof row === "object" &&
      typeof (row as TokenRow).hash === "string" &&
      typeof (row as TokenRow).item_id === "string",
  );
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Not called from product routes. This site cannot verify Whop or x402. */
export function issueDeskToken(item_id: string): string {
  throw new Error(`desk_token is not minted without a verified settle (${item_id})`);
}

/**
 * QA only. Callers must have already matched FLOOR_TEST_DESK_SECRET.
 * This is not a Whop membership check and must not be treated as a sale.
 */
export function mintTestDeskToken(item_id = "floor-desk"): string {
  const token = `desk_${randomBytes(24).toString("base64url")}`;
  const rows = readRows();
  rows.push({ hash: hashSecret(token), at: new Date().toISOString(), item_id, test: true });
  writeJsonFile(storePath(), rows.slice(-500));
  return token;
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
