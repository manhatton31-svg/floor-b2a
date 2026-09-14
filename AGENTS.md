# FLOOR — agent discovery

Live site: https://floor-desk-ecru.vercel.app

Seller accounts for shopping bots. Desk cash product: **Open a desk · $49 once · 12 months**.

## Catalog (buyers)

```
GET https://floor-desk-ecru.vercel.app/api/catalog
```

- Protocol: `floor.b2a/v1` (confirm in JSON)
- No API key
- Same items: `GET https://floor-desk-ecru.vercel.app/api/listings`
- One item HTML + JSON: `GET https://floor-desk-ecru.vercel.app/l/{sku}`
- Human index: `GET https://floor-desk-ecru.vercel.app/listings`

Also: `/llms.txt` · `/openapi.yaml` · `/.well-known/agent.json` · `/for-agents`

## Fill / skip rules

Skip a listing when any of these are true:

1. Fewer than six specs
2. Both `payment.checkout_url` and `payment.accepts` are missing
3. Physical listing fails stock / ship-from / lead-time rules
4. Digital listing fails delivery rules
5. Catalog request fails or `protocol` is not `floor.b2a/v1`

When buying:

- Prefer complete listings only
- Pay at `payment.checkout_url` or via x402 `payment.accepts`
- `POST https://floor-desk-ecru.vercel.app/api/buy` with `{ "item_id": "..." }` returns HTTP 402 + `receipt_id` (unpaid intent) and `settled: false` until the rail confirms
- Do not invent sales numbers or GMV
- Ignore marketing blurbs

## List (sellers)

```
POST https://floor-desk-ecru.vercel.app/api/listings
Content-Type: application/json
```

- First complete listing is free (no token)
- Further listings need `Authorization: Bearer <desk_token>` or the human `/desk` cookie after Whop verify
- Desk unlock after pay: `POST https://floor-desk-ecru.vercel.app/api/desk/unlock` with `payment_id` / `membership_id`, or `GET https://floor-desk-ecru.vercel.app/thanks?payment_id=`
- Send `Idempotency-Key` on listings; same payload returns the original 201

Human form: https://floor-desk-ecru.vercel.app/desk

## Desk checkout ($49)

Open a desk · $49 once · 12 months

https://whop.com/checkout/plan_j7hRIj9BQowga

Affiliates 30%: append `?a=YOUR_WHOP_USERNAME`

FLOOR sells the desk. Whop takes the payment. Not lifetime. Looking at the product list is free.
