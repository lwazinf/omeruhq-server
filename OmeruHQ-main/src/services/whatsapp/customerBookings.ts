import { Merchant } from '@prisma/client';
import { sendButtons, sendTextMessage, sendListMessage, sendInteractiveImageButtons } from './sender';
import { formatCurrency } from './messageTemplates';
import { getPlatformBranding } from './platformBranding';
import { fmtDate, fmtTime, startOfDay } from './merchantServices';
import { db } from '../../lib/db';
import { log, AuditAction } from './auditLog';

/**
 * Customer Bookings
 *
 * Customers browse a merchant's services, pick a day (next 7 days), then a
 * free time slot. Slots are generated from the merchant's opening hours minus
 * existing PENDING/CONFIRMED bookings. The booking is created PENDING and the
 * merchant gets an Accept / Decline card instantly.
 *
 * Button ID map (routed from handler via 'cbk_' / 'c_book_' / 'c_my_bookings'):
 *   c_book_<merchantId>        → list services for a store
 *   cbk_svc_<serviceId>        → pick a day for a service
 *   cbk_day_<serviceId>_<yyyymmdd> → pick a slot
 *   cbk_slot_<serviceId>_<epochMin> → confirm
 *   cbk_go_<serviceId>_<epochMin>   → create booking
 *   c_my_bookings              → customer's upcoming bookings
 *   cbk_cancel_<bookingId>     → customer cancels
 */

const DAYS_AHEAD = 7;
const MAX_SLOTS_SHOWN = 10;

