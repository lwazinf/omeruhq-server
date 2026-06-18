import { Merchant } from '@prisma/client';
import { sendButtons, sendTextMessage } from './sender';
import { formatCurrency } from './messageTemplates';
import { getPlatformBranding } from './platformBranding';
import { db } from '../../lib/db';

type MerchantStats = {
    salesTotal: number;
    sales7d: number;
    sales30d: number;
    orders7d: number;
    pendingOrders: number;
    activeProducts: number;
    archivedProducts: number;
    customerCount: number;
    upcomingBookings: number;
    topProducts: Array<{ name: string; qty: number }>;
    recentOrders: Array<{ id: string; total: number; status: string; createdAt: Date }>;
};

export const getMerchantStats = async (merchantId: string): Promise<MerchantStats> => {
    const PAID_STATES = ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as any;
    const d7  = new Date(Date.now() - 7  * 86400000);
    const d30 = new Date(Date.now() - 30 * 86400000);

    const [
        salesTotal,
        pendingOrders,
        activeProducts,
        archivedProducts,
        recentOrders,
        sales7dAgg,
        sales30dAgg,
        orders7d,
        customerCount,
        upcomingBookings,
        topItems
    ] = await Promise.all([
        db.order.aggregate({
            where: {
                merchant_id: merchantId,
                status: { in: ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] }
            },
            _sum: { total: true }
        }),
        db.order.count({
            where: {
                merchant_id: merchantId,
                status: { in: ['PENDING', 'PAID'] }
            }
        }),
        db.product.count({
            where: { merchant_id: merchantId, status: 'ACTIVE' }
        }),
        db.product.count({
            where: { merchant_id: merchantId, status: { not: 'ACTIVE' } }
        }),
        db.order.findMany({
            where: { merchant_id: merchantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true
            }
        }),
        db.order.aggregate({
            where: { merchant_id: merchantId, status: { in: PAID_STATES }, createdAt: { gte: d7 } },
            _sum: { total: true }
        }),
        db.order.aggregate({
            where: { merchant_id: merchantId, status: { in: PAID_STATES }, createdAt: { gte: d30 } },
            _sum: { total: true }
        }),
        db.order.count({ where: { merchant_id: merchantId, createdAt: { gte: d7 } } }),
        db.merchantCustomer.count({ where: { merchant_id: merchantId } }),
        db.booking.count({
            where: { merchant_id: merchantId, status: 'CONFIRMED', start_at: { gte: new Date() } }
        }),
        db.orderItem.groupBy({
            by: ['product_id'],
            where: { order: { merchant_id: merchantId, status: { in: PAID_STATES }, createdAt: { gte: d30 } } },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 3
        })
    ]);

    // Resolve top product names
    const topProducts: Array<{ name: string; qty: number }> = [];
    if (topItems.length) {
        const products = await db.product.findMany({
            where: { id: { in: topItems.map(t => t.product_id) } },
            select: { id: true, name: true }
        });
        const nameById = new Map(products.map(p => [p.id, p.name]));
        for (const t of topItems) {
            topProducts.push({ name: nameById.get(t.product_id) || 'Unknown', qty: t._sum.quantity ?? 0 });
        }
    }

    return {
        salesTotal: salesTotal._sum.total ?? 0,
        sales7d:  sales7dAgg._sum.total ?? 0,
        sales30d: sales30dAgg._sum.total ?? 0,
        orders7d,
        pendingOrders,
        activeProducts,
        archivedProducts,
        customerCount,
        upcomingBookings,
        topProducts,
        recentOrders
    };
};

export const showMerchantDashboard = async (to: string, merchant: Merchant): Promise<void> => {
    try {
        // Clear any active state
        await db.userSession.update({
            where: { wa_id: to },
            data: { active_prod_id: null }
        });

        const platformBranding = await getPlatformBranding(db);
        const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: merchant.id } });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [pendingCount, todayOrders, todayRevenue] = await Promise.all([
            db.order.count({
                where: { merchant_id: merchant.id, status: { in: ['PENDING', 'PAID'] } }
            }),
            db.order.count({
                where: { merchant_id: merchant.id, createdAt: { gte: todayStart } }
            }),
            db.order.aggregate({
                where: {
                    merchant_id: merchant.id,
                    createdAt: { gte: todayStart },
                    status: { in: ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] }
                },
                _sum: { total: true }
            })
        ]);

        const statusBadge = merchant.manual_closed ? '🔴 Closed' : '🟢 Open';
        const revenueToday = todayRevenue._sum.total ?? 0;

        let card = `🏪 *${merchant.trading_name}*  ${statusBadge}\n`;
        card += `━━━━━━━━━━━━━━━━━━━━\n`;
        card += `📅 *Today*\n`;
        card += `Orders:   ${todayOrders}  |  Pending: ${pendingCount}\n`;
        card += `Revenue:  ${formatCurrency(revenueToday, { merchant, merchantBranding, platform: platformBranding })}\n`;
        card += `━━━━━━━━━━━━━━━━━━━━`;

        const kitchenTitle = pendingCount > 0 ? `🍳 Kitchen (${pendingCount})` : '🍳 Kitchen';

        const toggleTitle = merchant.manual_closed ? '🔓 Open Shop' : '🔒 Close Shop';
        await sendButtons(to, card, [
            { id: 'm_kitchen', title: kitchenTitle.substring(0, 20) },
            { id: 'm_inventory', title: '📦 Products' },
            { id: 'dash_toggle', title: toggleTitle }
        ]);
        const pendingBookings = await db.booking.count({
            where: { merchant_id: merchant.id, status: 'PENDING', start_at: { gte: new Date() } }
        });
        await sendButtons(to, '⚡ More:', [
            { id: 'm_services', title: pendingBookings > 0 ? `💼 Services (${pendingBookings})`.substring(0, 20) : '💼 Services' },
            { id: 'm_stats', title: '📊 Stats' },
            { id: 'm_settings', title: '🛠️ Settings' }
        ]);
        await sendButtons(to, '📣 Reach your customers:', [
            { id: 'm_broadcast', title: '📣 Broadcast' }
        ]);
        await sendButtons(to, '💬 Got feedback?', [
            { id: 'm_feedback', title: '💬 Send Feedback' }
        ]);

    } catch (error: any) {
        console.error(`❌ Dashboard Error: ${error.message}`);
        await sendTextMessage(to, '⚠️ Error loading dashboard.');
    }
};
