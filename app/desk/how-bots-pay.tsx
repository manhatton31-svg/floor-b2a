export const CHECKOUT_HINT =
  "Easiest: paste an https checkout URL. Whop, Stripe Payment Link, or PayPal.";
export const X402_HINT =
  "Public USDC receive address on Base or Solana, plus the network and the price. That address is the only credential.";
export const SECRET_HINT =
  "Never enter a seed, private key, password, or Stripe sk_live.";

export function HowBotsPay() {
  return (
    <section className="band">
      <p className="kicker">Pay</p>
      <h2>How bots pay you.</h2>
      <div className="prose">
        <p>{CHECKOUT_HINT}</p>
        <p>
          {X402_HINT} {SECRET_HINT}
        </p>
        <p>
          A listing needs a checkout URL and/or those x402 details. The bot
          pays there. This site does not take the money.
        </p>
      </div>
    </section>
  );
}
