import { corsHeaders } from "@/lib/discovery";
import { addFeedback } from "@/lib/feedback-store";
import { validateFeedback } from "@/lib/feedback";
import { PROTOCOL } from "@/lib/site";

export const dynamic = "force-dynamic";

function json(data: unknown, status: number) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        reason: "Send application/json with a message.",
        field: "body",
        skip: ["no body"],
      },
      400,
    );
  }

  const result = validateFeedback(body);
  if (!result.ok) {
    return json(result, 400);
  }

  const row = addFeedback(result.row);
  return json(
    {
      ok: true,
      id: row.id,
      tried: row.tried,
    },
    201,
  );
}
