import {
  deskAckCookie,
  deskRevealCookie,
  deskTokenCookie,
  tokenFromCookie,
} from "@/lib/desk-ack";
import { hasDeskToken } from "@/lib/desk-token";
import { redirectTo } from "@/lib/redirect";

export const dynamic = "force-dynamic";

function first(value: string | null): string {
  return (value || "").trim();
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const fromQuery = first(url.searchParams.get("desk_token") || url.searchParams.get("token"));
  const fromCookie = tokenFromCookie(request.headers.get("cookie"));
  const token = fromQuery || fromCookie || "";

  if (!token || !hasDeskToken(token)) {
    const path = fromQuery ? "/thanks?unknown=1" : "/thanks";
    return redirectTo(request, path);
  }

  const res = redirectTo(request, "/thanks?once=1");
  res.headers.append("Set-Cookie", deskAckCookie());
  res.headers.append("Set-Cookie", deskTokenCookie(token));
  res.headers.append("Set-Cookie", deskRevealCookie(token));
  return res;
}
