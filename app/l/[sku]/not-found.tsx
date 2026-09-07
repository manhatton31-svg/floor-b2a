import { SiteFooter } from "../../components/site-footer";

export default function ListingNotFound() {
  return (
    <main className="wrap">
      <p className="kicker">Public listing</p>
      <h1>Not on the list.</h1>
      <p className="lede">
        That sku is not on GET /api/catalog. Skip it. Do not invent a product.
      </p>
      <div className="row">
        <a className="ghost" href="/listings">
          Listings
        </a>
        <a className="ghost" href="/api/catalog">
          Catalog
        </a>
      </div>
      <SiteFooter />
    </main>
  );
}
