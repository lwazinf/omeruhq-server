import axios from 'axios';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Durable media storage — fixes the "product images disappear" bug.
 *
 * WHY: WhatsApp media IDs are temporary. Meta deletes uploaded media after ~30
 * days, and the signed download URL behind a media ID expires within minutes.
 * Storing `message.image.id` as `image_url` therefore guarantees that every
 * product image silently dies.
 *
 * FIX: the moment a merchant sends an image, we download it once from the
 * Meta Cloud API media endpoint, compress it with sharp, and upload
 * it to Supabase Storage (free tier: 1 GB). The permanent public URL is what
 * gets stored in Postgres and what both the bot and the web storefront render.
 *
 * Required env:
 *   SUPABASE_URL          e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  service-role key (server-side only — never ship to a client)
 *   SUPABASE_BUCKET       defaults to "omeru-media" (create it as a PUBLIC bucket)
 *
 * If Supabase is not configured we fall back to returning the raw media ID so
 * the bot keeps working in dev — with a loud warning, because that path is the bug.
 */

const BUCKET = process.env.SUPABASE_BUCKET || 'omeru-media';

let _supabase: SupabaseClient | null = null;
const getSupabase = (): SupabaseClient | null => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return null;
    if (!_supabase) _supabase = createClient(url, key, { auth: { persistSession: false } });
    return _supabase;
};

/** Download raw bytes for a WhatsApp media ID via the Meta Cloud API. */
const downloadWhatsAppMedia = async (mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // Step 1: resolve media ID → short-lived CDN URL
    const meta = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, { headers });
    const mediaUrl: string = meta.data?.url;
    if (!mediaUrl) throw new Error(`WhatsApp media ${mediaId}: no URL in metadata response`);

    // Step 2: download the bytes using Bearer auth (URL expires in ~5 minutes)
    const file = await axios.get(mediaUrl, { headers, responseType: 'arraybuffer', timeout: 30_000 });
    return {
        buffer: Buffer.from(file.data),
        mimeType: meta.data?.mime_type || file.headers['content-type'] || 'image/jpeg',
    };
};

/**
 * Persist a WhatsApp image media ID to durable storage.
 * Returns a permanent public https URL on success.
 * Falls back to the raw media ID (legacy behaviour) only if storage is unconfigured.
 *
 * @param mediaId  message.image.id from the webhook payload
 * @param keyHint  used to build a readable storage path, e.g. `products/<productId>`
 */
export const persistWhatsAppImage = async (mediaId: string, keyHint: string): Promise<string> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn('⚠️ MEDIA: SUPABASE_URL/SUPABASE_SERVICE_KEY not set — storing raw media ID. ' +
            'This image WILL expire. Configure Supabase Storage to fix.');
        return mediaId;
    }

    try {
        const { buffer } = await downloadWhatsAppMedia(mediaId);

        // Normalise: resize to max 1280px, convert to JPEG q80 — small, fast, WhatsApp-friendly
        const optimised = await sharp(buffer)
            .rotate() // respect EXIF orientation
            .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

        const path = `${keyHint}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, optimised, {
            contentType: 'image/jpeg',
            cacheControl: '31536000', // 1 year — paths are unique per upload
            upsert: false,
        });
        if (error) throw new Error(`Supabase upload failed: ${error.message}`);

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        console.log(`🖼️ MEDIA: persisted ${mediaId} → ${data.publicUrl}`);
        return data.publicUrl;
    } catch (err: any) {
        // Never block the merchant flow on a storage hiccup — degrade to media ID
        console.error(`❌ MEDIA: persist failed for ${mediaId}: ${err.message} — falling back to media ID`);
        return mediaId;
    }
};

/** Best-effort delete of a previously persisted image (no-op for media IDs / foreign URLs). */
export const deletePersistedImage = async (imageUrl: string | null | undefined): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase || !imageUrl) return;
    const base = process.env.SUPABASE_URL || '';
    if (!imageUrl.startsWith(base)) return; // not ours
    const marker = `/object/public/${BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return;
    const path = imageUrl.slice(idx + marker.length);
    try {
        await supabase.storage.from(BUCKET).remove([path]);
    } catch { /* best effort */ }
};
