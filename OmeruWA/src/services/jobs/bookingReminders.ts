import { db } from '../../lib/db';
import { sendTextMessage } from '../whatsapp/sender';
import { fmtDate, fmtTime } from '../whatsapp/merchantServices';

/**
 * Booking reminders — runs hourly from index.ts.
 *
 * Sends a single reminder to both the customer and the merchant for every
 * CONFIRMED booking starting within the next 24 hours. `reminded_at` guards
 * against duplicates, so re-runs and restarts are safe.
 */
export const sendBookingReminders = async (): Promise<void> => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = await db.booking.findMany({
        where: {
            status: 'CONFIRMED',
            reminded_at: null,
            start_at: { gte: now, lte: windowEnd },
        },
        include: { service: true, merchant: true },
        take: 50,
    });

    for (const b of upcoming) {
        try {
            await sendTextMessage(b.customer_wa_id,
                `⏰ *Reminder!*\n\nYou have a *${b.service.name}* booking at *${b.merchant.trading_name}* on ${fmtDate(b.start_at)} at ${fmtTime(b.start_at)}.\n\n📍 ${b.merchant.address || 'Ask the merchant for directions'}\n\n_Need to cancel? Open My Bookings._`);
            await sendTextMessage(b.merchant.wa_id,
                `⏰ *Upcoming booking*\n\n${b.service.name} — ${b.customer_name || b.customer_wa_id}\n${fmtDate(b.start_at)} at ${fmtTime(b.start_at)}`);
            await db.booking.update({ where: { id: b.id }, data: { reminded_at: now } });
        } catch (err: any) {
            console.error(`❌ Booking reminder failed for ${b.id}: ${err.message}`);
        }
    }

    if (upcoming.length) console.log(`⏰ Sent ${upcoming.length} booking reminder(s)`);
};
