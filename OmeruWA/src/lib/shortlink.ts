import crypto from 'crypto';
import { db } from './db';

const BASE_URL = process.env.SHORT_LINK_BASE_URL || 'https://omeru.io';

interface ShortLinkOpts {
    utm_source?:   string;
    utm_medium?:   string;
    utm_campaign?: string;
}

export const createShortLink = async (url: string, opts: ShortLinkOpts = {}): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = crypto.randomBytes(4).toString('base64url').slice(0, 6);
        try {
            await db.shortLink.create({ data: { code, url, ...opts } });
            return `${BASE_URL}/p/${code}`;
        } catch {
            // code collision — retry
        }
    }
    return url;
};

// Call this from the shortlink redirect handler (e.g. omeru.io/p/[code]) on each click
export const recordShortLinkClick = async (code: string): Promise<string | null> => {
    const link = await db.shortLink.findUnique({ where: { code } });
    if (!link) return null;
    db.shortLink.update({
        where: { code },
        data:  { click_count: { increment: 1 }, last_clicked_at: new Date() },
    }).catch(err => console.error('[shortlink click]', err.message));
    return link.url;
};
