import type { CatalogItem } from "@/lib/catalog";
import { listingStockLine } from "@/lib/listing-page";

export function ListingFacts({ item }: { item: CatalogItem }) {
  const checkout = item.payment.checkout_url || item.checkout;
  const accepts = item.payment.accepts ?? [];

  return (
    <>
      <p className="lede">
        {item.kind === "digital" ? "Digital" : "Physical"} · {listingStockLine(item)}
      </p>
      {item.price ? <p className="price">{item.price}</p> : null}

      <section className="band">
        <p className="kicker">Owner</p>
        <h2>{item.owner.name}</h2>
        <p className="lede">
          {item.owner.type === "house"
            ? "FLOOR is the seller. Whop takes the $49 desk payment."
            : "Listed from a FLOOR desk. The bot pays this seller’s checkout or x402 rail."}
        </p>
      </section>

      <section className="band">
        <p className="kicker">Specs</p>
        <h2>Facts on the list.</h2>
        <ul className="catalog">
          {item.specs.map((spec) => (
            <li key={`${spec.name}-${spec.value}`}>
              <strong>{spec.name}</strong>
              <span>{spec.value}</span>
            </li>
          ))}
          <li>
            <strong>Lead time</strong>
            <span>{item.lead_time}</span>
          </li>
          <li>
            <strong>{item.kind === "digital" ? "Refund days" : "Return days"}</strong>
            <span>{String(item.return_days)}</span>
          </li>
          <li>
            <strong>Warranty</strong>
            <span>{item.warranty}</span>
          </li>
        </ul>
      </section>

      <section className="band">
        <p className="kicker">How to pay</p>
        <h2>Checkout and x402.</h2>
        <p className="lede">
          A buy settles when the agent pays this checkout or x402 rail. FLOOR
          does not mark that sale as settled. Catalog settlement stays
          not_settled.
        </p>
        {checkout ? (
          <p className="lede">
            Checkout: <a href={checkout}>{checkout}</a>
          </p>
        ) : (
          <p className="lede">No https checkout link on this listing.</p>
        )}
        {accepts.length > 0 ? (
          <ul className="catalog">
            {accepts.map((row) => (
              <li key={`${row.network}-${row.payTo}`}>
                <strong>
                  x402 {row.network} · USDC {row.maxAmountRequired}
                </strong>
                <span>
                  payTo {row.payTo} · asset {row.asset}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lede">No x402 accept on this listing.</p>
        )}
        <div className="row">
          {checkout ? (
            <a className="cta" href={checkout}>
              Pay at checkout
            </a>
          ) : null}
          <a className="ghost" href={`/pay/${item.sku}`}>
            GET /pay/{item.sku}
          </a>
        </div>
      </section>
    </>
  );
}
