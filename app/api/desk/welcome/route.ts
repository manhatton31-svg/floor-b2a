import { NextResponse } from "next/server";
import {
  deskAckCookie,
  deskRevealCookie,
  deskTokenCookie,
  tokenFromCookie,
} from "@/lib/desk-ack";
import { hasDeskToken } from "@/lib/desk-token";

export const dynamic = "force-dynamic";

function first(value: string | null): string {
  return (value || "").trim();
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const fromQuery = first(url.searchParams.get("desk_token") || url.searchParams.get("token"));
  const fromCookie = tokenFromCookie(request.headers.get("cookie"));
  const token = fromQuery || fromCookie || "";

  const thanks = new URL("/thanks", request.url);

  if (!token || !hasDeskToken(token)) {
    if (fromQuery) thanks.searchParams.set("unknown", "1");
    return NextResponse.redirect(thanks, 303);
  }

  thanks.searchParams.set("once", "1");
  const res = NextResponse.redirect(thanks, 303);
  res.headers.append("Set-Cookie", deskAckCookie());
  res.headers.append("Set-Cookie", deskTokenCookie(token));
  res.headers.append("Set-Cookie", deskRevealCookie(token));
  return res;
}
