import { corsHeaders, llmsTxt } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
