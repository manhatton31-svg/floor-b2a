import { mintVerifiedDeskToken, rememberWebhookId, seenWebhookId } from "@/lib/desk-token";
import { PROTOCOL } from "@/lib/site";
import { resolveWebhookGrant, verifyWhopSignature, whopWebhookSecret } from "@/lib/whop";

export const dynamic = "force-dynamic";

function plain(status: number, reason: string) {
  return new Response(reason, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
    },
  });
}

function json(status: number, data: unknown) {
  return Response.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Floor-Protocol": PROTOCOL,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const secret = whopWebhookSecret();
  if (!secret) {
    return plain(503, "WHOP_WEBHOOK_SECRET is not set. Unsigned webhooks are not accepted.");
  }

  const body = await request.text();
  const webhookId = request.headers.get("webhook-id") || "";
  const checked = verifyWhopSignature({
    secret,
    id: webhookId,
    timestamp: request.headers.get("webhook-timestamp") || "",
    signature: request.headers.get("webhook-signature") || "",
    body,
  });
  if (!checked.ok) return plain(401, checked.reason);

  if (seenWebhookId(webhookId)) {
    return json(200, { ok: true, reused: true, webhook_id: webhookId });
  }

  let event: unknown = {};
  try {
    event = JSON.parse(body);
  } catch {
    rememberWebhookId(webhookId);
    return json(200, { ok: true, ignored: true, reason: "Webhook body was not JSON." });
  }

  const grant = await resolveWebhookGrant(event);
  if (!grant.ok) {
    rememberWebhookId(webhookId);
    return json(200, { ok: true, ignored: true, reason: grant.reason });
  }

  const minted = mintVerifiedDeskToken(grant);
  rememberWebhookId(webhookId);
  return json(200, {
    ok: true,
    minted: !minted.reused,
    reused: minted.reused,
    membership_id: minted.membership_id,
    payment_id: minted.payment_id,
    settled: minted.settled,
    settlement: minted.settled ? "whop_paid" : "not_settled",
    cash: minted.cash,
  });
}
