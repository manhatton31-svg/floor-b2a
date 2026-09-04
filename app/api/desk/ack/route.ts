import { corsHeaders } from "@/lib/discovery";
import { deskAckCookie, deskRevealCookie, deskTokenCookie } from "@/lib/desk-ack";
import {
  mintTestDeskToken,
  testDeskSecretConfigured,
  testDeskSecretMatches,
} from "@/lib/desk-token";
import { PROTOCOL } from "@/lib/site";

export const dynamic = "force-dynamic";

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function json(data: unknown, status: number, extra?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  if (!testDeskSecretConfigured()) {
    return json(
      {
        ok: false,
        reason:
          "Test desk mint is off. This site cannot verify Whop membership, so it does not issue a desk_token. Set FLOOR_TEST_DESK_SECRET to enable the QA path only.",
        field: "secret",
        skip: ["no test secret"],
        settled: false,
        settlement: "not_settled",
      },
      404,
    );
  }

  let body: unknown = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    body = { secret: form.get("secret") };
  }

  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const secret =
    asText(input.secret) ||
    request.headers.get("x-floor-test-desk-secret")?.trim() ||
    "";

  if (!testDeskSecretMatches(secret)) {
    return json(
      {
        ok: false,
        reason: "That test secret is wrong.",
        field: "secret",
        skip: ["bad test secret"],
        settled: false,
        settlement: "not_settled",
      },
      403,
    );
  }

  const desk_token = mintTestDeskToken("floor-desk");
  const headers = new Headers();
  headers.append("Set-Cookie", deskAckCookie());
  headers.append("Set-Cookie", deskTokenCookie(desk_token));
  headers.append("Set-Cookie", deskRevealCookie(desk_token));

  return json(
    {
      ok: true,
      test: true,
      settled: false,
      settlement: "not_settled",
      desk_token,
      cookie: "floor_desk_ack",
      authorization: `Bearer ${desk_token}`,
      thanks: "/thanks",
      note: "QA test path only. This is not a verified Whop payment. Do not invent a sale.",
    },
    201,
    headers,
  );
}
