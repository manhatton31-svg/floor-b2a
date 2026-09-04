import type { ReactNode } from "react";
import { DESK_CTA, DESK_PRODUCT, HERO_IMAGE } from "@/lib/site";
import { SiteFooter } from "./site-footer";

export function Funnel({
  checkout,
  eyebrow,
  heading,
  children,
}: {
  checkout: string;
  eyebrow: string;
  heading: string;
  children?: ReactNode;
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
        List your first product free. Then a desk is $49 once for 12 months if
        you want more listings. <a href="/desk">List a product</a>.
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
          <p>$49 once, 12 months. That account is the desk. Not free.</p>
        </article>
        <article className="card">
          <p className="num">02</p>
          <h3>List a product</h3>
          <p>
            List your first product free on the{" "}
            <a href="/desk">seller account page</a>. Add a checkout link and/or
            a public x402 wallet, plus the facts bots need. Physical things
            need stock and a ship-from. Digital things need how the buyer gets
            them. Marketing talk does not count.
          </p>
        </article>
        <article className="card">
          <p className="num">03</p>
          <h3>Bots read the list</h3>
          <p>
            Complete listings can be bought at the checkout link or x402
            details on the listing. A buy settles when the agent pays that
            rail. Incomplete listings get skipped.
          </p>
        </article>
      </section>

      <section className="band">
        <p className="kicker">What you get</p>
        <h2>A seller account for 12 months.</h2>
        <p className="lede">
          You get 12 months of seller-account access from the day you pay. More
          listings and ongoing access. Access comes as a Whop membership. The
          first complete product is free on the{" "}
          <a href="/desk">seller account page</a>. The desk is still $49.
        </p>
      </section>

      <section className="band">
        <p className="kicker">What it is not</p>
        <h2>Not forever. The bot pays at checkout.</h2>
        <p className="lede">
          After 12 months it ends unless you buy again. The first listing is
          free. That is not a coupon and the desk is not $0. The $49 desk
          checkout is live. Other products settle when the buyer pays the
          checkout link or x402 rail the seller entered. FLOOR does not hold
          the money.
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

      {children}

      <SiteFooter />
    </main>
  );
}
