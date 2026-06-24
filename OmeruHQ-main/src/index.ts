import 'dotenv/config';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.1,
    });
}

import express, { Request, Response } from 'express';
import cron from 'node-cron';
import { handleIncomingMessage } from './services/whatsapp/handler';
import { checkStaleOrders } from './services/jobs/orderAlerts';
import { sendBookingReminders } from './services/jobs/bookingReminders';
import { verifyWebhook as verifyStitchWebhook, registerWebhookUrl, registerRedirectUrl } from './services/payments/stitch';
import { sendTextMessage, sendButtons } from './services/whatsapp/sender';
import { formatCurrency } from './services/whatsapp/messageTemplates';
import { db } from './lib/db';
import { log, AuditAction } from './services/whatsapp/auditLog';
import { logOrderStatusChange } from './lib/orderHistory';
import { recordShortLinkClick } from './lib/shortlink';
import crypto from 'crypto';

// Timing-safe HMAC comparison — prevents timing-based signature forgery
const verifyMetaSignature = (rawBody: Buffer, sig: string | undefined, secret: string): boolean => {
    if (!sig) return false;
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch { return false; }
};

const app = express();
const PORT = process.env.PORT || 8080;

// Trust the first proxy hop — required so req.ip, req.ips, and rate-limit keys
// reflect the actual client IP rather than the load balancer's address.
app.set('trust proxy', 1);

// ── Stitch webhook — MUST be registered before express.json() ───────────────
// Svix signature verification requires the raw request body (Buffer).
// express.json() consumes the stream, making raw verification impossible if registered first.

app.post('/webhook/stitch', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    res.status(200).send(''); // Svix expects 2xx within 15 seconds

    try {
        const { valid, payload, reason } = verifyStitchWebhook(req.body, req.headers as any);
        if (!valid) {
            console.warn(`❌ Stitch webhook: invalid signature — ${reason}`);
            return;
        }

        // Stitch Express payment.paid payload:
        // { id, linkId, status: "PAID", type: "LINK", amount, ... }
        // linkId = the payment link ID stored as Order.payment_ref when the link was created
        console.log('📦 Stitch webhook payload:', JSON.stringify(payload));

        const status = payload?.status;
        const linkId = payload?.linkId;

        if (!linkId) {
            console.warn('⚠️ Stitch webhook: no linkId — full payload:', JSON.stringify(payload));
            return;
        }

        const order = await db.order.findFirst({
            where:   { payment_ref: linkId },
            include: { merchant: { include: { branding: true } } },
        });

        if (!order) {
            console.warn(`⚠️ Stitch webhook: no order found for linkId=${linkId}`);
            return;
        }

        console.log(`💳 Stitch: ${status} for order #${order.id.slice(-5)}`);

        if (status === 'PAID') {
            if (order.status === 'PAID') {
                console.log(`ℹ️ Order ${order.id.slice(-5)} already PAID — skipping duplicate`);
                return;
            }

            await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
            logOrderStatusChange(order.id, order.status, 'PAID', 'system', 'payment_confirmed');

            await log(AuditAction.ORDER_PAID, 'system', 'Order', order.id, {
                merchant_id:    order.merchant_id,
                merchant_name:  order.merchant?.trading_name,
                customer_wa_id: order.customer_id,
                order_total:    order.total,
                gateway:        'stitch',
            });

            const totalStr = formatCurrency(order.total, {
                merchant:         order.merchant,
                merchantBranding: order.merchant?.branding,
            });

            await sendTextMessage(
                order.customer_id,
                `✅ *Payment received!*\n\nOrder *#${order.id.slice(-5)}* from *${order.merchant?.trading_name}* is confirmed.\n💰 ${totalStr}\n\n_The shop will notify you when your order is ready._`
            );

            await sendTextMessage(
                order.merchant?.wa_id || '',
                `💰 *Payment confirmed!*\nOrder *#${order.id.slice(-5)}* — ${totalStr}\nCustomer: ${order.customer_id}`
            );

        } else if (status === 'CANCELLED' || status === 'EXPIRED') {
            const msg = status === 'CANCELLED'
                ? `❌ Your payment for Order *#${order.id.slice(-5)}* was cancelled.`
                : `⏰ Your payment for Order *#${order.id.slice(-5)}* expired.`;

            await sendButtons(order.customer_id, `${msg}\n\nWould you like to try again?`, [
                { id: `retry_payment_${order.id}`, title: '🔄 Retry Payment' },
                { id: 'c_my_orders',               title: '📦 My Orders' },
            ]);
        }
    } catch (err: any) {
        console.error('❌ Stitch webhook error:', err.message);
    }
});

