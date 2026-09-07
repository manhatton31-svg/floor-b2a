import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildCatalog } from "@/lib/catalog";
import {
  DESK_ACK_COOKIE,
  DESK_ACK_VALUE,
  DESK_TOKEN_COOKIE,
  FREE_USED_COOKIE,
  FREE_USED_VALUE,
} from "@/lib/desk-ack";
import { hasDeskToken } from "@/lib/desk-token";
import { DESK_CHECKOUT, DESK_CTA, DESK_PRODUCT } from "@/lib/site";
import { BuyerLinks } from "../components/buyer-links";
import { SiteFooter } from "../components/site-footer";
import { DeskForm } from "./desk-form";
import { HowBotsPay } from "./how-bots-pay";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR desk — $49 once for 12 months",
  description:
    "List your first product free. A desk is $49 once for 12 months. Not forever.",
};

export default async function DeskPage() {
  const jar = await cookies();
  const stored = jar.get(DESK_TOKEN_COOKIE)?.value || "";
  const paid =
    jar.get(DESK_ACK_COOKIE)?.value === DESK_ACK_VALUE ||
    (stored.startsWith("desk_") && hasDeskToken(stored));
  const usedFree = jar.get(FREE_USED_COOKIE)?.value === FREE_USED_VALUE;
  const allowSubmit = paid || !usedFree;
  const catalog = await buildCatalog();

  return (
    <main className="wrap">
      <p className="kicker">Seller account</p>
      <h1>The desk.</h1>
      <p className="lede">
        {paid
          ? "You can list more. This cookie or token is how the site knows. It is not a sales number."
          : "List your first product free."}
      </p>
      <p className="lede">
        One complete product goes on the public list. No coupon. The desk is
        still $49 once for 12 months if you want more listings. The bot pays
        at the listing’s checkout link or x402 details.
      </p>
      <p className="price">{DESK_CTA}</p>
      <div className="row">
        <a className="cta" href={DESK_CHECKOUT}>
          {DESK_CTA}
        </a>
        <a className="ghost" href={DESK_PRODUCT}>
          Product page
        </a>
      </div>
      <p className="lede">
        Checkout: <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>
      </p>

      <HowBotsPay />

      <section className="band">
        <p className="kicker">Around the desk</p>
        <h2>Catalog, agents, feedback.</h2>
        <BuyerLinks paidCheckout={paid} />
      </section>

      {allowSubmit ? (
        <DeskForm initialItems={catalog.items} paid={paid} />
      ) : (
        <>
          <section className="band">
            <p className="kicker">Next listing</p>
            <h2>Further listings need a desk.</h2>
            <p className="lede">
              Your first product is on the list. Open a desk. $49 once for 12
              months if you want to list more. Paid desks unlock after Whop
              confirms. Then this page keeps the listing form.
            </p>
            <p className="lede">
              Checkout: <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>
            </p>
            <div className="row">
              <a className="cta" href={DESK_CHECKOUT}>
                {DESK_CTA}
              </a>
              <a className="ghost" href="/feedback">
                Feedback
              </a>
            </div>
          </section>
          <DeskForm initialItems={catalog.items} paid={false} showForm={false} />
        </>
      )}

      <SiteFooter />
    </main>
  );
}
