import { corsHeaders, openApiYaml } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(openApiYaml(), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