export const handleCustomerBookings = async (from: string, input: string): Promise<void> => {
    const platformBranding = await getPlatformBranding(db);

    // ── List a store's services ───────────────────────────────────────────
    if (input.startsWith('c_book_')) {
        const merchantId = input.replace('c_book_', '');
        const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
        if (!merchant || merchant.status !== 'ACTIVE') {
            await sendTextMessage(from, '❌ This store is not available right now.');
            return;
        }
        const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: merchant.id } });
        const fmt = (n: number) => formatCurrency(n, { merchant, merchantBranding, platform: platformBranding });

        const services = await db.service.findMany({
            where: { merchant_id: merchantId, is_active: true },
            orderBy: { price: 'asc' },
        });
        if (!services.length) {
            await sendButtons(from, `📭 *${merchant.trading_name}* has no bookable services right now.`, [
                { id: `@${merchant.handle}`, title: '🏪 Back to Store' },
            ]);
            return;
        }

        await sendListMessage(from,
            `💼 *${merchant.trading_name} — Services*\n\nPick a service to see available times:`,
            '💇 Book a Service',
            [{ title: 'Services', rows: services.slice(0, 10).map(s => ({
                id: `cbk_svc_${s.id}`,
                title: s.name.substring(0, 24),
                description: `${fmt(s.price)} • ${s.duration_min} min`,
            })) }],
            merchant.trading_name.substring(0, 60));
        return;
    }

    // ── Pick a day ────────────────────────────────────────────────────────
    if (input.startsWith('cbk_svc_')) {
        const serviceId = input.replace('cbk_svc_', '');
        const service = await db.service.findUnique({ where: { id: serviceId }, include: { merchant: true } });
        if (!service || !service.is_active || service.merchant.status !== 'ACTIVE') {
            await sendTextMessage(from, '❌ This service is no longer available.');
            return;
        }

        const rows: Array<{ id: string; title: string; description?: string }> = [];
        const now = new Date();
        for (let i = 0; i < DAYS_AHEAD; i++) {
            const day = startOfDay(new Date(now.getTime() + i * 86400000));
            if (!isMerchantOpenOn(service.merchant, day)) continue;
            const free = await countFreeSlots(service.merchant, service.duration_min, day);
            if (free === 0) continue;
            rows.push({
                id: `cbk_day_${serviceId}_${ymd(day)}`,
                title: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDate(day),
                description: `${free} slot${free === 1 ? '' : 's'} available`,
            });
        }

        if (!rows.length) {
            await sendButtons(from, `😔 *${service.merchant.trading_name}* is fully booked for the next ${DAYS_AHEAD} days. Try again soon!`, [
                { id: `@${service.merchant.handle}`, title: '🏪 Back to Store' },
            ]);
            return;
        }

        if (service.image_url) {
            await sendInteractiveImageButtons(from, service.image_url,
                `💼 *${service.name}*\n⏱️ ${service.duration_min} min`,
                [{ id: `@${service.merchant.handle}`, title: '↩️ Back' }]);
        }
        await sendListMessage(from, `📅 *${service.name}* — pick a day:`, '📅 Choose Day',
            [{ title: 'Available Days', rows }]);
        return;
    }

    // ── Pick a slot ───────────────────────────────────────────────────────
    if (input.startsWith('cbk_day_')) {
        const [, , serviceId, dayStr] = input.split('_');
        const service = await db.service.findUnique({ where: { id: serviceId }, include: { merchant: true } });
        if (!service) { await sendTextMessage(from, '❌ Service not found.'); return; }
        const day = fromYmd(dayStr);

        const slots = await generateFreeSlots(service.merchant, service.duration_min, day);
        if (!slots.length) {
            await sendButtons(from, '😔 That day just filled up. Pick another:', [
                { id: `cbk_svc_${serviceId}`, title: '📅 Other Days' },
            ]);
            return;
        }

        await sendListMessage(from,
            `🕐 *${service.name}* — ${fmtDate(day)}\n\nPick a time:`,
            '🕐 Choose Time',
            [{ title: 'Available Times', rows: slots.slice(0, MAX_SLOTS_SHOWN).map(s => ({
                id: `cbk_slot_${serviceId}_${Math.floor(s.getTime() / 60000)}`,
                title: fmtTime(s),
                description: `${service.duration_min} min`,
            })) }]);
        return;
    }

    // ── Confirm ───────────────────────────────────────────────────────────
    if (input.startsWith('cbk_slot_')) {
        const [, , serviceId, epochMinStr] = input.split('_');
        const service = await db.service.findUnique({ where: { id: serviceId }, include: { merchant: true } });
        if (!service) return;
        const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: service.merchant_id } });
        const start = new Date(parseInt(epochMinStr, 10) * 60000);
        const priceStr = formatCurrency(service.price, { merchant: service.merchant, merchantBranding, platform: platformBranding });

        await sendButtons(from,
            `📋 *Confirm your booking*\n\n💼 ${service.name}\n🏪 ${service.merchant.trading_name}\n📅 ${fmtDate(start)}\n🕐 ${fmtTime(start)}\n⏱️ ${service.duration_min} min\n💰 ${priceStr}\n\n_${service.merchant.trading_name} will confirm your request._`,
            [
                { id: `cbk_go_${serviceId}_${epochMinStr}`, title: '✅ Request Booking' },
                { id: `cbk_day_${serviceId}_${ymd(start)}`, title: '🕐 Other Time' },
            ]);
        return;
    }

    // ── Create booking ────────────────────────────────────────────────────
    if (input.startsWith('cbk_go_')) {
        const [, , serviceId, epochMinStr] = input.split('_');
        const service = await db.service.findUnique({ where: { id: serviceId }, include: { merchant: true } });
        if (!service) return;
        const start = new Date(parseInt(epochMinStr, 10) * 60000);
        const end = new Date(start.getTime() + service.duration_min * 60000);

        // Race-condition guard — re-check the slot is still free at write time
        const clash = await db.booking.findFirst({
            where: {
                merchant_id: service.merchant_id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                start_at: { lt: end }, end_at: { gt: start },
            },
        });
        if (clash) {
            await sendButtons(from, '😬 Someone just took that slot! Pick another:', [
                { id: `cbk_day_${serviceId}_${ymd(start)}`, title: '🕐 Other Times' },
            ]);
            return;
        }

        const customer = await db.merchantCustomer.findUnique({
            where: { merchant_id_wa_id: { merchant_id: service.merchant_id, wa_id: from } },
        });
        const booking = await db.booking.create({
            data: {
                merchant_id: service.merchant_id,
                service_id: serviceId,
                customer_wa_id: from,
                customer_name: customer?.display_name || null,
                start_at: start,
                end_at: end,
            },
        });
        await log(AuditAction.BOOKING_REQUESTED, from, 'Booking', booking.id, {
            merchant_id: service.merchant_id, service: service.name, start_at: start,
        });

        await sendButtons(from,
            `🕐 *Request sent!*\n\n*${service.merchant.trading_name}* will confirm your *${service.name}* booking for ${fmtDate(start)} at ${fmtTime(start)}.\n\nWe'll message you the moment they respond.`,
            [
                { id: 'c_my_bookings',                title: '📅 My Bookings' },
                { id: `@${service.merchant.handle}`,  title: '🏪 Back to Store' },
            ]);

        // Notify merchant + active staff
        const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: service.merchant_id } });
        const priceStr = formatCurrency(service.price, { merchant: service.merchant, merchantBranding, platform: platformBranding });
        await sendButtons(service.merchant.wa_id,
            `🔔 *New booking request!*\n\n💼 ${service.name}\n👤 ${customer?.display_name || from}\n📅 ${fmtDate(start)}\n🕐 ${fmtTime(start)} – ${fmtTime(end)}\n💰 ${priceStr}`,
            [
                { id: `bk_accept_${booking.id}`,  title: '✅ Accept' },
                { id: `bk_decline_${booking.id}`, title: '❌ Decline' },
            ]);
        return;
    }

    // ── My bookings ───────────────────────────────────────────────────────
    if (input === 'c_my_bookings') {
        const bookings = await db.booking.findMany({
            where: { customer_wa_id: from, start_at: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
            include: { service: true, merchant: true },
            orderBy: { start_at: 'asc' },
            take: 5,
        });
        if (!bookings.length) {
            await sendButtons(from, '📅 *My Bookings*\n\nNo upcoming bookings. Find a service to book!', [
                { id: 'browse_shops', title: '🛍️ Browse Stores' },
                { id: 'c_home',       title: '🏠 Home' },
            ]);
            return;
        }
        for (const b of bookings) {
            const statusBadge = b.status === 'CONFIRMED' ? '✅ Confirmed' : '🕐 Awaiting confirmation';
            await sendButtons(from,
                `💼 *${b.service.name}*\n🏪 ${b.merchant.trading_name}\n📅 ${fmtDate(b.start_at)} at ${fmtTime(b.start_at)}\n${statusBadge}`,
                [
                    { id: `cbk_cancel_${b.id}`,   title: '❌ Cancel' },
                    { id: `@${b.merchant.handle}`, title: '🏪 Store' },
                ]);
        }
        return;
    }

    if (input.startsWith('cbk_cancel_')) {
        const id = input.replace('cbk_cancel_', '');
        const b = await db.booking.findUnique({ where: { id }, include: { service: true, merchant: true } });
        if (!b || b.customer_wa_id !== from) { await sendTextMessage(from, '❌ Booking not found.'); return; }
        if (!['PENDING', 'CONFIRMED'].includes(b.status)) { await sendTextMessage(from, 'ℹ️ This booking is already closed.'); return; }
        await db.booking.update({ where: { id }, data: { status: 'CANCELLED', decline_reason: 'Cancelled by customer' } });
        await sendTextMessage(from, `❌ Your *${b.service.name}* booking on ${fmtDate(b.start_at)} has been cancelled.`);
        await sendTextMessage(b.merchant.wa_id,
            `ℹ️ *Booking cancelled by customer*\n\n${b.service.name} — ${fmtDate(b.start_at)} ${fmtTime(b.start_at)}\nThe slot is open again.`);
        return;
    }
};

