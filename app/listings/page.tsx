import type { Metadata } from "next";
import { buildCatalog } from "@/lib/catalog";
import { listingStockLine } from "@/lib/listing-page";
import { siteOrigin } from "@/lib/site";
import { SiteFooter } from "../components/site-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR listings",
  description: "Products on the FLOOR catalog. Same items as GET /api/catalog.",
};

export default async function ListingsIndexPage() {
  const origin = await siteOrigin();
  const catalog = await buildCatalog(new Date(), origin);

  return (
    <main className="wrap">
      <p className="kicker">Public list</p>
      <h1>Listings.</h1>
      <p className="lede">
        These are the products on <a href="/api/catalog">GET /api/catalog</a>.
        House desk is included. No ranks. Each page is <code>/l/{"{sku}"}</code>.
      </p>

      <section className="band">
        <p className="kicker">Catalog items</p>
        <h2>What is on the list.</h2>
        {catalog.items.length === 0 ? (
          <p className="lede">Nothing on the list yet. Empty is honest.</p>
        ) : (
          <ul className="catalog">
            {catalog.items.map((item) => (
              <li key={item.sku}>
                <strong>
                  <a href={`/l/${item.sku}`}>{item.title}</a>
                </strong>
                <span>
                  {item.sku} · {item.kind} · {listingStockLine(item)}
                  {item.price ? ` · ${item.price}` : ""} · {item.owner.name}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="row">
          <a className="ghost" href="/api/catalog">
            Catalog JSON
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
