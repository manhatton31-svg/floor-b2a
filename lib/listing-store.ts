import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogItem } from "./catalog";

const memory: CatalogItem[] = [];
let loadedPath = "";

function storePath(): string {
  if (process.env.FLOOR_LISTINGS_PATH) return process.env.FLOOR_LISTINGS_PATH;
  if (process.env.VERCEL) return "/tmp/floor-listings.json";
  return join(process.cwd(), "data", "listings.json");
}

function load(): CatalogItem[] {
  const path = storePath();
  if (loadedPath === path) return memory;
  memory.length = 0;
  loadedPath = path;
  try {
    if (!existsSync(path)) return memory;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return memory;
    for (const row of parsed) {
      if (row && typeof row === "object" && typeof (row as CatalogItem).sku === "string") {
        memory.push(row as CatalogItem);
      }
    }
  } catch {
    // Empty list is honest if the file is missing or unreadable.
  }
  return memory;
}

function persist() {
  const path = storePath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(memory, null, 2)}\n`);
  } catch {
    // Memory still holds the list for this process.
  }
}

export function listListings(): CatalogItem[] {
  return load().slice();
}

export function listingIds(): string[] {
  return load().map((item) => item.sku);
}

export function addListing(item: CatalogItem): CatalogItem {
  load();
  memory.push(item);
  persist();
  return item;
}
