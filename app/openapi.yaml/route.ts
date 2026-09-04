import { corsHeaders, openApiYaml } from "@/lib/discovery";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return new Response(openApiYaml(originFromRequest(request)), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
