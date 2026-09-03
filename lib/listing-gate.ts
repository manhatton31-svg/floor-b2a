import { DESK_CHECKOUT, DESK_CTA, DESK_PRICE } from "./site";
import { canSubmitListing, hasDeskAck } from "./desk-ack";

export const SECOND_LISTING_STATUS = 402;

export const SECOND_LISTING_REASON = `${DESK_CTA}. Your first product is already listed. Further listings need a desk. Pay at ${DESK_CHECKOUT}. This site cannot see the Whop payment.`;

export function listingAccess(cookieHeader: string | null | undefined): {
  allowed: boolean;
  paid: boolean;
  reason?: string;
  status?: number;
} {
  const paid = hasDeskAck(cookieHeader);
  if (canSubmitListing(cookieHeader)) {
    return { allowed: true, paid };
  }
  return {
    allowed: false,
    paid,
    reason: SECOND_LISTING_REASON,
    status: SECOND_LISTING_STATUS,
  };
}

export function deskRequiredBody() {
  return {
    ok: false as const,
    reason: SECOND_LISTING_REASON,
    desk: {
      cta: DESK_CTA,
      price: DESK_PRICE,
      checkout: DESK_CHECKOUT,
    },
    settlement: "not_settled" as const,
  };
}
