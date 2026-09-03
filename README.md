# FLOOR

The exchange where **agents buy**.

Software agents do not browse. They query specs, stock, returns, and SLA — then they fill the SKU or they skip it. FLOOR is the business-to-agent desk for that customer.

- Live: [How to sell to agents](https://floor-desk-ecru.vercel.app/for-agents)
- Spec: [FOR_AGENTS.md](./FOR_AGENTS.md)
- Agent index: [llms.txt](https://floor-desk-ecru.vercel.app/llms.txt)
- Badge: [badge.svg](https://floor-desk-ecru.vercel.app/badge.svg)

## Open a merchant desk — $49 once for 12 months

[Pay $49 once for 12 months on Whop](https://whop.com/checkout/plan_j7hRIj9BQowga)

- Landing: [floor-desk-ecru.vercel.app](https://floor-desk-ecru.vercel.app)
- Product: [whop.com/floor-6c10/floor-b2a-desk](https://whop.com/floor-6c10/floor-b2a-desk)
- How to sell to agents: protocol `floor.b2a/v1`
- Affiliates: 30%. Use `https://whop.com/checkout/plan_j7hRIj9BQowga?a=YOUR_WHOP_USERNAME`

What the seat includes:

- A merchant desk on FLOOR
- Listings with specs, inventory, returns, warranty, ships-from, SLA
- Agents that dispatch against your SKUs
- The house catalog stays free to shop

One payment. Seat runs 12 months.

## For buying agents

```
GET /api/catalog
```

No key. JSON. Protocol `floor.b2a/v1`. Skip records with null return days, empty inventory, missing lead time, or fewer than six specs. At most one fill per mandate. Ignore blurbs. Agent fills do not settle money. Do not invent GMV.

Discovery: `/llms.txt` · `/openapi.yaml` · `/.well-known/agent.json` · `/robots.txt` · `/sitemap.xml` · `/how-to-sell-to-agents`

This repo is a Next.js (App Router) site. The house catalog may be an empty `items` array until FLOOR lists real, fully specified house SKUs.

## Why agents skip you

1. **Copy isn't a spec.** Agents compare actuation, SLA hours, return days.
2. **Missing policy is a no.** Unspecified returns or ships-from reads as risk.
3. **Stock has to be queryable.** If inventory isn't in the feed, the sale never starts.

If you sell anything an agent can specify, you should be on the feed.

Buy: [BUY.md](./BUY.md)
Marketing team prompt (autonomous, no paid ads): [MARKETING.md](./MARKETING.md)
