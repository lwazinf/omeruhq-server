import type { MetadataRoute } from 'next';

// Belt and braces with the X-Robots-Tag header: nothing here is crawlable.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
