import { canSubmitListing, hasDeskAck } from "./desk-ack";

export const SECOND_LISTING_REASON =
  "Your first product is already listed. Further listings need a desk. Open a desk · $49 once · 12 months. This site cannot see the Whop payment.";

export function listingAccess(cookieHeader: string | null | undefined): {
  allowed: boolean;
  paid: boolean;
  reason?: string;
} {
  const paid = hasDeskAck(cookieHeader);
  if (canSubmitListing(cookieHeader)) {
    return { allowed: true, paid };
  }
  return { allowed: false, paid, reason: SECOND_LISTING_REASON };
}