// ── WhatsApp webhook — MUST be registered before express.json() ─────────────
// Meta sends x-hub-signature-256; verifying it requires the raw Buffer.
app.post('/api/whatsapp/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    res.status(200).send('OK'); // Always 200 — Meta retries on non-2xx

    const appSecret = process.env.META_APP_SECRET;
    if (appSecret) {
        const sig = req.headers['x-hub-signature-256'] as string | undefined;
        if (!verifyMetaSignature(req.body as Buffer, sig, appSecret)) {
            console.warn(`⚠️ WhatsApp webhook: invalid signature — request dropped`);
            return;
        }
    }

    try {
        const payload = JSON.parse((req.body as Buffer).toString());
        const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || payload.messages?.[0];
        if (message) {
            console.log(`📩 Received ${message.type} from ${message.from}`);
            await handleIncomingMessage(message);
        } else {
            const status = payload.entry?.[0]?.changes?.[0]?.value?.statuses?.[0] || payload.statuses?.[0];
            if (status) {
                console.log(`ℹ️ Message Status Update: ${status.status} for ${status.id}`);
            } else {
                console.log('❓ Unknown payload format received.');
            }
        }
    } catch (err: any) {
        console.error('❌ Webhook Processing Error:', err.message);
    }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check for Railway
 */
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
});

// ── Short link redirects ─────────────────────────────────────────────────────
app.get('/p/:code', async (req: Request, res: Response) => {
    try {
        const url = await recordShortLinkClick(req.params.code);
        if (!url) return res.status(404).send('Link not found');
        res.redirect(301, url);
    } catch {
        res.status(500).send('Server error');
    }
});

/**
 * Webhook Verification
 */
app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];

    if (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
    }
    
    console.warn('❌ Webhook verification failed: Invalid token');
    res.sendStatus(403);
});


// ── Static payment result pages ────────────────────────────────────────────

const waLink = `https://wa.me/${process.env.WHATSAPP_PHONE_NUMBER || '27750656348'}`;

