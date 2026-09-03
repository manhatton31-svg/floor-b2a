import { listListings } from "./listing-store";
import { expandPayment, USDC, type ListingPayment } from "./payment";
import { DESK_CHECKOUT, DESK_PRICE, PROTOCOL } from "./site";

/** Public receive addresses only. Never a private key. */
export const HOUSE_DESK_PAYTO = {
  base: "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10",
  solana: "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL",
} as const;

/** $49 USDC, 6 decimals. Same price as the desk. */
const HOUSE_DESK_X402_AMOUNT = "49000000";

export type CatalogSpec = {
  name: string;
  value: string;
};

export type ProductKind = "physical" | "digital";

export type CatalogItem = {
  sku: string;
  title: string;
  kind: ProductKind;
  owner: {
    type: "house" | "desk";
    name: string;
  };
  specs: CatalogSpec[];
  inventory: number;
  unlimited?: boolean;
  lead_time: string;
  return_days: number;
  warranty: string;
  payment: ListingPayment;
  checkout?: string;
  sla_hours: number;
  ships_from?: string;
  delivery?: string;
  price?: string;
  refund?: string;
};

export type CatalogResponse = {
  protocol: typeof PROTOCOL;
  generated_at: string;
  items: CatalogItem[];
  settlement: "not_settled";
};

/** Identifier is the product name, slugged. Not an invented product code. */
const FLOOR_DESK: CatalogItem = {
  sku: "floor-desk",
  title: "FLOOR desk",
  kind: "digital",
  owner: {
    type: "house",
    name: "FLOOR (Christopher Hatton)",
  },
  price: DESK_PRICE,
  checkout: DESK_CHECKOUT,
  payment: {
    checkout_url: DESK_CHECKOUT,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: HOUSE_DESK_X402_AMOUNT,
        asset: USDC.base.asset,
        payTo: HOUSE_DESK_PAYTO.base,
        resource: "/pay/floor-desk",
        description: "FLOOR desk",
      },
      {
        scheme: "exact",
        network: "solana",
        maxAmountRequired: HOUSE_DESK_X402_AMOUNT,
        asset: USDC.solana.asset,
        payTo: HOUSE_DESK_PAYTO.solana,
        resource: "/pay/floor-desk",
        description: "FLOOR desk",
      },
    ],
  },
  specs: [
    { name: "Term", value: "12 months" },
    { name: "Price", value: "$49 once" },
    { name: "What you list", value: "products for shopping bots" },
    { name: "Public list", value: "GET /api/catalog" },
    { name: "Pay", value: "bot pays at the listing checkout link or x402 details" },
    { name: "House list", value: "may start with this desk only" },
  ],
  inventory: 0,
  unlimited: true,
  lead_time: "instant",
  sla_hours: 0,
  return_days: 0,
  refund: "Access ends at 12 months. Not forever.",
  warranty: "none. Access lasts 12 months.",
  delivery: "membership access on Whop after payment",
};

/** FLOOR’s own product. Public receive addresses only. Do not invent other house products. */
export const HOUSE_ITEMS: CatalogItem[] = [FLOOR_DESK];

export function reservedIds(): string[] {
  return HOUSE_ITEMS.map((item) => item.sku);
}

export function findCatalogItem(id: string): CatalogItem | undefined {
  return HOUSE_ITEMS.find((item) => item.sku === id) || listListings().find((item) => item.sku === id);
}

export function buildCatalog(now = new Date(), origin?: string): CatalogResponse {
  const items = [...HOUSE_ITEMS, ...listListings()].map((item) => {
    const payment = expandPayment(item.payment, origin || "");
    return {
      ...item,
      payment,
      checkout: payment.checkout_url || item.checkout,
    };
  });
  return {
    protocol: PROTOCOL,
    generated_at: now.toISOString(),
    items,
    settlement: "not_settled",
  };
}
