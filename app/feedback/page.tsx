import type { Metadata } from "next";
import { BuyerLinks } from "../components/buyer-links";
import { SiteFooter } from "../components/site-footer";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "FLOOR feedback",
  description: "Tell FLOOR what you tried. List, buy, or desk.",
};

export default function FeedbackPage() {
  return (
    <main className="wrap">
      <p className="kicker">Feedback</p>
      <h1>Tell us what you tried.</h1>
      <p className="lede">
        Email is optional. Say what happened when you listed, bought, or opened
        a desk. This is not a payment and does not invent a sale.
      </p>
      <FeedbackForm />
      <BuyerLinks />
      <SiteFooter />
    </main>
  );
}
