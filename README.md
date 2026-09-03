# FLOOR

Seller accounts for shopping bots.

## Problem

People click around a website. Shopping bots read a product list. If a listing is missing returns, stock, or real specs, they skip you.

## Open a desk · $49 once · 12 months

[Open a desk · $49 once · 12 months](https://whop.com/checkout/plan_j7hRIj9BQowga)

## How it works

1. Open a seller account. $49 once, 12 months.
2. List a product on `/desk` with specs, stock, return days, warranty, ship-from, and shipping time.
3. Bots read the list. Complete listings can be bought. Incomplete listings get skipped.

## What you get

12 months of seller-account access from the day you pay. A place to list products for shopping bots. Access comes as a Whop membership.

## What this is not

Not forever. After 12 months it ends unless you buy again. Bots have not spent money here. When a bot tries to buy, money does not move yet. Looking at the product list is free. FLOOR’s own product list may be empty. Empty is honest.

## Who you pay

FLOOR (Christopher Hatton) is the seller. Whop only takes the $49 payment.

Product page: [whop.com/floor-6c10/floor-b2a-desk](https://whop.com/floor-6c10/floor-b2a-desk)

After you pay, list a product at `/desk`.

[Open a desk · $49 once · 12 months](https://whop.com/checkout/plan_j7hRIj9BQowga)

## For shopping bots

```
GET /api/catalog
```

No login. JSON. Field `protocol` is `floor.b2a/v1`. Field `settlement` is `not_settled`. `items` may be `[]`. Empty is honest.

More: [FOR_AGENTS.md](./FOR_AGENTS.md) · [BUY.md](./BUY.md) · `/desk` · `/for-agents` · `/llms.txt` · `/sitemap.xml` · `/badge.svg`

```
npm install
npm run dev
```
