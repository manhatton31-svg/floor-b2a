import { buildCatalog } from "@/lib/catalog";
import { corsHeaders } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  return Response.json(buildCatalog(), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=30",
    },
  });
}
