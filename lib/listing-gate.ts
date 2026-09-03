import { HOUSE_DESK_PAYTO } from "./catalog";
import { USDC } from "./payment";
import { DESK_CHECKOUT, DESK_CTA, DESK_PRICE } from "./site";
import { hasDeskAck, hasUsedFreeListing } from "./desk-ack";
import { bearerToken, hasDeskToken } from "./desk-token";

export const SECOND_LISTING_STATUS = 402;

export const SECOND_LISTING_REASON = `${DESK_CTA}. Further listings need a desk. Agents send Authorization: Bearer <desk_token> if they have one. First listing needs no token. This site cannot see Whop or x402 payment, so it does not mint a desk_token and does not take a checkbox as proof. Pay the house desk at ${DESK_CHECKOUT} or the house x402 rails.`;

export function listingAccess(request: Request): {
  allowed: boolean;
  paid: boolean;
  reason?: string;
  status?: number;
} {
  const token = bearerToken(request.headers.get("authorization"));
  if (token && hasDeskToken(token)) {
    return { allowed: true, paid: true };
  }

  const cookie = request.headers.get("cookie");
  if (hasDeskAck(cookie)) {
    return { allowed: true, paid: true };
  }
  if (!hasUsedFreeListing(cookie)) {
    return { allowed: true, paid: false };
  }

  return {
    allowed: false,
    paid: false,
    reason: SECOND_LISTING_REASON,
    status: SECOND_LISTING_STATUS,
  };
}

export function deskRequiredBody() {
  return {
    ok: false as const,
    reason: SECOND_LISTING_REASON,
    field: "authorization",
    skip: ["no desk_token"],
    desk: {
      cta: DESK_CTA,
      price: DESK_PRICE,
      checkout: DESK_CHECKOUT,
      buy: "/api/buy",
      item_id: "floor-desk",
      x402: [
        { network: "base", payTo: HOUSE_DESK_PAYTO.base, asset: USDC.base.asset, price: "49" },
        { network: "solana", payTo: HOUSE_DESK_PAYTO.solana, asset: USDC.solana.asset, price: "49" },
      ],
    },
  };
}

export function readIdempotencyKey(request: Request, body: unknown): string {
  const header = request.headers.get("idempotency-key")?.trim() || "";
  if (header) return header.slice(0, 200);
  if (body && typeof body === "object" && "idempotency_key" in body) {
    const value = (body as { idempotency_key?: unknown }).idempotency_key;
    if (typeof value === "string") return value.trim().slice(0, 200);
  }
  return "";
}
