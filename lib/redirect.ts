import { NextResponse } from "next/server";

/** Stay on the incoming Host so cookies set for 127.0.0.1 are not sent to localhost. */
export function redirectTo(request: Request, path: string, status: 303 | 307 | 308 = 303) {
  return NextResponse.redirect(new URL(path, hostOrigin(request)), status);
}

export function hostOrigin(request: Request): string {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || (process.env.VERCEL ? "https" : "http");
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}
