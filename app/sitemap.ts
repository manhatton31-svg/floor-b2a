import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    changeFrequency: path === "/api/catalog" ? "hourly" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
