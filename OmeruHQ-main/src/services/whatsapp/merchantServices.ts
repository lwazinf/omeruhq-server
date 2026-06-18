import { Merchant, UserSession, BookingStatus } from '@prisma/client';
import { sendButtons, sendTextMessage, sendListMessage } from './sender';
import { formatCurrency } from './messageTemplates';
import { getPlatformBranding } from './platformBranding';
import { persistWhatsAppImage } from '../media/storage';
import { db } from '../../lib/db';
import { log, AuditAction } from './auditLog';

/**
 * Merchant Services & Bookings
 *
 * Lets service businesses (hair stylists, barbers, nail techs, tutors, repairs)
 * publish bookable services with a duration and price. Customers see free slots
 * generated from the merchant's existing opening hours minus confirmed bookings.
 *
 * Merchant actions: list / add / edit / activate-deactivate / delete services,
 * review pending bookings (accept / decline with reason), see a 7-day diary,
 * and cancel or complete bookings.
 *
 * All button IDs are prefixed `sv_` (services) or `bk_` (bookings) and routed
 * from merchantEngine via SERVICE_PREFIXES.
 */

const STATE = {
    ADD_NAME:     'SV_ADD_NAME',
    ADD_PRICE:    'SV_ADD_PRICE',
    ADD_DURATION: 'SV_ADD_DURATION',
    ADD_IMAGE:    'SV_ADD_IMAGE',
    EDIT_NAME:    'SV_EDIT_NAME',
    EDIT_PRICE:   'SV_EDIT_PRICE',
    EDIT_DURATION:'SV_EDIT_DURATION',
    DECLINE_REASON: 'BK_DECLINE_REASON',
};

const buildState = (key: string, id?: string) => (id ? `${key}:${id}` : key);
const parseState = (state: string | null | undefined): [string, string?] => {
    if (!state) return [''];
    const [k, id] = state.split(':');
    return [k, id];
};

const setState = (waId: string, state: string | null) =>
    db.userSession.update({ where: { wa_id: waId }, data: { active_prod_id: state } });

