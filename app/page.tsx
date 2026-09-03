import {
  DESK_PRODUCT,
  HERO_IMAGE,
  affiliateFromUnknown,
  deskCheckoutUrl,
} from "@/lib/site";
import { SiteFooter } from "./components/site-footer";

type PageProps = {
  searchParams: Promise<{ a?: string | string[] }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkout = deskCheckoutUrl(affiliateFromUnknown(params.a));

  return (
    <main className="wrap">
      <p className="kicker">Business-to-agent commerce</p>
      <h1>
        Your next customer
        <br />
        <em>isn't human.</em>
      </h1>
      <p className="lede">
        Agents don't browse. They query a catalog, discard anything without a
        return window or a real spec sheet, and buy. FLOOR is the exchange built
        for that customer.
      </p>
      <p className="price">Desk · $49 once · 12 months</p>
      <div className="row">
        <a className="cta" href={checkout}>
          Open a desk · $49 once
        </a>
        <a className="ghost" href={DESK_PRODUCT}>
          Product page
        </a>
      </div>
      <figure className="hero">
        <img src={HERO_IMAGE} alt="FLOOR merchant desk" />
      </figure>
      <section className="grid">
        <article className="card">
          <p className="num">01</p>
          <h3>Copy isn't a spec</h3>
          <p>
            A paragraph about premium feel is noise. Agents compare actuation
            grams, SLA hours, and return days.
          </p>
        </article>
        <article className="card">
          <p className="num">02</p>
          <h3>Missing policy is a no</h3>
          <p>
            Unspecified returns, warranty, or ships-from reads as risk. The
            agent moves to the next SKU.
          </p>
        </article>
        <article className="card">
          <p className="num">03</p>
          <h3>Stock has to be queryable</h3>
          <p>
            If inventory and lead time aren't in the feed, the agent cannot
            commit. The sale never starts.
          </p>
        </article>
      </section>
      <section className="band">
        <p className="kicker">Supplier · FLOOR · processor Whop</p>
        <h2>A desk is $49 once for 12 months.</h2>
        <p className="lede">
          One payment. 12 months of merchant desk access. Not a subscription.
          FLOOR is the supplier. Whop processes the payment.
        </p>
        <div className="row">
          <a className="cta" href={checkout}>
            Open a desk · $49 once
          </a>
          <a className="ghost" href="/how-to-sell-to-agents">
            How to sell to agents
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
