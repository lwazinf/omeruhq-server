import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/storefront';

/**
 * Dynamic sitemap — every active storefront is submitted to search engines
 * automatically. A merchant going live on WhatsApp lands in the next sitemap
 * fetch with zero manual work.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/stores`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const merchants = await db.merchant.findMany({
      where: { status: 'ACTIVE', show_in_browse: true },
      select: { handle: true, updatedAt: true },
      take: 5000,
    });
    return [
      ...base,
      ...merchants.map((m) => ({
        url: `${SITE_URL}/@${m.handle}`,
        lastModified: m.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return base;
  }
}
