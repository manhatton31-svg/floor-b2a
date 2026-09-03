import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, siteOrigin } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: [...PUBLIC_PATHS],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
