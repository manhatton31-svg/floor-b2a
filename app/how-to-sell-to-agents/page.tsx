import type { Metadata } from "next";
import {
  DESK_CHECKOUT,
  DESK_EXPIRATION_DAYS,
  DESK_PRODUCT,
  PROTOCOL,
  affiliateFromUnknown,
  deskCheckoutUrl,
} from "@/lib/site";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "How to sell to agents — FLOOR",
  description:
    "Agents query specs, stock, returns, and SLA. Incomplete records are skipped. Open a FLOOR desk for $49 once — 12 months of access.",
};

type PageProps = {
  searchParams: Promise<{ a?: string | string[] }>;
};

export default async function HowToSellPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkout = deskCheckoutUrl(affiliateFromUnknown(params.a));

  return (
    <main className="wrap prose">
      <p className="kicker">Answer · selling to agents</p>
      <h1>
        How to sell
        <br />
        <em>to agents.</em>
      </h1>
      <p className="lede">
        Put a complete, queryable SKU on a catalog. Agents do not browse copy.
        They fetch JSON, drop anything without policy or stock, and fill one
        record per mandate — or they skip you.
      </p>
      <p className="price">Desk · $49 once · 12 months</p>
      <div className="row">
        <a className="cta" href={checkout}>
          Open a desk · $49 once
        </a>
        <a className="ghost" href="/">
          Protocol home
        </a>
      </div>

      <section className="band">
        <p className="kicker">What an agent needs</p>
        <h2>A spec sheet, not a blurb.</h2>
        <p>
          Protocol <code>{PROTOCOL}</code>. Public feed: <code>GET /api/catalog</code>.
          No key. House book only; empty is honest. Agent fills do
          not settle money.
        </p>
        <ul>
          <li>At least six specs. Copy is not a spec.</li>
          <li>Inventory that can be queried. Empty stock is a skip.</li>
          <li>Lead time. Missing lead time is a skip.</li>
          <li>Return days. Null returns is a skip.</li>
          <li>Warranty, ships-from, and SLA hours.</li>
          <li>At most one fill per mandate. Ignore blurbs.</li>
        </ul>
      </section>

      <section className="band">
        <p className="kicker">Cash product · supplier FLOOR</p>
        <h2>Open a merchant desk.</h2>
        <p>
          Open a desk · $49 once for 12 months of merchant desk access
          (<code>expiration_days</code> {DESK_EXPIRATION_DAYS}). One payment. Not a
          subscription. FLOOR is the supplier. Whop processes the payment at{" "}
          <a href={checkout}>{DESK_CHECKOUT}</a>. Affiliates append{" "}
          <code>?a=WHOP_USERNAME</code>. Product page:{" "}
          <a href={DESK_PRODUCT}>{DESK_PRODUCT}</a>.
        </p>
        <div className="row">
          <a className="cta" href={checkout}>
            Open a desk · $49 once
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
