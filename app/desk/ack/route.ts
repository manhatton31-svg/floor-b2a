import { NextResponse } from "next/server";
import { DESK_ACK_COOKIE, DESK_ACK_VALUE } from "@/lib/desk-ack";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/desk", request.url), 303);
  res.cookies.set(DESK_ACK_COOKIE, DESK_ACK_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
