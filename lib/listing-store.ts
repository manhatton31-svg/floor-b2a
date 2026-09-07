import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogItem } from "./catalog";

/** House desk lives in catalog.ts. Never persist it as a seller row. */
const HOUSE_SKUS = new Set(["floor-desk"]);
const DEFAULT_BLOB_PATH = "floor-listings.json";

type IdempotencyRow = { key: string; sku: string };

type ListingDocument = {
  items: CatalogItem[];
  idempotency: IdempotencyRow[];
};

export type ListingStoreKind = "blob" | "file" | "ephemeral";

function blobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim();
}

export function listingStoreKind(): ListingStoreKind {
  if (blobToken()) return "blob";
  if (process.env.VERCEL) return "ephemeral";
  return "file";
}

function blobPathname(): string {
  const name = (process.env.FLOOR_LISTINGS_BLOB || DEFAULT_BLOB_PATH).trim();
  return /^[A-Za-z0-9._/-]+$/.test(name) ? name.replace(/^\/+/, "") : DEFAULT_BLOB_PATH;
}

function filePath(): string {
  if (process.env.VERCEL) return join("/tmp", "floor-listings.json");
  const name = process.env.FLOOR_LISTINGS_FILE || "listings.json";
  const safe = /^[A-Za-z0-9._-]+$/.test(name) ? name : "listings.json";
  return join(process.cwd(), "data", safe);
}

function emptyDoc(): ListingDocument {
  return { items: [], idempotency: [] };
}

function asItem(row: unknown): CatalogItem | null {
  if (!row || typeof row !== "object") return null;
  const sku = (row as CatalogItem).sku;
  if (typeof sku !== "string" || !sku || HOUSE_SKUS.has(sku)) return null;
  return row as CatalogItem;
}

function asIdempotency(row: unknown): IdempotencyRow | null {
  if (!row || typeof row !== "object") return null;
  const rec = row as IdempotencyRow;
  if (typeof rec.key !== "string" || typeof rec.sku !== "string") return null;
  if (!rec.key || !rec.sku) return null;
  return { key: rec.key, sku: rec.sku };
}

/** Accept the live document or a leftover bare array from the old /tmp file. */
export function parseListingDocument(raw: unknown): ListingDocument {
  if (Array.isArray(raw)) {
    return {
      items: raw.map(asItem).filter((row): row is CatalogItem => !!row),
      idempotency: [],
    };
  }
  if (!raw || typeof raw !== "object") return emptyDoc();
  const rec = raw as { items?: unknown; idempotency?: unknown };
  const items = Array.isArray(rec.items)
    ? rec.items.map(asItem).filter((row): row is CatalogItem => !!row)
    : [];
  const idempotency = Array.isArray(rec.idempotency)
    ? rec.idempotency.map(asIdempotency).filter((row): row is IdempotencyRow => !!row)
    : [];
  return { items, idempotency };
}

async function readDoc(): Promise<ListingDocument> {
  if (blobToken()) return readBlobDoc();
  return readFileDoc();
}

async function writeDoc(doc: ListingDocument): Promise<void> {
  if (blobToken()) {
    await writeBlobDoc(doc);
    return;
  }
  writeFileDoc(doc);
}

function readFileDoc(): ListingDocument {
  const path = filePath();
  try {
    if (!existsSync(path)) return emptyDoc();
    return parseListingDocument(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return emptyDoc();
  }
}

function writeFileDoc(doc: ListingDocument) {
  const path = filePath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
  } catch {
    // The public list stays empty if the file cannot be written.
  }
}

async function readBlobDoc(): Promise<ListingDocument> {
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPathname(), { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return emptyDoc();
    const text = await new Response(result.stream).text();
    if (!text.trim()) return emptyDoc();
    return parseListingDocument(JSON.parse(text));
  } catch {
    return emptyDoc();
  }
}

async function writeBlobDoc(doc: ListingDocument) {
  const { put } = await import("@vercel/blob");
  await put(blobPathname(), `${JSON.stringify(doc, null, 2)}\n`, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
    token: blobToken(),
  });
}

export async function listListings(): Promise<CatalogItem[]> {
  return (await readDoc()).items;
}

export async function listingIds(): Promise<string[]> {
  return (await listListings()).map((item) => item.sku);
}

export async function addListing(
  item: CatalogItem,
  extra?: { idempotencyKey?: string },
): Promise<CatalogItem> {
  if (HOUSE_SKUS.has(item.sku)) return item;
  const doc = await readDoc();
  if (!doc.items.some((row) => row.sku === item.sku)) {
    doc.items.push(item);
  }
  const key = extra?.idempotencyKey?.trim();
  if (key) {
    doc.idempotency = doc.idempotency.filter((row) => row.key !== key);
    doc.idempotency.push({ key, sku: item.sku });
    doc.idempotency = doc.idempotency.slice(-500);
  }
  await writeDoc(doc);
  return item;
}

export async function findListing(sku: string): Promise<CatalogItem | undefined> {
  return (await readDoc()).items.find((item) => item.sku === sku);
}

export async function listingByIdempotencyKey(key: string): Promise<CatalogItem | undefined> {
  const trimmed = key.trim();
  if (!trimmed) return undefined;
  const doc = await readDoc();
  const match = doc.idempotency.find((row) => row.key === trimmed);
  return match ? doc.items.find((item) => item.sku === match.sku) : undefined;
}

export async function rememberListingIdempotency(key: string, sku: string) {
  const trimmed = key.trim();
  if (!trimmed) return;
  const doc = await readDoc();
  doc.idempotency = doc.idempotency.filter((row) => row.key !== trimmed);
  doc.idempotency.push({ key: trimmed, sku });
  doc.idempotency = doc.idempotency.slice(-500);
  await writeDoc(doc);
}
