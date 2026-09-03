import { buildCatalog, reservedIds } from "@/lib/catalog";
import { corsHeaders } from "@/lib/discovery";
import { freeUsedCookie } from "@/lib/desk-ack";
import { deskRequiredBody, listingAccess } from "@/lib/listing-gate";
import { addListing, listingIds } from "@/lib/listing-store";
import { normalizeListingInput, validateListing } from "@/lib/listing-validate";
import { originFromRequest, PROTOCOL } from "@/lib/site";

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

export function GET(request: Request) {
  return json(buildCatalog(new Date(), originFromRequest(request)), 200);
}

export async function POST(request: Request) {
  const access = listingAccess(request.headers.get("cookie"));
  if (!access.allowed) {
    return json(deskRequiredBody(), access.status ?? 402);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        reason: "Send application/json with the product facts.",
      },
      400,
    );
  }

  const result = validateListing(normalizeListingInput(body), [...reservedIds(), ...listingIds()]);
  if (!result.ok) {
    return json({ ok: false, reason: result.reason }, 400);
  }

  const item = addListing(result.item);
  const headers = new Headers({
    ...corsHeaders,
    "Content-Type": "application/json",
    "X-Floor-Protocol": PROTOCOL,
    "Cache-Control": "no-store",
  });
  if (!access.paid) headers.append("Set-Cookie", freeUsedCookie());

  return new Response(
    JSON.stringify({
      ok: true,
      item,
      settlement: "not_settled",
      next: access.paid ? "list" : "desk",
    }),
    { status: 201, headers },
  );
}
