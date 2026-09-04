import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BuyerLinks } from "../components/buyer-links";
import { SiteFooter } from "../components/site-footer";
import {
  DESK_ACK_COOKIE,
  DESK_ACK_VALUE,
  DESK_REVEAL_COOKIE,
  DESK_TOKEN_COOKIE,
} from "@/lib/desk-ack";
import { hasDeskToken } from "@/lib/desk-token";
import { DESK_CHECKOUT, DESK_CTA, DESK_PRODUCT } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR desk — thanks",
  description: "You have 12 months. List products at /desk. Not forever.",
};

type PageProps = {
  searchParams: Promise<{ desk_token?: string | string[]; token?: string | string[]; once?: string; unknown?: string }>;
};

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim();
}

export default async function ThanksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const incoming = first(params.desk_token) || first(params.token);
  if (incoming) {
    redirect(`/api/desk/welcome?desk_token=${encodeURIComponent(incoming)}`);
  }

  const jar = await cookies();
  const reveal = jar.get(DESK_REVEAL_COOKIE)?.value || "";
  const stored = jar.get(DESK_TOKEN_COOKIE)?.value || "";
  const paidCookie = jar.get(DESK_ACK_COOKIE)?.value === DESK_ACK_VALUE;
  const showOnce = params.once === "1" && reveal.startsWith("desk_") && hasDeskToken(reveal);
  const accepted = paidCookie || (stored.startsWith("desk_") && hasDeskToken(stored));

  return (
    <main className="wrap">
      <p className="kicker">After checkout</p>
      <h1>You have 12 months.</h1>
      <p className="lede">
        List products at <a href="/desk">/desk</a>. A desk is $49 once for 12
        months. Not forever.
      </p>
      <p className="lede">
        If you already used the first free product, the next listing needs this
        desk. If you have not listed yet, the first complete product is still
        free.
      </p>
      <p className="lede">
        This site cannot see the Whop payment. Landing here does not invent a
        sale and does not mint a desk_token. After a real rail confirms, a
        token can be accepted from <code>?desk_token=</code> or a desk cookie.
      </p>
      <p className="price">{DESK_CTA}</p>

      {params.unknown === "1" ? (
        <p className="fail" role="alert">
          That desk_token is not one this site issued. We did not mark you as
          paid.
        </p>
      ) : null}

      {showOnce ? (
        <section className="ok" aria-live="polite">
          <p className="kicker">For agents</p>
          <h2>Copy this token once.</h2>
          <p className="lede">
            Send it as <code>Authorization: Bearer {"<desk_token>"}</code>. This
            page shows it once. Humans keep the seller cookie on /desk.
          </p>
          <pre>{reveal}</pre>
        </section>
      ) : accepted ? (
        <p className="lede">
          This browser has a desk cookie. You can list more at /desk. Agents
          use the Bearer token if they saved it.
        </p>
      ) : (
        <p className="lede">
          No verified desk cookie is set. Pay at checkout, then come back. QA
          can mint a test token only with <code>FLOOR_TEST_DESK_SECRET</code> at
          POST /api/desk/ack. That path is not a sale.
        </p>
      )}

      <BuyerLinks paidCheckout />

      <section className="band">
        <p className="kicker">Paid checkout</p>
        <h2>Where you paid.</h2>
        <p className="lede">
          Checkout (already paid): <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>
        </p>
        <p className="lede">
          Product page: <a href={DESK_PRODUCT}>{DESK_PRODUCT}</a>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
