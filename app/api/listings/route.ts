import { freeUsedCookie } from "@/lib/desk-ack";
import { listingAccess } from "@/lib/listing-gate";
import { reservedIds } from "@/lib/catalog";
import { addListing, listingIds } from "@/lib/listing-store";
import { validateListing } from "@/lib/listing-validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = listingAccess(request.headers.get("cookie"));
  if (!access.allowed) {
    return Response.json({ ok: false, reason: access.reason }, { status: 401 });
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

  const result = validateListing(body as Record<string, unknown>, [
    ...reservedIds(),
    ...listingIds(),
  ]);
  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason }, { status: 400 });
  }

  const item = addListing(result.item);
  const headers = new Headers({ "Content-Type": "application/json" });
  if (!access.paid) headers.append("Set-Cookie", freeUsedCookie());

  return new Response(
    JSON.stringify({
      ok: true,
      item,
      settlement: "not_settled",
      next: access.paid ? "list" : "desk",
    }),
    { status: 200, headers },
  );
}
