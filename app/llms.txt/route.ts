import { corsHeaders, llmsTxt } from "@/lib/discovery";
import { originFromRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return new Response(llmsTxt(originFromRequest(request)), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
