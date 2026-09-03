import { buildCatalog } from "@/lib/catalog";
import { corsHeaders } from "@/lib/discovery";
import { PROTOCOL } from "@/lib/site";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  return Response.json(buildCatalog(), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
    },
  });
}
