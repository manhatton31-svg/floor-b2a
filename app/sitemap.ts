import type { MetadataRoute } from "next";
import { buildCatalog } from "@/lib/catalog";
import { PUBLIC_PATHS, siteOrigin } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const catalog = await buildCatalog(new Date(), origin);
  const listed = new Set<string>(PUBLIC_PATHS);
  const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    changeFrequency: path === "/api/catalog" || path.startsWith("/l/") ? "hourly" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
  for (const item of catalog.items) {
    const path = `/l/${item.sku}`;
    if (listed.has(path)) continue;
    listed.add(path);
    pages.push({
      url: `${origin}${path}`,
      changeFrequency: "hourly",
      priority: 0.6,
    });
  }
  return pages;
}
