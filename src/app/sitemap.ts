import type { MetadataRoute } from "next";
import { marketingPages, seoPages } from "@/content/pages";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "pricing", "downloads", "security", ...Object.keys(marketingPages), ...Object.keys(seoPages)];
  return [...new Set(paths)].map((path) => ({ url: `${SITE_URL}/${path}` }));
}