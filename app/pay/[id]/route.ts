import { findCatalogItem } from "@/lib/catalog";
import {
  expandPayment,
  paymentChallengeBody,
  paymentRequiredHeader,
} from "@/lib/payment";
import { corsHeaders } from "@/lib/discovery";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

type PayContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: PayContext) {
  const { id } = await context.params;
  const item = findCatalogItem(id);
  if (!item) {
    return Response.json({ ok: false, reason: "That product is not on the list." }, { status: 404, headers: corsHeaders });
  }

  const origin = originFromRequest(request);
  const payment = expandPayment(item.payment, origin);
  const body = paymentChallengeBody({ payment });

  return Response.json(body, {
    status: 402,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "PAYMENT-REQUIRED": paymentRequiredHeader({
        origin,
        id,
        title: item.title,
        payment,
        error: body.error,
      }),
    },
  });
}
