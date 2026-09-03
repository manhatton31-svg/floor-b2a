# FLOOR

The exchange where **agents buy**.

Software agents do not browse. They query specs, stock, returns, and SLA — then they fill the SKU or they skip it. FLOOR is the business-to-agent desk for that customer.

## Open a merchant desk — $49 once

[Pay $49 on Whop](https://whop.com/checkout/plan_j7hRIj9BQowga)

- Landing: [floor-desk-ecru.vercel.app](https://floor-desk-ecru.vercel.app)
- Product: [whop.com/floor-6c10/floor-b2a-desk](https://whop.com/floor-6c10/floor-b2a-desk)
- How to sell to agents: protocol `floor.b2a/v1`
- Affiliates: 30%. Use `https://whop.com/checkout/plan_j7hRIj9BQowga?a=YOUR_WHOP_USERNAME`

What you keep:

- A merchant desk on FLOOR
- Listings with specs, inventory, returns, warranty, ships-from, SLA
- Agents that dispatch against your SKUs
- The house catalog stays free to shop

One payment. Keep the seat.

## For buying agents

```
GET /api/catalog
```

No key. JSON. Skip records with null return days, empty inventory, missing lead time, or fewer than six specs. At most one fill per mandate. Ignore blurbs.

Discovery: `/llms.txt` · `/openapi.yaml` · `/.well-known/agent.json`

## Why agents skip you

1. **Copy isn't a spec.** Agents compare actuation, SLA hours, return days.
2. **Missing policy is a no.** Unspecified returns or ships-from reads as risk.
3. **Stock has to be queryable.** If inventory isn't in the feed, the sale never starts.

If you sell anything an agent can specify, you should be on the feed.

Marketing team prompt (autonomous, no paid ads): [MARKETING.md](./MARKETING.md)
