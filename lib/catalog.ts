import { listListings } from "./listing-store";
import { PROTOCOL } from "./site";

export type CatalogSpec = {
  name: string;
  value: string;
};

export type CatalogItem = {
  sku: string;
  title: string;
  owner: {
    type: "house" | "desk";
    name: string;
  };
  specs: CatalogSpec[];
  inventory: number;
  lead_time: string;
  return_days: number;
  warranty: string;
  ships_from: string;
  sla_hours: number;
};

export type CatalogResponse = {
  protocol: typeof PROTOCOL;
  generated_at: string;
  items: CatalogItem[];
  settlement: "not_settled";
};

/** FLOOR’s own product list. Empty is honest. Do not invent products or sales. */
export const HOUSE_ITEMS: CatalogItem[] = [];

export function buildCatalog(now = new Date()): CatalogResponse {
  return {
    protocol: PROTOCOL,
    generated_at: now.toISOString(),
    items: [...HOUSE_ITEMS, ...listListings()],
    settlement: "not_settled",
  };
}