export const handleServiceActions = async (
    from: string,
    input: string,
    session: UserSession,
    merchant: Merchant,
    message?: any
): Promise<void> => {
    const platformBranding = await getPlatformBranding(db);
    const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: merchant.id } });
    const fmt = (n: number) => formatCurrency(n, { merchant, merchantBranding, platform: platformBranding });
    const [stateKey, stateId] = parseState(session.active_prod_id);

    // ── Services home ─────────────────────────────────────────────────────
    if (input === 'm_services') {
        await setState(from, null);
        const [services, pending] = await Promise.all([
            db.service.findMany({ where: { merchant_id: merchant.id }, orderBy: { createdAt: 'asc' } }),
            db.booking.count({ where: { merchant_id: merchant.id, status: 'PENDING', start_at: { gte: new Date() } } }),
        ]);

        let body = `💼 *Services — ${merchant.trading_name}*\n\n`;
        body += services.length
            ? services.map(s => `${s.is_active ? '🟢' : '⚪'} *${s.name}* — ${fmt(s.price)} • ${s.duration_min} min`).join('\n')
            : '_No services yet. Add your first one!_';
        if (pending > 0) body += `\n\n🔔 *${pending} booking request${pending > 1 ? 's' : ''} waiting for you.*`;

        await sendButtons(from, body, [
            { id: 'sv_add',      title: '➕ Add Service' },
            { id: 'bk_inbox',    title: `🔔 Requests (${pending})` },
            { id: 'bk_diary',    title: '📅 My Diary' },
        ]);
        if (services.length) {
            await sendListMessage(from, 'Tap a service to manage it:', '✏️ Manage Services',
                [{ title: 'Your Services', rows: services.slice(0, 10).map(s => ({
                    id: `sv_view_${s.id}`,
                    title: s.name.substring(0, 24),
                    description: `${fmt(s.price)} • ${s.duration_min} min • ${s.is_active ? 'Active' : 'Hidden'}`,
                })) }]);
        }
        return;
    }

    // ── Add service flow ──────────────────────────────────────────────────
    if (input === 'sv_add') {
        await setState(from, STATE.ADD_NAME);
        await sendTextMessage(from, '💼 *New Service*\n\n*Step 1/4:* What is the service called?\n_e.g. "Box Braids", "Gents Cut", "Gel Overlay"_');
        return;
    }

    if (stateKey === STATE.ADD_NAME) {
        const name = input.trim();
        if (name.length < 2 || name.length > 60) {
            await sendTextMessage(from, '⚠️ Name must be 2–60 characters. Try again:');
            return;
        }
        const service = await db.service.create({
            data: { merchant_id: merchant.id, name, price: 0, is_active: false },
        });
        await setState(from, buildState(STATE.ADD_PRICE, service.id));
        await sendTextMessage(from, `✅ *${name}*\n\n*Step 2/4:* What does it cost? (just the number)\n_e.g. 350_`);
        return;
    }

    if (stateKey === STATE.ADD_PRICE && stateId) {
        const price = parseFloat(input.replace(/[Rr,\s]/g, ''));
        if (isNaN(price) || price < 0) {
            await sendTextMessage(from, '⚠️ Enter a valid price (e.g. 350 or 350.50):');
            return;
        }
        await db.service.update({ where: { id: stateId }, data: { price } });
        await setState(from, buildState(STATE.ADD_DURATION, stateId));
        await sendListMessage(from, `💰 ${fmt(price)}\n\n*Step 3/4:* How long does it take?`, '⏱️ Pick Duration', [
            { title: 'Duration', rows: [
                { id: 'sv_dur_30',  title: '30 minutes' },
                { id: 'sv_dur_45',  title: '45 minutes' },
                { id: 'sv_dur_60',  title: '1 hour' },
                { id: 'sv_dur_90',  title: '1.5 hours' },
                { id: 'sv_dur_120', title: '2 hours' },
                { id: 'sv_dur_180', title: '3 hours' },
                { id: 'sv_dur_240', title: '4 hours' },
            ]},
        ]);
        return;
    }

    if (stateKey === STATE.ADD_DURATION && stateId && input.startsWith('sv_dur_')) {
        const duration = parseInt(input.replace('sv_dur_', ''), 10) || 60;
        await db.service.update({ where: { id: stateId }, data: { duration_min: duration } });
        await setState(from, buildState(STATE.ADD_IMAGE, stateId));
        await sendButtons(from, `⏱️ ${duration} min\n\n*Step 4/4:* Send a photo of this service (your best work sells it!)`, [
            { id: 'sv_skip_image', title: '⏭️ Skip' },
        ]);
        return;
    }

    if (stateKey === STATE.ADD_IMAGE && stateId) {
        let imageUrl: string | null = null;
        if (message?.type === 'image' && message?.image?.id) {
            imageUrl = await persistWhatsAppImage(message.image.id, `services/${stateId}`);
        } else if (input !== 'sv_skip_image') {
            await sendButtons(from, '⚠️ Send a photo or skip.', [{ id: 'sv_skip_image', title: '⏭️ Skip' }]);
            return;
        }
        const service = await db.service.update({
            where: { id: stateId },
            data: { image_url: imageUrl, is_active: true },
        });
        await setState(from, null);
        await log(AuditAction.SERVICE_CREATED, from, 'Service', service.id, { name: service.name, price: service.price });
        await sendButtons(from,
            `🎉 *${service.name}* is live!\n\n${fmt(service.price)} • ${service.duration_min} min\n\nCustomers can now book it from your store.`,
            [
                { id: 'sv_add',      title: '➕ Add Another' },
                { id: 'm_services',  title: '💼 Services' },
                { id: 'm_dashboard', title: '🏠 Dashboard' },
            ]);
        return;
    }

    // ── View / manage one service ─────────────────────────────────────────
    if (input.startsWith('sv_view_')) {
        const id = input.replace('sv_view_', '');
        const s = await db.service.findUnique({ where: { id } });
        if (!s || s.merchant_id !== merchant.id) { await sendTextMessage(from, '❌ Service not found.'); return; }
        const upcoming = await db.booking.count({ where: { service_id: id, status: 'CONFIRMED', start_at: { gte: new Date() } } });
        await sendButtons(from,
            `💼 *${s.name}*\n💰 ${fmt(s.price)} • ⏱️ ${s.duration_min} min\n${s.is_active ? '🟢 Visible to customers' : '⚪ Hidden'}\n📅 ${upcoming} upcoming booking${upcoming === 1 ? '' : 's'}`,
            [
                { id: `sv_edit_${id}`,   title: '✏️ Edit' },
                { id: `sv_toggle_${id}`, title: s.is_active ? '🙈 Hide' : '👁️ Show' },
                { id: `sv_del_${id}`,    title: '🗑️ Delete' },
            ]);
        return;
    }

    if (input.startsWith('sv_toggle_')) {
        const id = input.replace('sv_toggle_', '');
        const s = await db.service.findUnique({ where: { id } });
        if (!s || s.merchant_id !== merchant.id) return;
        const updated = await db.service.update({ where: { id }, data: { is_active: !s.is_active } });
        await sendTextMessage(from, updated.is_active ? `🟢 *${s.name}* is now visible.` : `⚪ *${s.name}* is now hidden.`);
        await handleServiceActions(from, 'm_services', session, merchant);
        return;
    }

    if (input.startsWith('sv_del_')) {
        const id = input.replace('sv_del_', '');
        await sendButtons(from, '⚠️ Delete this service? Upcoming bookings will be cancelled and customers notified.', [
            { id: `sv_confirmdel_${id}`, title: '🗑️ Yes, delete' },
            { id: 'm_services',          title: '↩️ Keep it' },
        ]);
        return;
    }

    if (input.startsWith('sv_confirmdel_')) {
        const id = input.replace('sv_confirmdel_', '');
        const s = await db.service.findUnique({ where: { id } });
        if (!s || s.merchant_id !== merchant.id) return;
        const toCancel = await db.booking.findMany({
            where: { service_id: id, status: { in: ['PENDING', 'CONFIRMED'] }, start_at: { gte: new Date() } },
        });
        await db.booking.updateMany({
            where: { id: { in: toCancel.map(b => b.id) } },
            data: { status: 'CANCELLED', decline_reason: 'Service discontinued' },
        });
        await db.service.update({ where: { id }, data: { is_active: false, name: `${s.name} (deleted)` } });
        for (const b of toCancel) {
            await sendTextMessage(b.customer_wa_id,
                `😔 *Booking cancelled*\n\n*${merchant.trading_name}* is no longer offering *${s.name}*. Your booking on ${fmtDate(b.start_at)} has been cancelled. Sorry for the inconvenience!`);
        }
        await sendTextMessage(from, `🗑️ *${s.name}* deleted. ${toCancel.length} booking(s) cancelled and customers notified.`);
        await handleServiceActions(from, 'm_services', session, merchant);
        return;
    }

    // ── Edit service ──────────────────────────────────────────────────────
    if (input.startsWith('sv_edit_') && !input.startsWith('sv_edit_name_') && !input.startsWith('sv_edit_price_') && !input.startsWith('sv_edit_dur_')) {
        const id = input.replace('sv_edit_', '');
        await sendButtons(from, '✏️ What would you like to change?', [
            { id: `sv_edit_name_${id}`,  title: '📝 Name' },
            { id: `sv_edit_price_${id}`, title: '💰 Price' },
            { id: `sv_edit_dur_${id}`,   title: '⏱️ Duration' },
        ]);
        return;
    }

    if (input.startsWith('sv_edit_name_')) {
        const id = input.replace('sv_edit_name_', '');
        await setState(from, buildState(STATE.EDIT_NAME, id));
        await sendTextMessage(from, '📝 Type the new name:');
        return;
    }
    if (stateKey === STATE.EDIT_NAME && stateId) {
        const name = input.trim().substring(0, 60);
        await db.service.update({ where: { id: stateId }, data: { name } });
        await setState(from, null);
        await sendTextMessage(from, `✅ Renamed to *${name}*.`);
        await handleServiceActions(from, 'm_services', session, merchant);
        return;
    }

    if (input.startsWith('sv_edit_price_')) {
        const id = input.replace('sv_edit_price_', '');
        await setState(from, buildState(STATE.EDIT_PRICE, id));
        await sendTextMessage(from, '💰 Type the new price (number only):');
        return;
    }
    if (stateKey === STATE.EDIT_PRICE && stateId) {
        const price = parseFloat(input.replace(/[Rr,\s]/g, ''));
        if (isNaN(price) || price < 0) { await sendTextMessage(from, '⚠️ Enter a valid price:'); return; }
        await db.service.update({ where: { id: stateId }, data: { price } });
        await setState(from, null);
        await sendTextMessage(from, `✅ Price updated to ${fmt(price)}.`);
        await handleServiceActions(from, 'm_services', session, merchant);
        return;
    }

    if (input.startsWith('sv_edit_dur_')) {
        const id = input.replace('sv_edit_dur_', '');
        await setState(from, buildState(STATE.EDIT_DURATION, id));
        await sendListMessage(from, '⏱️ New duration:', 'Pick Duration', [
            { title: 'Duration', rows: [30, 45, 60, 90, 120, 180, 240].map(m => ({
                id: `sv_setdur_${m}`,
                title: m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`,
            })) },
        ]);
        return;
    }
    if (stateKey === STATE.EDIT_DURATION && stateId && input.startsWith('sv_setdur_')) {
        const duration = parseInt(input.replace('sv_setdur_', ''), 10) || 60;
        await db.service.update({ where: { id: stateId }, data: { duration_min: duration } });
        await setState(from, null);
        await sendTextMessage(from, `✅ Duration updated to ${duration} min.`);
        await handleServiceActions(from, 'm_services', session, merchant);
        return;
    }

    // ── Booking requests inbox ────────────────────────────────────────────
    if (input === 'bk_inbox') {
        const pending = await db.booking.findMany({
            where: { merchant_id: merchant.id, status: 'PENDING', start_at: { gte: new Date() } },
            include: { service: true },
            orderBy: { start_at: 'asc' },
            take: 5,
        });
        if (!pending.length) {
            await sendButtons(from, '🔔 *Booking Requests*\n\nNo pending requests — you\'re all caught up! 🎉', [
                { id: 'bk_diary',   title: '📅 My Diary' },
                { id: 'm_services', title: '💼 Services' },
            ]);
            return;
        }
        for (const b of pending) {
            await sendButtons(from,
                `🔔 *Booking Request*\n\n💼 ${b.service.name}\n👤 ${b.customer_name || b.customer_wa_id}\n📅 ${fmtDate(b.start_at)}\n🕐 ${fmtTime(b.start_at)} – ${fmtTime(b.end_at)}\n💰 ${fmt(b.service.price)}${b.note ? `\n📝 "${b.note}"` : ''}`,
                [
                    { id: `bk_accept_${b.id}`,  title: '✅ Accept' },
                    { id: `bk_decline_${b.id}`, title: '❌ Decline' },
                ]);
        }
        return;
    }

    if (input.startsWith('bk_accept_')) {
        const id = input.replace('bk_accept_', '');
        const b = await db.booking.findUnique({ where: { id }, include: { service: true } });
        if (!b || b.merchant_id !== merchant.id) { await sendTextMessage(from, '❌ Booking not found.'); return; }
        if (b.status !== 'PENDING') { await sendTextMessage(from, `ℹ️ This booking is already ${b.status.toLowerCase()}.`); return; }

        // Guard: refuse if it now clashes with a confirmed booking
        const clash = await db.booking.findFirst({
            where: {
                merchant_id: merchant.id, status: 'CONFIRMED', id: { not: id },
                start_at: { lt: b.end_at }, end_at: { gt: b.start_at },
            },
        });
        if (clash) {
            await sendButtons(from, '⚠️ This slot now clashes with another confirmed booking. Decline it and the customer can pick a new time.', [
                { id: `bk_decline_${id}`, title: '❌ Decline' },
            ]);
            return;
        }

        await db.booking.update({ where: { id }, data: { status: 'CONFIRMED' } });
        await log(AuditAction.BOOKING_CONFIRMED, from, 'Booking', id, { service: b.service.name, start_at: b.start_at });
        await sendTextMessage(from, `✅ Confirmed! *${b.service.name}* on ${fmtDate(b.start_at)} at ${fmtTime(b.start_at)}.`);
        await sendButtons(b.customer_wa_id,
            `🎉 *Booking confirmed!*\n\n*${merchant.trading_name}* accepted your booking:\n\n💼 ${b.service.name}\n📅 ${fmtDate(b.start_at)}\n🕐 ${fmtTime(b.start_at)}\n💰 ${fmt(b.service.price)}\n\n_You'll pay at your appointment. We'll remind you the day before._`,
            [{ id: 'c_my_bookings', title: '📅 My Bookings' }]);
        return;
    }

    if (input.startsWith('bk_decline_')) {
        const id = input.replace('bk_decline_', '');
        await setState(from, buildState(STATE.DECLINE_REASON, id));
        await sendButtons(from, '❌ *Decline booking*\n\nType a short reason for the customer, or pick one:', [
            { id: 'bk_reason_full',  title: '📅 Fully booked' },
            { id: 'bk_reason_away',  title: '🏝️ Not available' },
        ]);
        return;
    }

    if (stateKey === STATE.DECLINE_REASON && stateId) {
        let reason = input;
        if (input === 'bk_reason_full') reason = 'That time is fully booked';
        if (input === 'bk_reason_away') reason = 'Not available at that time';
        const b = await db.booking.findUnique({ where: { id: stateId }, include: { service: true } });
        await setState(from, null);
        if (!b || b.merchant_id !== merchant.id) return;
        await db.booking.update({ where: { id: stateId }, data: { status: 'REJECTED', decline_reason: reason.substring(0, 200) } });
        await sendTextMessage(from, `❌ Declined. The customer has been notified.`);
        await sendButtons(b.customer_wa_id,
            `😔 *Booking declined*\n\n*${merchant.trading_name}* couldn't accept your *${b.service.name}* booking for ${fmtDate(b.start_at)} ${fmtTime(b.start_at)}.\n\n💬 _"${reason}"_\n\nWant to pick a different time?`,
            [
                { id: `cbk_svc_${b.service_id}`, title: '📅 New Time' },
                { id: `@${merchant.handle}`,     title: '🏪 Back to Store' },
            ]);
        return;
    }

    // ── 7-day diary ───────────────────────────────────────────────────────
    if (input === 'bk_diary') {
        const now = new Date();
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const bookings = await db.booking.findMany({
            where: { merchant_id: merchant.id, status: 'CONFIRMED', start_at: { gte: startOfDay(now), lte: weekEnd } },
            include: { service: true },
            orderBy: { start_at: 'asc' },
        });
        if (!bookings.length) {
            await sendButtons(from, '📅 *My Diary — next 7 days*\n\nNo confirmed bookings yet. Share your store link to fill your calendar! 💪', [
                { id: 'bk_inbox',   title: '🔔 Requests' },
                { id: 'm_services', title: '💼 Services' },
            ]);
            return;
        }
        let body = '📅 *My Diary — next 7 days*\n';
        let currentDay = '';
        for (const b of bookings) {
            const day = fmtDate(b.start_at);
            if (day !== currentDay) { body += `\n*${day}*\n`; currentDay = day; }
            body += `  🕐 ${fmtTime(b.start_at)} — ${b.service.name} (${b.customer_name || b.customer_wa_id.slice(-4)})\n`;
        }
        await sendTextMessage(from, body);
        await sendListMessage(from, 'Tap a booking to manage it:', '🗂️ Manage', [
            { title: 'Confirmed Bookings', rows: bookings.slice(0, 10).map(b => ({
                id: `bk_manage_${b.id}`,
                title: `${fmtTime(b.start_at)} ${b.service.name}`.substring(0, 24),
                description: fmtDate(b.start_at),
            })) },
        ]);
        return;
    }

    if (input.startsWith('bk_manage_')) {
        const id = input.replace('bk_manage_', '');
        const b = await db.booking.findUnique({ where: { id }, include: { service: true } });
        if (!b || b.merchant_id !== merchant.id) return;
        await sendButtons(from,
            `📋 *${b.service.name}*\n👤 ${b.customer_name || b.customer_wa_id}\n📅 ${fmtDate(b.start_at)} ${fmtTime(b.start_at)}\n💰 ${fmt(b.service.price)}\nStatus: ${b.status}`,
            [
                { id: `bk_done_${id}`,    title: '✅ Mark Done' },
                { id: `bk_cancel_${id}`,  title: '❌ Cancel' },
                { id: 'bk_diary',         title: '📅 Diary' },
            ]);
        return;
    }

    if (input.startsWith('bk_done_')) {
        const id = input.replace('bk_done_', '');
        const b = await db.booking.findUnique({ where: { id }, include: { service: true } });
        if (!b || b.merchant_id !== merchant.id) return;
        await db.booking.update({ where: { id }, data: { status: 'COMPLETED' } });
        await sendTextMessage(from, `✅ *${b.service.name}* marked complete. Nice work!`);
        await sendButtons(b.customer_wa_id,
            `💜 Thanks for visiting *${merchant.trading_name}*!\n\nWe hope you loved your *${b.service.name}*. Book again any time!`,
            [{ id: `@${merchant.handle}`, title: '🏪 Visit Store' }]);
        return;
    }

    if (input.startsWith('bk_cancel_')) {
        const id = input.replace('bk_cancel_', '');
        const b = await db.booking.findUnique({ where: { id }, include: { service: true } });
        if (!b || b.merchant_id !== merchant.id) return;
        await db.booking.update({ where: { id }, data: { status: 'CANCELLED', decline_reason: 'Cancelled by merchant' } });
        await sendTextMessage(from, `❌ Booking cancelled. The customer has been notified.`);
        await sendButtons(b.customer_wa_id,
            `😔 *${merchant.trading_name}* had to cancel your *${b.service.name}* booking on ${fmtDate(b.start_at)} at ${fmtTime(b.start_at)}.\n\nWant to rebook?`,
            [{ id: `cbk_svc_${b.service_id}`, title: '📅 Rebook' }]);
        return;
    }

    // Fallback
    await handleServiceActions(from, 'm_services', session, merchant);
};

// ── Date helpers (SAST — UTC+2, no DST) ──────────────────────────────────────

export const SAST_OFFSET_MIN = 120;

export const fmtDate = (d: Date): string =>
    d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' });

export const fmtTime = (d: Date): string =>
    d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' });

export const startOfDay = (d: Date): Date => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};
