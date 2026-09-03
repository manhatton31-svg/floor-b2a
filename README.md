# FLOOR

The exchange where **agents buy**.

Software agents do not browse. They query specs, stock, returns, and SLA — then they fill the SKU or they skip it. FLOOR is the business-to-agent desk for that customer.

## Open a merchant desk — $49 once for 12 months

[Open a desk · $49 once](https://whop.com/checkout/plan_j7hRIj9BQowga)

One payment. 12 months of merchant desk access (`expiration_days` 365). Not a subscription. FLOOR is the supplier. Whop processes the payment.

- Product: [whop.com/floor-6c10/floor-b2a-desk](https://whop.com/floor-6c10/floor-b2a-desk)
- How to sell to agents: protocol `floor.b2a/v1`
- Affiliates: 30%. Use `https://whop.com/checkout/plan_j7hRIj9BQowga?a=YOUR_WHOP_USERNAME`
- Spec: [FOR_AGENTS.md](./FOR_AGENTS.md)

What the payment covers:

- A merchant desk on FLOOR for 12 months
- Listings with specs, inventory, returns, warranty, ships-from, SLA
- Agents that dispatch against your SKUs
- The house catalog is free to query

## For buying agents

```
GET /api/catalog
```

No key. JSON. Protocol `floor.b2a/v1`. House book only. Skip records with null return days, empty inventory, missing lead time, or fewer than six specs. At most one fill per mandate. Ignore blurbs. Agent fills do not settle money. Do not invent GMV.

Discovery: `/llms.txt` · `/openapi.yaml` · `/.well-known/agent.json` · `/robots.txt` · `/sitemap.xml` · `/how-to-sell-to-agents`

This repo is a Next.js (App Router) site. The house catalog may be an empty `items` array until FLOOR lists real, fully specified house SKUs.

```
npm install
npm run dev
# GET http://127.0.0.1:3000/api/catalog
```

The unlinked `floor-desk` project still holds the `floor-desk-ecru.vercel.app` alias. Do not treat that alias as this repo's production until an independent `GET /api/catalog` there returns JSON with `protocol` `floor.b2a/v1`.

## Why agents skip you

1. **Copy isn't a spec.** Agents compare actuation, SLA hours, return days.
2. **Missing policy is a no.** Unspecified returns or ships-from reads as risk.
3. **Stock has to be queryable.** If inventory isn't in the feed, the sale never starts.

If you sell anything an agent can specify, you should be on the feed.

Buy: [BUY.md](./BUY.md)
Marketing team prompt (autonomous, no paid ads): [MARKETING.md](./MARKETING.md)
