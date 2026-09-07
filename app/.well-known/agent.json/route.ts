import { agentDiscovery, corsHeaders } from "@/lib/discovery";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(agentDiscovery(originFromRequest(request)), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
    },
  });
}
