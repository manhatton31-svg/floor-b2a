import { addListing, listingIds } from "@/lib/listing-store";
import { hasDeskAck } from "@/lib/desk-ack";
import { validateListing } from "@/lib/listing-validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDeskAck(request.headers.get("cookie"))) {
    return Response.json(
      {
        ok: false,
        reason:
          "Pay $49 first, then list a product. This site cannot see the Whop payment. After you pay, open the seller account and continue.",
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        reason: "We could not read the product. Fill the form and try again.",
      },
      { status: 400 },
    );
  }

  const result = validateListing(body as Record<string, unknown>, listingIds());
  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason }, { status: 400 });
  }

  const item = addListing(result.item);
  return Response.json({
    ok: true,
    item,
    settlement: "not_settled",
  });
}