const paymentPage = (title: string, message: string, color: string): string => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Omeru</title>
<style>
  body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
  .card{background:#fff;border-radius:16px;padding:40px 32px;text-align:center;max-width:360px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .icon{font-size:56px;margin-bottom:16px}
  h1{margin:0 0 12px;color:${color};font-size:22px}
  p{margin:0 0 24px;color:#555;line-height:1.5}
  .btn{display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 28px;border-radius:50px;font-size:16px;font-weight:600;margin-bottom:24px}
  .brand{color:#888;font-size:13px;margin-top:8px}
</style></head><body>
<div class="card">
  <div class="icon">${color === 'green' ? '✅' : color === 'orange' ? '❌' : '⚠️'}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a class="btn" href="${waLink}">💬 Return to Omeru</a>
  <div class="brand">Omeru — Shop smarter on WhatsApp</div>
</div></body></html>`;

app.get('/payment/success', (_req: Request, res: Response) => {
    res.redirect(302, waLink);
});
app.get('/payment/cancel', (_req: Request, res: Response) => {
    res.send(paymentPage('Payment Cancelled', 'Your payment was cancelled. Return to WhatsApp to try again.', 'orange'));
});
app.get('/payment/error', (_req: Request, res: Response) => {
    res.send(paymentPage('Payment Error', 'Something went wrong with your payment. Please try again.', 'red'));
});

// ── Stitch one-time setup endpoint ─────────────────────────────────────────
// Hit GET /admin/stitch-setup once after deploying to register the webhook URL
// and get back STITCH_WEBHOOK_SECRET. Then add it to your Koyeb env vars.

app.get('/admin/stitch-setup', async (_req: Request, res: Response) => {
    const adminKey = process.env.ADMIN_SETUP_KEY;
    if (adminKey && _req.headers['x-admin-key'] !== adminKey) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (process.env.STITCH_WEBHOOK_SECRET) {
        return res.json({ message: 'Already set up. STITCH_WEBHOOK_SECRET is configured.' });
    }
    try {
        const baseUrl = process.env.SERVER_URL || 'https://obvious-edi-remoluhle-c2b8b512.koyeb.app';
        await registerRedirectUrl(`${baseUrl}/payment/success`);
        const secret = await registerWebhookUrl(`${baseUrl}/webhook/stitch`);
        res.json({
            message: 'Setup complete! Add these to your Koyeb environment variables:',
            STITCH_WEBHOOK_SECRET: secret,
            STITCH_REDIRECT_URL:   `${baseUrl}/payment/success`,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message, detail: err.response?.data });
    }
});

// Sentry must be the last error handler before listen()
Sentry.setupExpressErrorHandler(app);

const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 OMERU SERVER LIVE`);
    console.log(`📡 Port: ${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Stale order alerts — runs every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        checkStaleOrders().catch(err =>
            console.error('❌ Order alert job failed:', err.message)
        );
    });
    console.log('⏰ Stale order alert job scheduled (every 5 min)');

    // Booking reminders — runs hourly
    cron.schedule('5 * * * *', () => {
        sendBookingReminders().catch(err =>
            console.error('❌ Booking reminder job failed:', err.message)
        );
    });
    console.log('⏰ Booking reminder job scheduled (hourly)');

    // Abandoned cart nudge — runs every 30 min, targets carts idle for 2–2.5 h
    // Window approach means each cart gets exactly one nudge before the window passes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const windowEnd   = new Date(Date.now() - 2    * 60 * 60 * 1000);
            const windowStart = new Date(Date.now() - 2.5  * 60 * 60 * 1000);
            const sessions = await db.userSession.findMany({
                where: {
                    cart_json: { not: null },
                    updatedAt: { lt: windowEnd, gt: windowStart },
                },
                take: 100,
            });
            for (const s of sessions) {
                if (!s.cart_json) continue;
                try {
                    const cart = JSON.parse(s.cart_json);
                    const count: number = cart.items?.reduce((n: number, i: any) => n + i.qty, 0) || 0;
                    if (!count || !cart.merchant_name) continue;
                    await sendButtons(s.wa_id,
                        `🛒 *Still thinking?*\n\nYou left *${count} item${count !== 1 ? 's' : ''}* in your cart at *${cart.merchant_name}*.\n\n_It's saved and ready whenever you are._`,
                        [
                            { id: 'c_cart',      title: '🛒 View Cart' },
                            { id: 'cart_clear',  title: '🗑️ Clear Cart' },
                        ],
                    );
                } catch { /* bad cart JSON — skip */ }
            }
        } catch (err: any) {
            console.error('❌ Abandoned cart cron:', err.message);
        }
    });
    console.log('⏰ Abandoned cart nudge scheduled (every 30 min)');
});

// Keep-alive above typical LB idle timeout (60 s) — prevents 502 gateway errors
server.keepAliveTimeout = 65_000;
server.headersTimeout   = 66_000; // Must be above keepAliveTimeout

// Graceful shutdown on SIGTERM — finish in-flight requests before the process exits
// Critical for zero-downtime rolling deployments behind a load balancer
process.on('SIGTERM', () => {
    console.log('⚡ SIGTERM received — draining connections...');
    server.close(() => {
        db.$disconnect().then(() => {
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        });
    });
    setTimeout(() => process.exit(0), 15_000).unref(); // Force-exit after 15 s
});