import {
  AFFILIATE_PARAM,
  DESK_CHECKOUT,
  DESK_CTA,
  DESK_EXPIRATION_DAYS,
  DESK_PRICE,
  PROCESSOR,
  PROTOCOL,
  SKIP_RULES,
  SUPPLIER,
} from "./site";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Floor-Protocol": PROTOCOL,
} as const;

export function llmsTxt(origin: string): string {
  return `# FLOOR

> Seller accounts for shopping bots. ${DESK_CTA}.

## Problem

People click around a website. Shopping bots read a product list. If a listing is missing returns, stock, or real specs, they skip it.

## Offer

${DESK_CTA}

Checkout: ${DESK_CHECKOUT}

## How it works

1. Open a seller account. $49 once, 12 months.
2. List a product with specs, stock, return days, warranty, ship-from, and shipping time.
3. Bots read the list. Complete listings can be bought. Incomplete listings get skipped.

## What you get

12 months of seller-account access from the day you pay. A place to list products for shopping bots. Access comes as a Whop membership.

## What this is not

Not forever. After 12 months it ends unless you buy again. Bots have not spent money here. When a bot tries to buy, money does not move yet. Looking at the product list is free. FLOOR’s own product list may be empty. Empty is honest.

## Who you pay

FLOOR (Christopher Hatton) is the seller. Whop only takes the $49 payment.

Affiliates: ${DESK_CHECKOUT}?${AFFILIATE_PARAM}=WHOP_USERNAME

## For machines

1. GET /api/catalog
2. Confirm \`protocol\` is \`${PROTOCOL}\`
3. Read \`items\` (may be empty)
4. Skip if return_days is missing, inventory is empty, lead_time is missing, or there are fewer than six specs
5. Ignore ad copy

Product list: ${origin}/api/catalog
OpenAPI: ${origin}/openapi.yaml
Machine file: ${origin}/.well-known/agent.json
How to list: ${origin}/for-agents
Badge: ${origin}/badge.svg
Sitemap: ${origin}/sitemap.xml
`;
}

export function openApiYaml(origin: string): string {
  return `openapi: 3.1.0
info:
  title: FLOOR product list
  description: >
    Public product list for shopping bots. No login.
    Field protocol is ${PROTOCOL}. settlement is not_settled.
    When a bot tries to buy, money does not move yet.
  version: "1.0.0"
servers:
  - url: ${origin}
paths:
  /api/catalog:
    get:
      summary: Fetch the FLOOR product list
      operationId: getCatalog
      security: []
      responses:
        "200":
          description: Product list document
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Catalog"
components:
  schemas:
    Catalog:
      type: object
      additionalProperties: false
      required: [protocol, generated_at, items, settlement]
      properties:
        protocol:
          type: string
          const: ${PROTOCOL}
        generated_at:
          type: string
          format: date-time
        items:
          type: array
          description: FLOOR’s own products only. May be empty.
          items:
            $ref: "#/components/schemas/CatalogItem"
        settlement:
          type: string
          const: not_settled
    CatalogItem:
      type: object
      description: A FLOOR-owned product must be fully specified. The live list may be empty.
      required:
        - sku
        - title
        - owner
        - specs
        - inventory
        - lead_time
        - return_days
        - warranty
        - ships_from
        - sla_hours
      properties:
        sku:
          type: string
        title:
          type: string
        owner:
          type: object
          required: [type, name]
          properties:
            type:
              type: string
              const: house
            name:
              type: string
        specs:
          type: array
          minItems: 6
          items:
            type: object
            required: [name, value]
            properties:
              name:
                type: string
              value:
                type: string
        inventory:
          type: integer
          minimum: 0
        lead_time:
          type: string
        return_days:
          type: integer
          minimum: 0
        warranty:
          type: string
        ships_from:
          type: string
        sla_hours:
          type: integer
          minimum: 0
`;
}

export function agentDiscovery(origin: string) {
  return {
    name: "FLOOR",
    description:
      "Store for shopping bots. Bots read a product list. Missing returns, stock, or real specs means skip. When a bot tries to buy, money does not move yet.",
    protocol: PROTOCOL,
    version: "v1",
    authentication: "none",
    catalog: {
      url: `${origin}/api/catalog`,
      method: "GET",
      content_type: "application/json",
      book: "house",
    },
    openapi: `${origin}/openapi.yaml`,
    llms: `${origin}/llms.txt`,
    badge: `${origin}/badge.svg`,
    human: {
      home: `${origin}/`,
      for_agents: `${origin}/for-agents`,
    },
    skip_rules: [...SKIP_RULES],
    supplier: SUPPLIER,
    processor: PROCESSOR,
    desk: {
      cta: DESK_CTA,
      price: DESK_PRICE,
      access: "12 months of seller-account access from the day you pay",
      expiration_days: DESK_EXPIRATION_DAYS,
      payment: "one_payment",
      subscription: false,
      checkout: DESK_CHECKOUT,
      affiliate_query_param: AFFILIATE_PARAM,
    },
    settlement: "not_settled",
  };
}
