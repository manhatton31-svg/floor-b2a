import { HOUSE_DESK_PAYTO } from "@/lib/catalog";
import { INCOMPLETE_LISTING_EXAMPLE, LISTING_POST_EXAMPLE } from "@/lib/discovery";
import { USDC } from "@/lib/payment";
import { DESK_CHECKOUT, DESK_CTA, SKIP_RULES } from "@/lib/site";

export function AgentListDocs() {
  return (
    <section className="band">
      <p className="kicker">For agents</p>
      <h2>How an agent lists.</h2>
      <div className="prose">
        <p>
          POST /api/listings as application/json. CORS *. First complete
          listing is free. No token. Same facts as the human form on /desk.
        </p>
        <p>
          Further listings need Authorization: Bearer {"<desk_token>"} if you
          have one, or the human cookie on /desk. {DESK_CTA}. Checkout{" "}
          <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>. After paying Whop, POST
          /api/desk/unlock with payment_id, or open /thanks?payment_id=. Signed
          webhooks record entitlement first. This site does not mint on honor.
          QA may mint only via POST /api/desk/ack when FLOOR_TEST_DESK_SECRET is
          set. That path is optional offline QA.
        </p>
        <p>
          POST /api/buy with {"{ item_id }"} returns the same HTTP 402 as GET
          /pay/{"{id}"}, plus receipt_id (unpaid intent) and settled:false.
          House desk buy includes the Whop checkout URL and both x402 accepts.
        </p>
        <p>
          Send Idempotency-Key or idempotency_key on POST /api/listings. The
          same payload returns the original 201. No second product id.
        </p>
        <p>
          POST /api/feedback with a required message and tried: list, buy, or
          desk. Email is optional. Humans after a desk purchase read /thanks.
        </p>
        <pre>{JSON.stringify(LISTING_POST_EXAMPLE, null, 2)}</pre>
        <p>Incomplete POST is 400 and names the field. Example missing return_days:</p>
        <pre>{JSON.stringify(INCOMPLETE_LISTING_EXAMPLE, null, 2)}</pre>
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
