export const DESK_ACK_COOKIE = "floor_desk_ack";
export const DESK_ACK_VALUE = "paid";
export const DESK_TOKEN_COOKIE = "floor_desk_token";
export const DESK_REVEAL_COOKIE = "floor_desk_reveal";
export const FREE_USED_COOKIE = "floor_free_used";
export const FREE_USED_VALUE = "1";
const COOKIE_YEAR = 60 * 60 * 24 * 365;

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

export function tokenFromCookie(cookieHeader: string | null | undefined): string | null {
  const ours = cookieValue(cookieHeader, DESK_TOKEN_COOKIE) || "";
  const alias = cookieValue(cookieHeader, "desk_token") || "";
  const raw = ours || alias;
  return raw.startsWith("desk_") ? raw : null;
}

export function revealFromCookie(cookieHeader: string | null | undefined): string | null {
  const raw = cookieValue(cookieHeader, DESK_REVEAL_COOKIE) || "";
  return raw.startsWith("desk_") ? raw : null;
}

export function hasUsedFreeListing(cookieHeader: string | null | undefined): boolean {
  return cookieValue(cookieHeader, FREE_USED_COOKIE) === FREE_USED_VALUE;
}

export function canSubmitListing(cookieHeader: string | null | undefined): boolean {
  return hasDeskAck(cookieHeader) || !hasUsedFreeListing(cookieHeader);
}

export function freeUsedCookie(): string {
  return `${FREE_USED_COOKIE}=${FREE_USED_VALUE}; Path=/; Max-Age=${COOKIE_YEAR}; SameSite=Lax; HttpOnly`;
}

export function deskAckCookie(): string {
  return `${DESK_ACK_COOKIE}=${DESK_ACK_VALUE}; Path=/; Max-Age=${COOKIE_YEAR}; SameSite=Lax; HttpOnly`;
}

export function deskTokenCookie(token: string): string {
  return `${DESK_TOKEN_COOKIE}=${token}; Path=/; Max-Age=${COOKIE_YEAR}; SameSite=Lax; HttpOnly`;
}

export function deskRevealCookie(token: string): string {
  return `${DESK_REVEAL_COOKIE}=${token}; Path=/; Max-Age=120; SameSite=Lax; HttpOnly`;
}

export function clearRevealCookie(): string {
  return `${DESK_REVEAL_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}
