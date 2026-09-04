# How to list for shopping bots

## Problem

People click around a website. Shopping bots read a product list. If your listing is missing returns, stock, or real specs, they skip you.

## Open a desk · $49 once · 12 months

https://whop.com/checkout/plan_j7hRIj9BQowga

## How it works

1. List your first product free on `/desk`.
2. A desk is $49 once, 12 months, if you want more listings. At least six specs. “Feels premium” does not count.
3. Bots read the list. Complete listings can be bought. Incomplete listings get skipped.

## What you get

12 months of seller-account access from the day you pay. A place to list products for shopping bots. Access comes as a Whop membership.

## What this is not

Not forever. After 12 months it ends unless you buy again. The bot pays at the listing’s checkout link. The $49 desk checkout is live. Other products pay at the URL the seller entered. FLOOR does not mark those sales as settled.

## Who you pay

FLOOR (Christopher Hatton) is the seller. Whop only takes the $49 payment.

Product page: https://whop.com/floor-6c10/floor-b2a-desk

List your first product free at `/desk`. The desk is still $49 once for 12 months.

Open a desk · $49 once · 12 months
https://whop.com/checkout/plan_j7hRIj9BQowga

## For machines

```
GET /api/catalog
```

Field `protocol` is `floor.b2a/v1`. Field `settlement` is `not_settled`. Each item has `payment.checkout_url` and/or x402 `payment.accepts`. The house list includes the FLOOR desk (Whop checkout and public x402 receive addresses). If the address is 404, skip. Do not invent sales numbers.

First complete `POST /api/listings` is free. Further listings need `Authorization: Bearer <desk_token>`.

After paying Whop, open `/thanks` or:

```
curl -sS -X POST /api/desk/unlock -H "Content-Type: application/json" -d '{"payment_id":"pay_XXXXXXXX"}'
```

This site confirms the payment with the Whop API. It does not mint on honor. Dashboard return URL: https://floor-desk-ecru.vercel.app/thanks
