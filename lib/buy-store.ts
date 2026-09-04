import { randomBytes } from "node:crypto";
import { dataFile, readJsonFile, writeJsonFile } from "./data-file.ts";

export type BuyReceipt = {
  receipt_id: string;
  item_id: string;
  quantity: number;
  settled: boolean;
  payer: string;
  idempotency_key: string;
  at: string;
  desk_token?: string;
  pay?: { method: "checkout"; url: string };
  proof_hash?: string;
};

function storePath(): string {
  return dataFile(process.env.FLOOR_BUYS_FILE || "buys.json", "floor-buys.json");
}

function readReceipts(): BuyReceipt[] {
  const parsed = readJsonFile<unknown>(storePath(), []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (row): row is BuyReceipt =>
      !!row && typeof row === "object" && typeof (row as BuyReceipt).receipt_id === "string",
  );
}

export function findBuy(item_id: string, payer: string, idempotency_key: string): BuyReceipt | undefined {
  if (!idempotency_key) return undefined;
  return readReceipts().find(
    (row) =>
      row.item_id === item_id && row.payer === payer && row.idempotency_key === idempotency_key,
  );
}

export function addReceipt(input: Omit<BuyReceipt, "receipt_id" | "at">): BuyReceipt {
  const receipt: BuyReceipt = {
    ...input,
    receipt_id: `rcpt_${randomBytes(12).toString("hex")}`,
    at: new Date().toISOString(),
  };
  const rows = readReceipts();
  rows.push(receipt);
  writeJsonFile(storePath(), rows.slice(-500));
  return receipt;
}

export function publicReceipt(row: BuyReceipt) {
  return {
    receipt_id: row.receipt_id,
    item_id: row.item_id,
    quantity: row.quantity,
    settled: row.settled,
    ...(row.desk_token ? { desk_token: row.desk_token } : {}),
    ...(row.pay ? { pay: row.pay } : {}),
  };
}
