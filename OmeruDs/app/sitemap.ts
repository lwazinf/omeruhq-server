import type { MetadataRoute } from "next";
import { bundledFlows } from "@/lib/flows";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ds.omeru.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const demoPages = bundledFlows.map((flow) => ({
    url: `${SITE_URL}/chat/${flow.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...demoPages,
  ];
}
