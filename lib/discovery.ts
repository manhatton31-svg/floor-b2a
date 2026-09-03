import { HOUSE_DESK_PAYTO } from "./catalog";
import { USDC } from "./payment";
import {
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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Floor-Protocol": PROTOCOL,
} as const;

export const LISTING_POST_EXAMPLE = {
  kind: "digital",
  name: "Photo pack",
  specs: [
    { name: "Format", value: "JPEG" },
    { name: "Count", value: "24 photos" },
    { name: "Resolution", value: "4000 px" },
    { name: "Color", value: "sRGB" },
    { name: "License", value: "one buyer" },
    { name: "Size", value: "120 MB" },
  ],
  inventory: "unlimited",
  refund_days: 0,
  warranty: "none",
  delivery: "download",
  lead_time: "instant",
  payment: {
    checkout_url: "https://pay.example.com/photos",
    network: "base",
    payTo: "0xYourPublicReceiveAddress",
    price: "12.50",
  },
  owner: { name: "optional seller name" },
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

1. List your first product free at ${origin}/desk or POST ${origin}/api/listings.
2. A desk is $49 once, 12 months, if you want more listings.
3. Bots read the list. They pay at the checkout link or x402 details on each listing. Incomplete listings get skipped.

## What you get

12 months of seller-account access from the day you pay. A place to list products for shopping bots. Access comes as a Whop membership.

## What this is not

Not forever. After 12 months it ends unless you buy again. The bot pays at the listing’s checkout link or x402 details. The $49 desk checkout is live. FLOOR does not settle x402 or hold funds. Looking at the product list is free.

## Who you pay

FLOOR (Christopher Hatton) is the seller. Whop only takes the $49 payment.

List your first product free at ${origin}/desk. The desk is still $49 once for 12 months.

## For machines

1. GET /api/catalog or GET /api/listings
2. Confirm \`protocol\` is \`${PROTOCOL}\`
3. Read \`items\` (includes payment.accepts when x402 is set)
4. Skip if payment.checkout_url and payment.accepts are both missing, or the listing fails physical/digital skip rules, or there are fewer than six specs
5. Pay at \`payment.checkout_url\` or via x402 \`payment.accepts\` (see https://x402.org/)
6. GET /pay/{id} returns HTTP 402 with accepts when x402 is configured
7. To list: POST /api/listings as application/json. No login for the first complete listing. Send cookies back. Further listings return 402 unless a desk cookie/ack is present. This site cannot see the Whop payment.
8. Ignore ad copy. FLOOR does not settle x402 or hold funds. Do not invent sales numbers

### How an agent lists

POST ${origin}/api/listings
Content-Type: application/json
CORS: *

${JSON.stringify(LISTING_POST_EXAMPLE, null, 2)}

First complete listing is free. Further listings: HTTP 402 with plain JSON. Open a desk · $49 once · 12 months. Checkout: ${DESK_CHECKOUT}

Skip rules: ${SKIP_RULES.join("; ")}

x402 public fields only: network (base or solana), payTo (receive address), price in US dollars. Never send a seed, private key, password, or Stripe sk_live.

FLOOR house desk pays at ${DESK_CHECKOUT} and x402 $49 USDC:
- Base payTo ${HOUSE_DESK_PAYTO.base} asset ${USDC.base.asset}
- Solana payTo ${HOUSE_DESK_PAYTO.solana} asset ${USDC.solana.asset}

Product list: ${origin}/api/catalog
Listings: ${origin}/api/listings
OpenAPI: ${origin}/openapi.yaml
Machine file: ${origin}/.well-known/agent.json
Seller account: ${origin}/desk
Tape: ${origin}/tape
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
    The bot pays at payment.checkout_url or payment.accepts (x402).
    FLOOR does not settle x402 or hold funds.
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
  /api/listings:
    get:
      summary: Same public items as GET /api/catalog, including payment.accepts
      operationId: getListings
      security: []
      responses:
        "200":
          description: Product list document
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Catalog"
    post:
      summary: List a product. First complete listing is free. No login.
      operationId: postListing
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ListingPost"
            example:
              kind: digital
              name: Photo pack
              specs:
                - { name: Format, value: JPEG }
                - { name: Count, value: "24 photos" }
                - { name: Resolution, value: "4000 px" }
                - { name: Color, value: sRGB }
                - { name: License, value: one buyer }
                - { name: Size, value: "120 MB" }
              inventory: unlimited
              refund_days: 0
              warranty: none
              delivery: download
              lead_time: instant
              payment:
                checkout_url: https://pay.example.com/photos
                network: base
                payTo: 0xYourPublicReceiveAddress
                price: "12.50"
              owner:
                name: optional seller name
      responses:
        "201":
          description: Listed. Item is on GET /api/catalog and GET /api/listings.
        "400":
          description: Incomplete. Plain-English reason JSON.
        "402":
          description: Further listings need a desk. $49 once for 12 months.
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
          description: Public products. May include the FLOOR desk. Extra items come from sellers.
          items:
            $ref: "#/components/schemas/CatalogItem"
        settlement:
          type: string
          const: not_settled
    CatalogItem:
      type: object
      description: A listed product must be fully specified. The live list may be empty.
      required:
        - sku
        - title
        - kind
        - owner
        - specs
        - inventory
        - lead_time
        - return_days
        - warranty
        - payment
        - sla_hours
      properties:
        sku:
          type: string
        title:
          type: string
        kind:
          type: string
          enum: [physical, digital]
        owner:
          type: object
          required: [type, name]
          properties:
            type:
              type: string
              enum: [house, desk]
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
        unlimited:
          type: boolean
        lead_time:
          type: string
        return_days:
          type: integer
          minimum: 0
        warranty:
          type: string
        checkout:
          type: string
          format: uri
        payment:
          type: object
          description: checkout_url and/or x402 accepts. Public fields only.
          properties:
            checkout_url:
              type: string
              format: uri
            accepts:
              type: array
              items:
                type: object
                required: [scheme, network, maxAmountRequired, asset, payTo, resource, description]
                properties:
                  scheme:
                    type: string
                    const: exact
                  network:
                    type: string
                    enum: [base, solana]
                  maxAmountRequired:
                    type: string
                  asset:
                    type: string
                  payTo:
                    type: string
                  resource:
                    type: string
                  description:
                    type: string
        ships_from:
          type: string
        delivery:
          type: string
        price:
          type: string
        refund:
          type: string
        sla_hours:
          type: integer
          minimum: 0
    ListingPost:
      type: object
      description: >
        Same facts as the human desk form. title or name. return_days or refund_days.
        payment.checkout_url and/or x402 network, payTo, price. Public fields only.
      required: [kind, specs, inventory, warranty]
      properties:
        kind:
          type: string
          enum: [physical, digital]
        title:
          type: string
        name:
          type: string
        specs:
          type: array
          minItems: 6
        inventory: {}
        return_days:
          type: integer
        refund_days:
          type: integer
        warranty:
          type: string
        ships_from:
          type: string
        lead_time:
          type: string
        delivery:
          type: string
        payment:
          type: object
          properties:
            checkout_url:
              type: string
            network:
              type: string
              enum: [base, solana]
            payTo:
              type: string
            price:
              type: string
        owner:
          type: object
          properties:
            name:
              type: string
`;
}

