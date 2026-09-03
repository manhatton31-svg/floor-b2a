export const DESK_ACK_COOKIE = "floor_desk_ack";
export const DESK_ACK_VALUE = "paid";

export function hasDeskAck(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.split("=");
    if (rawName?.trim() === DESK_ACK_COOKIE && rest.join("=").trim() === DESK_ACK_VALUE) {
      return true;
    }
  }
  return false;
}
