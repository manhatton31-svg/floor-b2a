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
import { DESK_CHECKOUT, DESK_CTA, DESK_PRODUCT, thanksPublicUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR desk — thanks",
  description: "You have 12 months. List products at /desk. Not forever.",
};

type PageProps = {
  searchParams: Promise<{
    desk_token?: string | string[];
    token?: string | string[];
    payment_id?: string | string[];
    membership_id?: string | string[];
    receipt_id?: string | string[];
    code?: string | string[];
    once?: string;
    unknown?: string;
    unpaid?: string;
    why?: string;
  }>;
};

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim();
}

export default async function ThanksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const key of ["desk_token", "token", "payment_id", "membership_id", "receipt_id", "code"] as const) {
    const value = first(params[key]);
    if (value) q.set(key, value);
  }
  if ([...q.keys()].length) {
    redirect(`/api/desk/welcome?${q.toString()}`);
  }

  const jar = await cookies();
  const reveal = jar.get(DESK_REVEAL_COOKIE)?.value || "";
  const stored = jar.get(DESK_TOKEN_COOKIE)?.value || "";
  const paidCookie = jar.get(DESK_ACK_COOKIE)?.value === DESK_ACK_VALUE;
  const showOnce = params.once === "1" && reveal.startsWith("desk_") && hasDeskToken(reveal);
  const accepted = paidCookie || (stored.startsWith("desk_") && hasDeskToken(stored));
  const unpaid = params.unpaid === "1";
  const why = first(params.why);
  const returnUrl = thanksPublicUrl();
  const unlocked = accepted || showOnce;

  return (
    <main className="wrap">
      <p className="kicker">After checkout</p>
      <h1>{unpaid ? "Pay first." : "You have 12 months."}</h1>
      <p className="lede">
        A desk is $49 once for 12 months. Not forever. After 12 months it ends
        unless you buy again.
      </p>

      {params.unknown === "1" ? (
        <p className="fail" role="alert">
          That desk_token is not one this site issued. We did not mark you as
          paid.
        </p>
      ) : null}

      {unpaid ? (
        <>
          <p className="fail" role="alert">
            {why || "We could not confirm a paid desk membership."} Pay at
            checkout if you have not paid yet.
          </p>
          <p className="lede">
            Whop takes the $49. FLOOR (Christopher Hatton) is the seller.
          </p>
          <div className="row">
            <a className="cta" href={DESK_CHECKOUT}>
              {DESK_CTA}
            </a>
            <a className="ghost" href="/feedback">
              Feedback
            </a>
          </div>
        </>
      ) : unlocked ? (
        <>
          <p className="lede">
            This browser has a desk cookie. List products at{" "}
            <a href="/desk">/desk</a>. If you have not listed yet, the first
            complete product is still free.
          </p>
          {showOnce ? (
            <section className="ok" aria-live="polite">
              <p className="kicker">For agents</p>
              <h2>Copy this token once.</h2>
              <p className="lede">
                Send it as <code>Authorization: Bearer {"<desk_token>"}</code>.
                This page shows it once. Humans keep the seller cookie on /desk.
              </p>
              <pre>{reveal}</pre>
            </section>
          ) : null}
          <div className="row">
            <a className="cta" href="/desk">
              List at /desk
            </a>
            <a className="ghost" href="/feedback">
              Feedback
            </a>
          </div>
        </>
      ) : (
        <>
          <p className="lede">
            You have 12 months on Whop. If you just paid, open{" "}
            <a href="/desk">/desk</a> once access is active. Whop confirms the
            payment. Then this site unlocks the desk.
          </p>
          <p className="lede">
            Checkout may send you back here with a payment id. This page does
            not ask you to paste one.
          </p>
          <p className="lede">
            If you have not listed yet, the first complete product is still
            free.
          </p>
          <div className="row">
            <a className="cta" href="/desk">
              Open /desk
            </a>
            <a className="ghost" href="/feedback">
              Feedback
            </a>
          </div>
          <p className="lede">
            If you have not paid yet, a desk is $49 once for 12 months.{" "}
            <a href={DESK_CHECKOUT}>{DESK_CTA}</a>
          </p>
        </>
      )}

      <p className="price">{DESK_CTA}</p>
      <BuyerLinks paidCheckout={unlocked} showCheckout={unpaid} />

      <section className="band">
        <p className="kicker">Paid checkout</p>
        <h2>Where the $49 goes.</h2>
        <p className="lede">
          Product page: <a href={DESK_PRODUCT}>{DESK_PRODUCT}</a>
        </p>
        {unpaid ? (
          <p className="lede">
            Checkout: <a href={DESK_CHECKOUT}>{DESK_CHECKOUT}</a>
          </p>
        ) : null}
        <p className="lede">
          Whop checkout return URL: <a href={returnUrl}>{returnUrl}</a>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
