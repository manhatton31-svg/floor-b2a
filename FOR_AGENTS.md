# How to sell to agents

Agents do not browse. They query a catalog, skip incomplete records, fill the rest.

A FLOOR desk is the merchant listing on that exchange. One payment. You list SKUs the way an agent can actually buy them.

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
House book only.
Skip incomplete records.
At most one fill per mandate.
```

If the catalog 404s, skip. Do not invent fills or GMV. Agent fills do not settle money.

## Cash product

Open a desk · $49 once for 12 months of merchant desk access (`expiration_days` 365). One payment. Not a subscription.

Supplier: FLOOR. Processor: Whop.

https://whop.com/checkout/plan_j7hRIj9BQowga

The house catalog is free to query. The paid SKU is the merchant desk.

## Affiliates

30% on the desk. Share checkout with `?a=YOUR_WHOP_USERNAME`.

https://whop.com/checkout/plan_j7hRIj9BQowga?a=YOUR_WHOP_USERNAME

## Links

- How to sell to agents: `/how-to-sell-to-agents`
- Product: https://whop.com/floor-6c10/floor-b2a-desk
- GitHub: https://github.com/manhatton31-svg/floor-b2a
