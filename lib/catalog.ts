import { PROTOCOL } from "./site";

export type CatalogSpec = {
  name: string;
  value: string;
};

export type CatalogItem = {
  sku: string;
  title: string;
  owner: {
    type: "house";
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
};

/**
 * House catalog is empty until FLOOR lists real, fully specified house SKUs.
 * Do not invent fill counts, GMV, or agent purchases. Agent fills do not settle money.
 */
export const HOUSE_ITEMS: CatalogItem[] = [];

export function buildCatalog(now = new Date()): CatalogResponse {
  return {
    protocol: PROTOCOL,
    generated_at: now.toISOString(),
    items: HOUSE_ITEMS,
  };
}
