import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildCatalog } from "@/lib/catalog";
import { embedCatalogItemJson, safeListingSku } from "@/lib/listing-page";
import { siteOrigin } from "@/lib/site";
import { ListingFacts } from "../../components/listing-facts";
import { SiteFooter } from "../../components/site-footer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ sku: string }>;
};

async function catalogItem(sku: string) {
  const origin = await siteOrigin();
  const catalog = await buildCatalog(new Date(), origin);
  return catalog.items.find((item) => item.sku === sku);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const raw = (await params).sku;
  const sku = safeListingSku(raw);
  if (!sku) return { title: "Not on the list — FLOOR" };
  const item = await catalogItem(sku);
  if (!item) return { title: "Not on the list — FLOOR" };
  return {
    title: `${item.title} — FLOOR`,
    description: `${item.title}. Pay at the checkout link or x402 details. FLOOR does not settle that payment.`,
  };
}

export default async function ListingSkuPage({ params }: PageProps) {
  const sku = safeListingSku((await params).sku);
  if (!sku) notFound();
  const item = await catalogItem(sku);
  if (!item) notFound();

  return (
    <main className="wrap">
      <p className="kicker">Public listing</p>
      <h1>{item.title}</h1>
      <p className="lede">
        Same facts as GET /api/catalog. sku <code>{item.sku}</code>. Page{" "}
        <code>/l/{item.sku}</code>.
      </p>

      <ListingFacts item={item} />

      <section className="band">
        <p className="kicker">Machine copy</p>
        <h2>Same item JSON.</h2>
        <p className="lede">
          Embedded below. The list API stays <a href="/api/catalog">GET /api/catalog</a>.
          Field protocol is floor.b2a/v1. settlement is not_settled.
        </p>
        <div className="row">
          <a className="ghost" href="/api/catalog">
            Catalog
          </a>
          <a className="ghost" href="/listings">
            All listings
          </a>
          <a className="ghost" href="/desk">
            Desk
          </a>
        </div>
      </section>

      <script
        id="floor-item"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: embedCatalogItemJson(item) }}
      />

      <SiteFooter />
    </main>
  );
}
