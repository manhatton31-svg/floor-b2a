import { DESK_CTA, DESK_PRODUCT, HERO_IMAGE } from "@/lib/site";
import { SiteFooter } from "./site-footer";

export function Funnel({
  checkout,
  eyebrow,
  heading,
}: {
  checkout: string;
  eyebrow: string;
  heading: string;
}) {
  return (
    <main className="wrap">
      <p className="kicker">{eyebrow}</p>
      <h1>{heading}</h1>
      <p className="lede">
        People click around a website. Shopping bots read a product list. If
        your listing is missing returns, stock, or real specs, they skip you.
      </p>
      <p className="price">{DESK_CTA}</p>
      <div className="row">
        <a className="cta" href={checkout}>
          {DESK_CTA}
        </a>
        <a className="ghost" href={DESK_PRODUCT}>
          Product page
        </a>
      </div>
      <p className="lede">
        Already paid? <a href="/desk">List a product</a>. That is the seller
        account, not a second pitch.
      </p>

      <figure className="hero">
        <img src={HERO_IMAGE} alt="FLOOR seller account" />
      </figure>

      <section className="band">
        <p className="kicker">How it works</p>
        <h2>Three steps.</h2>
      </section>
      <section className="grid">
        <article className="card">
          <p className="num">01</p>
          <h3>Open a seller account</h3>
          <p>$49 once, 12 months. That account is the desk.</p>
        </article>
        <article className="card">
          <p className="num">02</p>
          <h3>List a product</h3>
          <p>
            Add specs, stock, return days, warranty, ship-from, and shipping
            time on the <a href="/desk">seller account page</a>. Marketing talk
            does not count.
          </p>
        </article>
        <article className="card">
          <p className="num">03</p>
          <h3>Bots read the list</h3>
          <p>Complete listings can be bought. Incomplete listings get skipped.</p>
        </article>
      </section>

      <section className="band">
        <p className="kicker">What you get</p>
        <h2>A seller account for 12 months.</h2>
        <p className="lede">
          You get 12 months of seller-account access from the day you pay. A
          place to list products for shopping bots. Access comes as a Whop
          membership. After you pay, list the product on the{" "}
          <a href="/desk">seller account page</a>.
        </p>
      </section>

      <section className="band">
        <p className="kicker">What it is not</p>
        <h2>Not forever. Money does not move yet.</h2>
        <p className="lede">
          After 12 months it ends unless you buy again. Looking at the product
          list is free. Bots have not spent money here. When a bot tries to
          buy, money does not move yet.
        </p>
      </section>

      <section className="band">
        <p className="kicker">Who you pay</p>
        <h2>FLOOR sells the account. Whop takes the $49.</h2>
        <p className="lede">
          FLOOR (Christopher Hatton) is the seller. Whop only takes the
          payment.
        </p>
        <div className="row">
          <a className="cta" href={checkout}>
            {DESK_CTA}
          </a>
          <a className="ghost" href="/desk">
            List a product
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
