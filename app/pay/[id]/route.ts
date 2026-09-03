import { findCatalogItem } from "@/lib/catalog";
import {
  expandPayment,
  hasPaymentSignature,
  paymentRequiredHeader,
  X402_SPEC,
} from "@/lib/payment";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

type PayContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: PayContext) {
  const { id } = await context.params;
  const item = findCatalogItem(id);
  if (!item) {
    return Response.json({ ok: false, reason: "That product is not on the list." }, { status: 404 });
  }

  const origin = originFromRequest(request);
  const payment = expandPayment(item.payment, origin);
  const signed = hasPaymentSignature(request);
  const error = signed
    ? "This site does not settle x402 and does not hold funds. Pay at checkout_url or use a public facilitator. See https://x402.org/"
    : payment.accepts?.length
      ? "Payment required. Pay at checkout_url or retry with a PAYMENT-SIGNATURE after a public facilitator."
      : "Payment required. Pay at checkout_url.";

  const body = {
    x402Version: 1,
    accepts: payment.accepts ?? [],
    checkout_url: payment.checkout_url,
    error,
    spec: X402_SPEC,
    settlement: "not_settled",
  };

  return Response.json(body, {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "PAYMENT-REQUIRED": paymentRequiredHeader({
        origin,
        id,
        title: item.title,
        payment,
        error,
      }),
    },
  });
}
