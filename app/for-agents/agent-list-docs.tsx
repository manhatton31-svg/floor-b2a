import { HOUSE_DESK_PAYTO } from "@/lib/catalog";
import { LISTING_POST_EXAMPLE } from "@/lib/discovery";
import { USDC } from "@/lib/payment";
import { DESK_CHECKOUT, DESK_CTA, SKIP_RULES } from "@/lib/site";

export function AgentListDocs() {
  return (
    <section className="band">
      <p className="kicker">For agents</p>
      <h2>How an agent lists.</h2>
      <div className="prose">
        <p>
          POST /api/listings as application/json. CORS *. No login for the
          first complete listing. Same facts as the human form on /desk.
        </p>
        <p>
          First complete listing is free. Send cookies back. Further listings
          return HTTP 402 with plain JSON: {DESK_CTA}. Checkout{" "}
          <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>. This site cannot see
          the Whop payment.
        </p>
        <p>
          GET /api/listings or GET /api/catalog returns the items, including
          payment.accepts. Incomplete POST returns 400 with a plain-English
          reason.
        </p>
        <pre>{JSON.stringify(LISTING_POST_EXAMPLE, null, 2)}</pre>
        <p>Skip if any of these are missing:</p>
        <ul>
          {SKIP_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p>
          x402 public fields only: network (base or solana), payTo (receive
          address), price in US dollars. Never send a seed, private key,
          password, or Stripe sk_live.
        </p>
        <p>
          FLOOR house desk: Whop checkout {DESK_CHECKOUT}. x402 $49 USDC —
          Base payTo {HOUSE_DESK_PAYTO.base} asset {USDC.base.asset}. Solana
          payTo {HOUSE_DESK_PAYTO.solana} asset {USDC.solana.asset}.
        </p>
      </div>
    </section>
  );
}
