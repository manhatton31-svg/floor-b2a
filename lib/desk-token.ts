import { createHash } from "node:crypto";
import { dataFile, readJsonFile } from "./data-file.ts";

type TokenRow = { hash: string; at: string; item_id: string };

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

/** Mint only after a rail actually confirms payment. This site cannot verify Whop or x402, so nothing calls this. */
export function issueDeskToken(item_id: string): string {
  throw new Error(`desk_token is not minted without a verified settle (${item_id})`);
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
