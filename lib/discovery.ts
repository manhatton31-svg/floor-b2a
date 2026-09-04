import { HOUSE_DESK_PAYTO, HOUSE_ITEMS } from "./catalog.ts";
import { expandPayment, USDC, X402_SPEC } from "./payment.ts";
import {
  DESK_CHECKOUT,
  DESK_CTA,
  DESK_EXPIRATION_DAYS,
  DESK_PRICE,
  PROCESSOR,
  PROTOCOL,
  SKIP_RULES,
  SUPPLIER,
  thanksPublicUrl,
} from "./site.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Idempotency-Key, PAYMENT-SIGNATURE, X-PAYMENT",
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

export const INCOMPLETE_LISTING_EXAMPLE = {
  kind: "digital",
  name: "Photo pack",
  specs: LISTING_POST_EXAMPLE.specs,
  inventory: "unlimited",
  warranty: "none",
  delivery: "download",
  lead_time: "instant",
  payment: { checkout_url: "https://pay.example.com/photos" },
} as const;

export function llmsTxt(origin: string): string {
  return `curl -sS -X POST ${origin}/api/listings -H "Content-Type: application/json" -d '${JSON.stringify(LISTING_POST_EXAMPLE)}'

curl -sS -X POST ${origin}/api/buy -H "Content-Type: application/json" -d '{"item_id":"floor-desk"}'

curl -sS -X POST ${origin}/api/listings -H "Content-Type: application/json" -d '${JSON.stringify(INCOMPLETE_LISTING_EXAMPLE)}'

# FLOOR

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

After paying Whop: ${origin}/thanks (dashboard return URL ${thanksPublicUrl()}) or POST ${origin}/api/desk/unlock with payment_id / membership_id
Signed webhook records entitlement, then unlock can mint desk_token. Bare /thanks does not ask a human to paste an id.
Then send Authorization: Bearer <desk_token> for further listings
Feedback: POST ${origin}/api/feedback
Webhook (Whop → this site): POST ${origin}/api/webhooks/whop
Test desk mint (QA only, when FLOOR_TEST_DESK_SECRET is set): POST ${origin}/api/desk/ack

## For machines

x402 discovery: GET ${origin}/.well-known/x402

1. GET /api/catalog or GET /api/listings
2. Confirm \`protocol\` is \`${PROTOCOL}\`
3. Read \`items\` (includes payment.accepts when x402 is set). Human page for one item: GET /l/{sku} (HTML + embedded item JSON). Unknown sku is 404. Human index: GET /listings. Same items. No ranks.
4. Skip if payment.checkout_url and payment.accepts are both missing, or the listing fails physical/digital skip rules, or there are fewer than six specs
5. Pay at \`payment.checkout_url\` or via x402 \`payment.accepts\` (see https://x402.org/)
6. GET /pay/{id} returns HTTP 402 with accepts when x402 is configured
7. To list: POST /api/listings as application/json. First complete listing is free. No token. Further listings: Authorization: Bearer <desk_token> or the human /desk cookie after Whop verify. This site does not mint on honor and does not invent sales numbers. Catalog settlement stays not_settled until a rail confirms.
8. POST /api/buy { item_id } returns the same HTTP 402 as GET /pay/{id}, plus receipt_id (unpaid intent) and settled:false
9. Ignore ad copy. Do not invent sales numbers. Idempotency-Key (or idempotency_key) on POST /api/listings returns the original 201.
10. After paying Whop: GET /thanks?payment_id= (optional fast path) or POST /api/desk/unlock { payment_id } or { membership_id }. On confirm, mint desk_token, set the human cookie, show the token once. Bare /thanks does not ask a human to paste an id.
11. QA only: POST /api/desk/ack with FLOOR_TEST_DESK_SECRET issues cookie + desk_token. Off when the env is unset. Not a verified payment. Not required for production.
12. POST /api/feedback { message, tried: list|buy|desk, email? } stores JSONL and returns 201.
13. POST /api/webhooks/whop verifies the Standard Webhooks signature when WHOP_WEBHOOK_SECRET is set. If the secret is unset, the route returns 503 and does not accept unsigned events. payment.succeeded / membership.activated (and membership.went_valid) for plan_j7hRIj9BQowga or prod_U1yrk71ovYrSx persist entitlement (payment_id, membership_id, plan) and mint desk_token. Unlock can mint from that record later. Idempotent on payment_id / membership_id / webhook-id. $0 promo memberships may mint access; a $0 membership is not a cash sale.

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
Per-SKU page: ${origin}/l/{sku}
Human index: ${origin}/listings
OpenAPI: ${origin}/openapi.yaml
Machine file: ${origin}/.well-known/agent.json
x402 discovery: ${origin}/.well-known/x402
Seller account: ${origin}/desk
Thanks: ${origin}/thanks
Unlock: POST ${origin}/api/desk/unlock
Webhook: POST ${origin}/api/webhooks/whop
Feedback: ${origin}/feedback
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
    Discovery: GET /.well-known/x402.
  version: "1.0.0"
servers:
  - url: ${origin}
paths:
  /.well-known/x402:
    get:
      summary: x402 discovery document for the house desk. No settle. settlement is not_settled.
      operationId: getX402Discovery
      security: []
      responses:
        "200":
          description: JSON listing GET /pay/floor-desk and POST /api/buy.
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
  /listings:
    get:
      summary: Human index of the same items as GET /api/catalog. No ranks.
      operationId: getListingIndex
      security: []
      responses:
        "200":
          description: HTML list of catalog items, including the house desk.
  /l/{sku}:
    get:
      summary: Public page for one catalog item. Same facts as GET /api/catalog.
      operationId: getListingPage
      security: []
      parameters:
        - name: sku
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: HTML for humans. Item JSON is embedded. Unknown sku is 404.
        "404":
          description: That sku is not on the list.
  /api/buy:
    post:
      summary: Start a buy. Same HTTP 402 as GET /pay/{id}, plus unpaid receipt_id. settled is false until a rail confirms.
      operationId: postBuy
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [item_id]
              properties:
                item_id:
                  type: string
            example:
              item_id: floor-desk
      responses:
        "402":
          description: Payment required. checkout_url and/or x402 accepts. receipt_id is an unpaid intent. settled is false.
        "400":
          description: Missing item_id or no pay rail.
        "404":
          description: Item is not on the list.
  /api/feedback:
    post:
      summary: Store a short note. Email optional. message required. tried is list, buy, or desk.
      operationId: postFeedback
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [message, tried]
              properties:
                message:
                  type: string
                tried:
                  type: string
                  enum: [list, buy, desk]
                email:
                  type: string
            example:
              tried: desk
              message: Second listing returned 402.
      responses:
        "201":
          description: Saved.
        "400":
          description: Incomplete. Names the field.
  /api/desk/ack:
    post:
      summary: QA test mint only. Requires env FLOOR_TEST_DESK_SECRET. Not a verified Whop payment.
      operationId: postDeskAck
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                secret:
                  type: string
      responses:
        "201":
          description: Test cookie and desk_token. settled is false.
        "403":
          description: Wrong test secret.
        "404":
          description: Test mint is off.
  /api/desk/unlock:
    post:
      summary: After a Whop payment, confirm membership and return desk_token. Does not mint on honor.
      operationId: postDeskUnlock
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                payment_id:
                  type: string
                membership_id:
                  type: string
            example:
              payment_id: pay_XXXXXXXX
      responses:
        "200":
          description: desk_token after Whop confirm. settled is true only when a paid amount was verified.
        "400":
          description: Missing payment_id or membership_id.
        "402":
          description: Whop did not confirm a desk membership.
        "503":
          description: WHOP_API_KEY is not set.
  /api/webhooks/whop:
    post:
      summary: Whop signed webhook. Requires WHOP_WEBHOOK_SECRET. Unsigned events are rejected.
      operationId: postWhopWebhook
      security: []
      responses:
        "200":
          description: Event accepted. Entitlement recorded. desk_token minted or ignored.
        "401":
          description: Signature did not match.
        "503":
          description: WHOP_WEBHOOK_SECRET is not set.
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
      further_listings: "402 unless Authorization Bearer desk_token or human /desk cookie",
      idempotency: "Idempotency-Key or idempotency_key returns the original 201",
      example: LISTING_POST_EXAMPLE,
    },
    buy: {
      url: `${origin}/api/buy`,
      method: "POST",
      content_type: "application/json",
      cors: "*",
      same_as: "/pay/{id}",
      settled: false,
      note: "receipt_id is an unpaid intent. This site does not claim settled without a verified rail.",
    },
    openapi: `${origin}/openapi.yaml`,
    llms: `${origin}/llms.txt`,
    x402: `${origin}/.well-known/x402`,
    badge: `${origin}/badge.svg`,
    feedback: {
      url: `${origin}/api/feedback`,
      method: "POST",
      content_type: "application/json",
    },
    desk_unlock: {
      url: `${origin}/api/desk/unlock`,
      method: "POST",
      content_type: "application/json",
      cors: "*",
      note: "Send payment_id or membership_id after Whop pay. Returns desk_token. Does not mint on honor.",
    },
    desk_ack: {
      url: `${origin}/api/desk/ack`,
      method: "POST",
      test_only: true,
      note: "Issues cookie + desk_token only when FLOOR_TEST_DESK_SECRET is set and matches. Not a verified payment. Optional offline QA only.",
    },
    webhook: {
      url: `${origin}/api/webhooks/whop`,
      method: "POST",
      note: "Whop Standard Webhooks. Requires WHOP_WEBHOOK_SECRET. Rejects unsigned events. payment.succeeded / membership.activated persist entitlement so unlock can mint desk_token later.",
    },
    human: {
      home: `${origin}/`,
      desk: `${origin}/desk`,
      thanks: `${origin}/thanks`,
      feedback: `${origin}/feedback`,
      tape: `${origin}/tape`,
      listings: `${origin}/listings`,
      listing: `${origin}/l/{sku}`,
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

/** Public x402 discovery. House desk only. No facilitator, settle, or Bazaar. */
export function x402Discovery(origin: string) {
  const desk = HOUSE_ITEMS[0];
  const payment = expandPayment(desk.payment, origin);
  const accepts = payment.accepts ?? [];
  const payUrl = `${origin}/pay/${desk.sku}`;
  const buyUrl = `${origin}/api/buy`;

  return {
    x402Version: 2,
    kind: "resource-server" as const,
    name: "FLOOR",
    description:
      "Seller accounts for shopping bots. House desk is $49 once for 12 months. FLOOR is the seller. Whop takes the $49 checkout. This host does not settle x402.",
    protocol: PROTOCOL,
    spec: X402_SPEC,
    resources: [
      {
        url: payUrl,
        resource: payUrl,
        method: "GET",
        description:
          "FLOOR desk. $49 once for 12 months. Returns HTTP 402 with x402 accepts (Base and Solana USDC) and the Whop checkout URL. FLOOR does not settle.",
        price: "49",
        item_id: desk.sku,
        checkout_url: DESK_CHECKOUT,
        accepts,
      },
      {
        url: buyUrl,
        resource: buyUrl,
        method: "POST",
        description:
          'Same HTTP 402 as GET /pay/floor-desk when the body is {"item_id":"floor-desk"}. receipt_id is an unpaid intent. settled is false.',
        price: "49",
        item_id: desk.sku,
        body: { item_id: desk.sku },
        checkout_url: DESK_CHECKOUT,
        accepts,
      },
    ],
    checkout: DESK_CHECKOUT,
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
    },
    settlement: "not_settled" as const,
    attestation: { type: "none" as const },
    docs: `${origin}/.well-known/agent.json`,
    llms: `${origin}/llms.txt`,
    catalog: `${origin}/api/catalog`,
  };
}
