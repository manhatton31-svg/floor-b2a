import { findCatalogItem } from "@/lib/catalog";
import { addReceipt, findBuy } from "@/lib/buy-store";
import { corsHeaders } from "@/lib/discovery";
import { readIdempotencyKey } from "@/lib/listing-gate";
import { expandPayment, paymentChallengeBody, paymentRequiredHeader } from "@/lib/payment";
import { originFromRequest, PROTOCOL } from "@/lib/site";

export const dynamic = "force-dynamic";

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, reason: "Send application/json.", field: "body", skip: ["no body"] },
      { status: 400, headers: corsHeaders },
    );
  }

  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const item_id = asText(input.item_id || input.id || input.sku);
  if (!item_id) {
    return Response.json(
      { ok: false, reason: "Say which item. Send item_id.", field: "item_id", skip: ["no item_id"] },
      { status: 400, headers: corsHeaders },
    );
  }

  const item = findCatalogItem(item_id);
  if (!item) {
    return Response.json(
      { ok: false, reason: "That product is not on the list.", field: "item_id", skip: ["no item"] },
      { status: 404, headers: corsHeaders },
    );
  }

  const origin = originFromRequest(request);
  const payment = expandPayment(item.payment, origin);
  if (!payment.checkout_url && !payment.accepts?.length) {
    return Response.json(
      {
        ok: false,
        reason: "This listing has no pay rail, so it is not buyable.",
        field: "payment",
        skip: ["no payment"],
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const payer = asText(input.payer) || "anonymous";
  const idempotency_key = readIdempotencyKey(request, body);
  const prior = findBuy(item_id, payer, idempotency_key);
  const receipt =
    prior ||
    addReceipt({
      item_id,
      quantity: 1,
      settled: false,
      payer,
      idempotency_key,
    });

  const challenge = paymentChallengeBody({
    payment,
    extra: {
      receipt_id: receipt.receipt_id,
      item_id,
      settled: false,
    },
  });

  return Response.json(challenge, {
    status: 402,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
      "PAYMENT-REQUIRED": paymentRequiredHeader({
        origin,
        id: item_id,
        title: item.title,
        payment,
        error: challenge.error,
      }),
    },
  });
}
