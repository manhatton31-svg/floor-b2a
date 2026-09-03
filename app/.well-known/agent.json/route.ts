import { agentDiscovery, corsHeaders } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(agentDiscovery(), {
    headers: {
      ...corsHeaders,
      "Cache-Control": "public, max-age=300",
    },
  });
}
