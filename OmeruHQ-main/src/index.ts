import 'dotenv/config';
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

const app = express();
const PORT = process.env.PORT || 8080;

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

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check for Railway
 */
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// ── Short link redirects ─────────────────────────────────────────────────────
app.get('/p/:code', async (req: Request, res: Response) => {
    try {
        const link = await db.shortLink.findUnique({ where: { code: req.params.code } });
        if (!link) return res.status(404).send('Link not found');
        res.redirect(301, link.url);
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

/**
 * Main Webhook Handler
 */
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    // 1. Respond 200 OK immediately to prevent retries
    res.status(200).send('OK');

    try {
        // 2. Navigate the nested Meta/360Dialog structure
        // Entry[0] -> Changes[0] -> Value -> Messages[0]
        const message = 
            req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || 
            req.body.messages?.[0];

        if (message) {
            console.log(`📩 Received ${message.type} from ${message.from}`);
            await handleIncomingMessage(message);
        } else {
            // Check if it's a status update (sent/delivered/read)
            const status = 
                req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0] || 
                req.body.statuses?.[0];
            
            if (status) {
                console.log(`ℹ️ Message Status Update: ${status.status} for ${status.id}`);
            } else {
                console.log('❓ Unknown payload format received. Check Koyeb logs for body content.');
            }
        }
    } catch (err: any) {
        console.error('❌ Webhook Processing Error:', err.message);
        // Do not crash the server on logic errors
    }
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

app.listen(Number(PORT), '0.0.0.0', () => {
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
});