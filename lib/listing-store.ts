import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogItem } from "./catalog";

function storePath(): string {
  if (process.env.VERCEL) return join("/tmp", "floor-listings.json");
  const name = process.env.FLOOR_LISTINGS_FILE || "listings.json";
  const safe = /^[A-Za-z0-9._-]+$/.test(name) ? name : "listings.json";
  return join(process.cwd(), "data", safe);
}

function readListings(): CatalogItem[] {
  const path = storePath();
  try {
    if (!existsSync(path)) return [];
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CatalogItem =>
        !!row && typeof row === "object" && typeof (row as CatalogItem).sku === "string",
    );
  } catch {
    return [];
  }
}

function persist(items: CatalogItem[]) {
  const path = storePath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(items, null, 2)}\n`);
  } catch {
    // The public list stays empty if the file cannot be written.
  }
}

export function listListings(): CatalogItem[] {
  return readListings();
}

export function listingIds(): string[] {
  return readListings().map((item) => item.sku);
}

export function addListing(item: CatalogItem): CatalogItem {
  const items = readListings();
  items.push(item);
  persist(items);
  return item;
}
