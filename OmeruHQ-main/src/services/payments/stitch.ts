import axios from 'axios';
import { Webhook } from 'svix';
import { createShortLink } from '../../lib/shortlink';

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL       = 'https://express.stitch.money';
const CLIENT_ID      = process.env.STITCH_CLIENT_ID      || '';
const CLIENT_SECRET  = process.env.STITCH_CLIENT_SECRET  || '';
const REDIRECT_URL   = process.env.STITCH_REDIRECT_URL   || '';
const WEBHOOK_SECRET = process.env.STITCH_WEBHOOK_SECRET || '';

// ── Token Cache ────────────────────────────────────────────────────────────

let cachedToken    = '';
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

    const res = await axios.post(`${BASE_URL}/api/v1/token`, {
        clientId:     CLIENT_ID,
        clientSecret: CLIENT_SECRET,
    });

    // Stitch Express: { success: true, data: { accessToken: "..." } }
    const token = res.data.data?.accessToken || res.data.accessToken;
    if (!token) throw new Error('Stitch: token endpoint returned empty access token');

    cachedToken    = token;
    tokenExpiresAt = Date.now() + 14 * 60 * 1000; // 15 min token — 1 min buffer
    return cachedToken;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type StitchPaymentResult = {
    paymentUrl:    string;
    transactionRef: string;
};

// ── Payment Creation ───────────────────────────────────────────────────────

/**
 * Create a Stitch Express payment link and return a shortened URL.
 *
 * Amount is in ZAR (decimal). Stitch expects cents.
 * merchantReference = orderId, stored as Order.payment_ref.
 */
export const createPaymentRequest = async (params: {
    orderId:       string;
    amount:        number;  // ZAR decimal e.g. 150.00
    merchantName:  string;
    customerWaId:  string;  // used as payerName — required by Stitch Express
}): Promise<StitchPaymentResult> => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Stitch: STITCH_CLIENT_ID and STITCH_CLIENT_SECRET must be set');
    }

    const token       = await getToken();
    const amountCents = Math.round(params.amount * 100);

    // Constraint: max 50 chars, alphanumeric + spaces + hyphens
    const merchantRef = params.orderId.replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 50);

    const res = await axios.post(`${BASE_URL}/api/v1/payment-links`, {
        amount:            amountCents,
        merchantReference: merchantRef,
        payerName:         params.customerWaId,
        paymentMethods: {
            eft: { enabled: true },
        },
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });

    // { success: true, data: { payment: { id: "...", link: "https://..." } } }
    const { id: linkId, link: url } = res.data.data.payment;

    // Append registered redirect URL so the customer lands back at our page
    const fullUrl    = REDIRECT_URL ? `${url}?redirect_url=${encodeURIComponent(REDIRECT_URL)}` : url;
    const paymentUrl = await createShortLink(fullUrl);

    console.log(`💳 Stitch: payment link ${linkId} for order ${params.orderId.slice(-5)} — R${params.amount.toFixed(2)} → ${paymentUrl}`);

    // transactionRef = Stitch link ID, stored as Order.payment_ref
    // Webhook fires with { linkId: "..." } — matched back to this order via payment_ref
    return {
        paymentUrl,
        transactionRef: linkId,
    };
};

// ── Webhook Verification ───────────────────────────────────────────────────

/**
 * Verify a Stitch Express webhook using Svix signature headers.
 * Requires the raw request body (Buffer) — do NOT parse with express.json() first.
 *
 * Set STITCH_SKIP_VERIFY=true to bypass (dev/local testing only).
 */
export const verifyWebhook = (
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined>
): { valid: boolean; payload?: any; reason?: string } => {
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    if (process.env.STITCH_SKIP_VERIFY === 'true') {
        console.warn('⚠️ Stitch: skipping webhook verification (STITCH_SKIP_VERIFY=true)');
        return { valid: true, payload: JSON.parse(bodyStr) };
    }

    if (!WEBHOOK_SECRET) {
        console.warn('⚠️ Stitch: STITCH_WEBHOOK_SECRET not set — skipping verification');
        return { valid: true, payload: JSON.parse(bodyStr) };
    }

    try {
        const wh      = new Webhook(WEBHOOK_SECRET);
        const payload = wh.verify(rawBody, {
            'svix-id':        String(headers['svix-id']        || ''),
            'svix-timestamp': String(headers['svix-timestamp'] || ''),
            'svix-signature': String(headers['svix-signature'] || ''),
        });
        return { valid: true, payload };
    } catch (err: any) {
        return { valid: false, reason: err.message };
    }
};

// ── One-Time Setup Helpers ─────────────────────────────────────────────────

/**
 * Register a redirect URL with Stitch Express (max 5 per client).
 * Call once during initial setup.
 */
export const registerRedirectUrl = async (redirectUrl: string): Promise<void> => {
    const token = await getToken();
    await axios.post(`${BASE_URL}/api/v1/redirect-urls`, { redirectUrl }, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

/**
 * Register a webhook URL with Stitch Express. Returns the Svix webhook secret.
 * Store the returned secret as STITCH_WEBHOOK_SECRET in your environment.
 */
export const registerWebhookUrl = async (webhookUrl: string): Promise<string> => {
    const token = await getToken();
    const res   = await axios.post(`${BASE_URL}/api/v1/webhook`, { url: webhookUrl }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data?.secret || res.data.secret;
};
