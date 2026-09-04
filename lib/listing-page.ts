import type { CatalogItem } from "./catalog";

const SKU_RE = /^[A-Za-z0-9._-]{1,80}$/;

export function safeListingSku(raw: string): string | null {
  const sku = raw.trim();
  if (!SKU_RE.test(sku)) return null;
  return sku;
}

export function embedCatalogItemJson(item: CatalogItem): string {
  return JSON.stringify(item).replace(/</g, "\\u003c");
}

export function listingStockLine(item: CatalogItem): string {
  if (item.kind === "digital") {
    const stock = item.unlimited ? "unlimited" : String(item.inventory);
    return item.delivery ? `${stock} · ${item.delivery}` : stock;
  }
  const stock = `${item.inventory} in stock`;
  return item.ships_from ? `${stock} · ships from ${item.ships_from}` : stock;
}