// ── Slot generation ──────────────────────────────────────────────────────────

/** Is the merchant open at all on this calendar day? */
const isMerchantOpenOn = (merchant: Merchant, day: Date): boolean => {
    if (merchant.manual_closed) return false;
    const dow = day.getDay(); // local server time; hours below use same basis
    if (dow === 0) return merchant.sun_open;
    return true;
};

const hoursFor = (merchant: Merchant, day: Date): { open: string; close: string } => {
    const dow = day.getDay();
    if (dow === 6) return { open: merchant.sat_open_time, close: merchant.sat_close_time };
    if (dow === 0) return { open: merchant.sat_open_time, close: merchant.sat_close_time }; // Sundays reuse Sat hours when sun_open
    return { open: merchant.open_time, close: merchant.close_time };
};

/** All free slot start-times for a service on a given day. */
export const generateFreeSlots = async (merchant: Merchant, durationMin: number, day: Date): Promise<Date[]> => {
    if (!isMerchantOpenOn(merchant, day)) return [];
    const { open, close } = hoursFor(merchant, day);
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);

    const dayStart = startOfDay(day);
    const openAt  = new Date(dayStart); openAt.setHours(oh, om, 0, 0);
    const closeAt = new Date(dayStart); closeAt.setHours(ch, cm, 0, 0);

    const existing = await db.booking.findMany({
        where: {
            merchant_id: merchant.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            start_at: { lt: closeAt },
            end_at:   { gt: openAt },
        },
        select: { start_at: true, end_at: true },
    });

    const now = new Date();
    const step = Math.min(durationMin, 60) * 60000; // grid: service length, capped at hourly
    const slots: Date[] = [];
    for (let t = openAt.getTime(); t + durationMin * 60000 <= closeAt.getTime(); t += step) {
        const s = new Date(t);
        const e = new Date(t + durationMin * 60000);
        if (s <= now) continue; // no past slots
        const clash = existing.some(b => b.start_at < e && b.end_at > s);
        if (!clash) slots.push(s);
    }
    return slots;
};

const countFreeSlots = async (merchant: Merchant, durationMin: number, day: Date): Promise<number> =>
    (await generateFreeSlots(merchant, durationMin, day)).length;

// ── Day codec ────────────────────────────────────────────────────────────────

const ymd = (d: Date): string =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

const fromYmd = (s: string): Date =>
    new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, parseInt(s.slice(6, 8)));