export function agentDiscovery(origin: string) {
  return {
    name: "FLOOR",
    description:
      "Store for shopping bots. Bots read a product list. Missing payment, returns, stock, or real specs means skip. The bot pays at checkout_url or x402 accepts.",
    protocol: PROTOCOL,
    version: "v1",
    authentication: "none",
    catalog: {
      url: `${origin}/api/catalog`,
      method: "GET",
      content_type: "application/json",
      book: "house",
    },
    listings: {
      url: `${origin}/api/listings`,
      methods: ["GET", "POST"],
      content_type: "application/json",
      cors: "*",
      first_listing: "free",
      further_listings: "402 unless desk cookie/ack is present",
      example: LISTING_POST_EXAMPLE,
    },
    openapi: `${origin}/openapi.yaml`,
    llms: `${origin}/llms.txt`,
    badge: `${origin}/badge.svg`,
    human: {
      home: `${origin}/`,
      desk: `${origin}/desk`,
      tape: `${origin}/tape`,
      pay: `${origin}/pay/{id}`,
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
      x402: [
        {
          network: "base",
          payTo: HOUSE_DESK_PAYTO.base,
          asset: USDC.base.asset,
          price: "49",
        },
        {
          network: "solana",
          payTo: HOUSE_DESK_PAYTO.solana,
          asset: USDC.solana.asset,
          price: "49",
        },
      ],
    },
    settlement: "not_settled",
  };
}
