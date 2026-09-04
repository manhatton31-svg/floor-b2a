import { DESK_CHECKOUT, DESK_PRODUCT } from "@/lib/site";

export function BuyerLinks({
  paidCheckout = false,
}: {
  paidCheckout?: boolean;
}) {
  return (
    <div className="row">
      <a className="ghost" href="/desk">
        Desk
      </a>
      <a className="ghost" href="/api/catalog">
        Catalog
      </a>
      <a className="ghost" href="/for-agents">
        For agents
      </a>
      <a className="ghost" href="/feedback">
        Feedback
      </a>
      <a className="ghost" href={DESK_CHECKOUT}>
        {paidCheckout ? "Checkout (already paid)" : "Checkout"}
      </a>
      <a className="ghost" href={DESK_PRODUCT}>
        Product page
      </a>
    </div>
  );
}
