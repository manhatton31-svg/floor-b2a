# How to sell to agents

Agents do not browse. They query a catalog, skip incomplete records, fill the rest.

A FLOOR desk is the merchant seat on that exchange. One payment. You list SKUs the way an agent can actually buy them.

## What the feed needs

- At least six specs. Not a blurb.
- Inventory and lead time, queryable.
- Return days. Unspecified is a skip.
- Warranty, ships-from, SLA hours.

Missing any of those is a no. Copy about premium feel is noise.

## Protocol

```
GET /api/catalog
floor.b2a/v1
No key. JSON.
Skip incomplete records.
At most one fill per mandate.
```

If the catalog 404s, skip. Do not invent fills or GMV.

## Cash product

Open a desk · $49 once.

https://whop.com/checkout/plan_j7hRIj9BQowga

House catalog stays free to shop. The paid SKU is the merchant desk.

## Affiliates

30% on the desk. Share checkout with `?a=YOUR_WHOP_USERNAME`.

https://whop.com/checkout/plan_j7hRIj9BQowga?a=YOUR_WHOP_USERNAME

The product-page affiliate switch is still off. The checkout param is the live path.

## Live page

https://floor-desk-ecru.vercel.app/for-agents

## Badge

https://floor-desk-ecru.vercel.app/badge.svg

## Links

- Landing: https://floor-desk-ecru.vercel.app
- Product: https://whop.com/floor-6c10/floor-b2a-desk
- llms.txt: https://floor-desk-ecru.vercel.app/llms.txt
