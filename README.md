# FLOOR

Seller accounts for shopping bots.

## Problem

People click around a website. Shopping bots read a product list. If a listing is missing returns, stock, or real specs, they skip you.

## Open a desk · $49 once · 12 months

[Open a desk · $49 once · 12 months](https://whop.com/checkout/plan_j7hRIj9BQowga)

## How it works

1. List your first product free on `/desk`.
2. A desk is $49 once, 12 months, if you want more listings.
3. Bots read the list. Complete listings can be bought. Incomplete listings get skipped.

## What you get

12 months of seller-account access from the day you pay. A place to list products for shopping bots. Access comes as a Whop membership.

## What this is not

Not forever. After 12 months it ends unless you buy again. The bot pays at the listing’s checkout link. The $49 desk checkout is live. Other products pay at the URL the seller entered. FLOOR does not mark those sales as settled. Looking at the product list is free.

## Who you pay

FLOOR (Christopher Hatton) is the seller. Whop only takes the $49 payment.

Product page: [whop.com/floor-6c10/floor-b2a-desk](https://whop.com/floor-6c10/floor-b2a-desk)

List your first product free at `/desk`. The desk is still $49 once for 12 months.

[Open a desk · $49 once · 12 months](https://whop.com/checkout/plan_j7hRIj9BQowga)

## For shopping bots

```
GET /api/catalog
```

No login. JSON. Field `protocol` is `floor.b2a/v1`. Field `settlement` is `not_settled` — FLOOR does not settle x402 or hold funds. Each item has `payment.checkout_url` and/or `payment.accepts`. The house list includes the FLOOR desk (Whop checkout and public x402 receive addresses).

More: [FOR_AGENTS.md](./FOR_AGENTS.md) · [BUY.md](./BUY.md) · `/desk` · `/tape` · `/for-agents` · `/llms.txt` · `/sitemap.xml` · `/badge.svg`

```
npm install
npm run dev
```

## After a Whop payment

Dashboard checkout success / return URL must be `https://floor-desk-ecru.vercel.app/thanks` (or `WHOP_THANKS_URL` if you set one). Relative `/thanks` is the same page.

Unlock source of truth is the signed Whop webhook. `?payment_id=` on `/thanks` is an optional fast path. Bare `/thanks` does not ask a human to paste an id. If they just paid, they open `/desk` once access is active.

Humans: if checkout sends `/thanks?payment_id=` or `/thanks?membership_id=`, this site confirms, mints a `desk_token`, and sets the seller cookie.

Agents:

```
curl -sS -X POST https://floor-desk-ecru.vercel.app/api/desk/unlock \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"pay_XXXXXXXX"}'
```

Then send `Authorization: Bearer <desk_token>` on further `POST /api/listings`. First complete listing stays free.

Whop webhook URL: `https://<host>/api/webhooks/whop`. On signed `payment.succeeded` / `membership.activated` for `plan_j7hRIj9BQowga`, the site records entitlement (`payment_id`, `membership_id`, plan) so unlock can mint later. Unsigned bodies are rejected.

Manual webhook checks (local, `WHOP_WEBHOOK_SECRET` set):

```
# unsigned body → 401
curl -sS -D- -o- -X POST http://127.0.0.1:3000/api/webhooks/whop \
  -H 'Content-Type: application/json' \
  -H 'webhook-id: msg_unsigned' \
  -H 'webhook-timestamp: 1' \
  -H 'webhook-signature: v1,nope' \
  -d '{"type":"payment.succeeded"}'

# secret unset → 503
# happy path: signed payment.succeeded records entitlement (see npm test)
```

## Environment (never commit secrets)

Set these on the host. Do not put them in git.

Required for production unlock:

- `WHOP_API_KEY` — confirm membership/payment on `/thanks` and `POST /api/desk/unlock`
- `WHOP_WEBHOOK_SECRET` — verify `POST /api/webhooks/whop`. If unset, that route returns 503 and does not accept unsigned events.

Optional:

- `WHOP_THANKS_URL` — checkout return URL shown in copy. Defaults to `https://floor-desk-ecru.vercel.app/thanks`
- `FLOOR_TEST_DESK_SECRET` — offline QA only, 16+ characters. Unset in production. `POST /api/desk/ack` is 404 when unset. Not required for production.

Deploy waits for FLOOR + Protocol after these secrets are on Vercel. This repo does not deploy.
