import {
  deskAckCookie,
  deskRevealCookie,
  deskTokenCookie,
  tokenFromCookie,
} from "@/lib/desk-ack";
import { hasDeskToken, mintVerifiedDeskToken } from "@/lib/desk-token";
import { redirectTo } from "@/lib/redirect";
import { verifyDeskPurchase } from "@/lib/whop";

export const dynamic = "force-dynamic";

function first(value: string | null): string {
  return (value || "").trim();
}

function accept(request: Request, token: string) {
  const res = redirectTo(request, "/thanks?once=1");
  res.headers.append("Set-Cookie", deskAckCookie());
  res.headers.append("Set-Cookie", deskTokenCookie(token));
  res.headers.append("Set-Cookie", deskRevealCookie(token));
  return res;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fromQuery = first(url.searchParams.get("desk_token") || url.searchParams.get("token"));
  const fromCookie = tokenFromCookie(request.headers.get("cookie"));
  const token = fromQuery || fromCookie || "";

  if (token) {
    if (!hasDeskToken(token)) {
      const path = fromQuery ? "/thanks?unknown=1" : "/thanks";
      return redirectTo(request, path);
    }
    return accept(request, token);
  }

  const ids = {
    payment_id: first(url.searchParams.get("payment_id")),
    membership_id: first(url.searchParams.get("membership_id")),
    receipt_id: first(url.searchParams.get("receipt_id")),
    code: first(url.searchParams.get("code")),
  };
  if (!ids.payment_id && !ids.membership_id && !ids.receipt_id && !ids.code) {
    return redirectTo(request, "/thanks");
  }

  const grant = await verifyDeskPurchase(ids);
  if (!grant.ok) {
    const why = encodeURIComponent(grant.reason.slice(0, 240));
    return redirectTo(request, `/thanks?unpaid=1&why=${why}`);
  }

  const minted = mintVerifiedDeskToken(grant);
  return accept(request, minted.token);
}
