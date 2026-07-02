import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ds.omeru.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep API routes and the internal builder out of the index.
        disallow: ["/api/", "/builder"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
