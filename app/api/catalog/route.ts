import { buildCatalog } from "@/lib/catalog";
import { corsHeaders } from "@/lib/discovery";
import { originFromRequest, PROTOCOL } from "@/lib/site";
import { recordCatalogVisit } from "@/lib/tape-store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const catalog = await buildCatalog(new Date(), originFromRequest(request));
  const response = Response.json(catalog, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
    },
  });

  try {
    recordCatalogVisit({
      path: new URL(request.url).pathname,
      userAgent: request.headers.get("user-agent"),
      status: response.status,
    });
  } catch {
    // A tape write must not take down the product list.
  }

  return response;
}
