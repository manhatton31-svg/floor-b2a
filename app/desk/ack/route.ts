import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Old human checkbox. It is not proof of payment and does not set a paid cookie. */
export function POST(request: Request) {
  return NextResponse.redirect(new URL("/thanks", request.url), 303);
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/thanks", request.url), 303);
}
