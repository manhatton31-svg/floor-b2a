import { mintVerifiedDeskToken, recordEntitlement, rememberWebhookId, seenWebhookId } from "./desk-token.ts";
import { PROTOCOL } from "./site.ts";
import { resolveWebhookGrant, verifyWhopSignature, whopWebhookSecret } from "./whop.ts";

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

/** Signed Whop webhook. Persist entitlement, then mint so later unlock can reuse the same desk_token. */
export async function handleWhopWebhook(request: Request): Promise<Response> {
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

  const entitlement = recordEntitlement(grant);
  const minted = mintVerifiedDeskToken(grant);
  rememberWebhookId(webhookId);
  return json(200, {
    ok: true,
    recorded: Boolean(entitlement),
    minted: !minted.reused,
    reused: minted.reused,
    membership_id: minted.membership_id || entitlement?.membership_id,
    payment_id: minted.payment_id || entitlement?.payment_id,
    plan: entitlement?.plan,
    settled: minted.settled,
    settlement: minted.settled ? "whop_paid" : "not_settled",
    cash: minted.cash,
  });
}
