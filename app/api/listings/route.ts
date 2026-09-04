import { buildCatalog, reservedIds } from "@/lib/catalog";
import { corsHeaders } from "@/lib/discovery";
import { freeUsedCookie } from "@/lib/desk-ack";
import { deskRequiredBody, listingAccess, readIdempotencyKey } from "@/lib/listing-gate";
import {
  addListing,
  findListing,
  listingByIdempotencyKey,
  listingIds,
  rememberListingIdempotency,
} from "@/lib/listing-store";
import { normalizeListingInput, slugFromTitle, validateListing } from "@/lib/listing-validate";
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

function listed(item: unknown, paid: boolean, extra?: HeadersInit) {
  const headers = new Headers({
    ...corsHeaders,
    "Content-Type": "application/json",
    "X-Floor-Protocol": PROTOCOL,
    "Cache-Control": "no-store",
    ...extra,
  });
  if (!paid) headers.append("Set-Cookie", freeUsedCookie());
  return new Response(
    JSON.stringify({
      ok: true,
      item,
      settlement: "not_settled",
      next: paid ? "list" : "desk",
    }),
    { status: 201, headers },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET(request: Request) {
  return json(buildCatalog(new Date(), originFromRequest(request)), 200);
}

function replayListed(item: { owner?: { type?: string } } | undefined, sku: string, key: string) {
  if (!item || item.owner?.type === "house") return null;
  if (key) rememberListingIdempotency(key, sku);
  return listed(item, true);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        reason: "Send application/json with the product facts.",
        field: "body",
        skip: ["no body"],
      },
      400,
    );
  }

  const idempotencyKey = readIdempotencyKey(request, body);
  if (idempotencyKey) {
    const replay = listingByIdempotencyKey(idempotencyKey);
    if (replay) return listed(replay, true);
  }

  const normalized = normalizeListingInput(body);
  const title = typeof normalized.title === "string" ? normalized.title : "";
  const slug = title ? slugFromTitle(title) : "";
  if (slug) {
    const existing = findListing(slug);
    const replay = replayListed(existing, existing?.sku || slug, idempotencyKey);
    if (replay) return replay;
  }

  const access = listingAccess(request);
  if (!access.allowed) {
    return json(deskRequiredBody(), access.status ?? 402);
  }

  const result = validateListing(normalized, [...reservedIds(), ...listingIds()]);
  if (!result.ok) {
    if (result.existing_id) {
      const existing = findListing(result.existing_id);
      const replay = replayListed(existing, result.existing_id, idempotencyKey);
      if (replay) return replay;
    }
    return json(
      {
        ok: false,
        reason: result.reason,
        field: result.field,
        skip: result.skip,
      },
      400,
    );
  }

  const item = addListing(result.item);
  if (idempotencyKey) rememberListingIdempotency(idempotencyKey, item.sku);
  return listed(item, access.paid);
}
