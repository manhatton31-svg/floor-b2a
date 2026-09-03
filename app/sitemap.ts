import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, siteOrigin } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  return PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    changeFrequency: path === "/api/catalog" ? "hourly" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
