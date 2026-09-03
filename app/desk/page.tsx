import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildCatalog } from "@/lib/catalog";
import { DESK_ACK_COOKIE, DESK_ACK_VALUE } from "@/lib/desk-ack";
import { DESK_CHECKOUT, DESK_CTA, DESK_PRODUCT } from "@/lib/site";
import { SiteFooter } from "../components/site-footer";
import { DeskForm } from "./desk-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR desk — $49 once for 12 months",
  description:
    "List one product for shopping bots. $49 once for 12 months. Not forever.",
};

export default async function DeskPage() {
  const jar = await cookies();
  const canList = jar.get(DESK_ACK_COOKIE)?.value === DESK_ACK_VALUE;
  const catalog = buildCatalog();

  return (
    <main className="wrap">
      <p className="kicker">Seller account</p>
      <h1>The desk.</h1>
      <p className="lede">
        A desk is a seller account. You pay $49 once. You get 12 months. Then
        you list a product so shopping bots can read it.
      </p>

      {canList ? (
        <>
          <p className="lede">
            This site cannot see the Whop payment. You said you already paid.
            List one complete product below.
          </p>
          <DeskForm initialItems={catalog.items} />
        </>
      ) : (
        <>
          <p className="lede">
            After you pay, come back here. Write the product facts. Submit.
            Bots read the public list. A bot buy does not take money yet.
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
          <section className="band">
            <p className="kicker">Already paid?</p>
            <h2>This site cannot see the payment.</h2>
            <p className="lede">
              Whop takes the $49. If you already paid, continue and list a
              product. We do not check Whop from this page.
            </p>
            <form action="/desk/ack" method="post">
              <div className="row">
                <button className="cta" type="submit">
                  I paid $49 · list a product
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      <SiteFooter />
    </main>
  );
}
