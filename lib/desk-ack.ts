export const DESK_ACK_COOKIE = "floor_desk_ack";
export const DESK_ACK_VALUE = "paid";
export const FREE_USED_COOKIE = "floor_free_used";
export const FREE_USED_VALUE = "1";

function cookieValue(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.split("=");
    if (rawName?.trim() === name) return rest.join("=").trim();
  }
  return undefined;
}

export function hasDeskAck(cookieHeader: string | null | undefined): boolean {
  return cookieValue(cookieHeader, DESK_ACK_COOKIE) === DESK_ACK_VALUE;
}

export function hasUsedFreeListing(cookieHeader: string | null | undefined): boolean {
  return cookieValue(cookieHeader, FREE_USED_COOKIE) === FREE_USED_VALUE;
}

export function canSubmitListing(cookieHeader: string | null | undefined): boolean {
  return hasDeskAck(cookieHeader) || !hasUsedFreeListing(cookieHeader);
}

export function freeUsedCookie(): string {
  return `${FREE_USED_COOKIE}=${FREE_USED_VALUE}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly`;
}
