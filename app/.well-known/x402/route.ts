import { corsHeaders, x402Discovery } from "@/lib/discovery";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET(request: Request) {
  return Response.json(x402Discovery(originFromRequest(request)), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
    },
  });
}
