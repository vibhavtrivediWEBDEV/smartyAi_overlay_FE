import type { MetadataRoute } from "next";
import { marketingPages, seoPages } from "@/content/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const paths = ["", "pricing", "downloads", ...Object.keys(marketingPages), ...Object.keys(seoPages)];
  return [...new Set(paths)].map((path) => ({ url: `${baseUrl}/${path}`, lastModified: new Date(), changeFrequency: path ? "monthly" : "weekly", priority: path ? 0.7 : 1 }));
}