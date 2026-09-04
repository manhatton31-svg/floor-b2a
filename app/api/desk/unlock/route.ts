import { corsHeaders } from "@/lib/discovery";
import { deskAckCookie, deskRevealCookie, deskTokenCookie } from "@/lib/desk-ack";
import { mintVerifiedDeskToken } from "@/lib/desk-token";
import { PROTOCOL, thanksPublicUrl } from "@/lib/site";
import { idsFromUnknown, verifyDeskPurchase, whopApiKey } from "@/lib/whop";

export const dynamic = "force-dynamic";

function json(data: unknown, status: number, extra?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  if (!whopApiKey()) {
    return json(
      {
        ok: false,
        reason: "WHOP_API_KEY is not set. This site cannot confirm a Whop membership.",
        field: "payment_id",
        skip: ["no WHOP_API_KEY"],
        settled: false,
        settlement: "not_settled",
      },
      503,
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const ids = idsFromUnknown(body);
  if (!ids.payment_id && !ids.membership_id && !ids.receipt_id && !ids.code) {
    return json(
      {
        ok: false,
        reason: "Send a Whop payment_id or membership_id. This route does not mint on honor.",
        field: "payment_id",
        skip: ["no payment_id"],
        settled: false,
        settlement: "not_settled",
      },
      400,
    );
  }

  const grant = await verifyDeskPurchase(ids);
  if (!grant.ok) {
    return json(
      {
        ok: false,
        reason: grant.reason,
        field: grant.field || "payment_id",
        skip: ["not verified"],
        settled: false,
        settlement: "not_settled",
      },
      402,
    );
  }

  const minted = mintVerifiedDeskToken(grant);
  const headers = new Headers();
  headers.append("Set-Cookie", deskAckCookie());
  headers.append("Set-Cookie", deskTokenCookie(minted.token));
  headers.append("Set-Cookie", deskRevealCookie(minted.token));

  return json(
    {
      ok: true,
      desk_token: minted.token,
      authorization: `Bearer ${minted.token}`,
      membership_id: minted.membership_id,
      payment_id: minted.payment_id,
      settled: minted.settled,
      settlement: minted.settled ? "whop_paid" : "not_settled",
      cash: minted.cash,
      reused: minted.reused,
      thanks: "/thanks",
      thanks_url: thanksPublicUrl(),
    },
    200,
    headers,
  );
}
