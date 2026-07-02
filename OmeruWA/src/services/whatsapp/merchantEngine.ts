import { Merchant, UserSession } from '@prisma/client';
import { handleInventoryActions } from './merchantInventory';
import { handleKitchenActions } from './merchantKitchen';
import { handleSettingsActions } from './merchantSettings';
import { getMerchantStats, showMerchantDashboard } from './merchantDashboard';
import { handleBroadcastActions } from './merchantBroadcast';
import { handleServiceActions } from './merchantServices';
import { handleOnboardingAction, startOnboarding } from './onboardingEngine';
import { sendButtons, sendTextMessage, sendListMessage } from './sender';
import { formatCurrency } from './messageTemplates';
import { getPlatformBranding } from './platformBranding';
import { merchantActionsViaHQ, hqUrl } from '../../config/mode';
import { db } from '../../lib/db';
import { log, AuditAction } from './auditLog';

const INVENTORY_PREFIXES = [
    'm_inventory',
    'm_categories',
    'cat_add',
    'cat_',
    'select_cat_',
    'edit_category_',
    'p_',
    'm_add_',
    'conf_',
    'toggle_',
    'delete_prod_',
    'edit_prod_',
    'skip_image',
    'cancel_delete',
    'confirm_del_',
    'view_variants_',
    'add_variant_',
    'edit_variant_',
    'variant_field_',
    'variant_delete_',
    'm_archived',
    'arch_',
    'prod_edit_',
    'prod_clear_img_',
    'cancel_prod_img',
    'p_view_all_p'
];
const KITCHEN_PREFIXES = ['m_kitchen', 'k_', 'ready_', 'collected_', 'view_kitchen_', 'cancel_order_', 'confirm_cancel_', 'abort_cancel_', 'm_reviews', 'm_reviews_p'];
const SETTINGS_PREFIXES = ['m_settings', 's_', 'h_', 'm_edit_hours', 'ob_hours', 's_browse_toggle', 's_welcome_img', 's_clear_welcome_img', 'mcat_'];
const BROADCAST_PREFIXES = ['m_broadcast', 'b_'];
const SERVICE_PREFIXES = ['m_services', 'sv_', 'bk_'];
const SVC_APP_PREFIXES = ['m_svc_apply', 'sapp_'];

const SVC_CATEGORIES: Record<string, string> = {
    sapp_appointments: 'Appointments & Bookings',
    sapp_professional: 'Professional Services',
    sapp_beauty:       'Beauty & Wellness',
    sapp_food:         'Food & Catering',
    sapp_events:       'Events & Entertainment',
    sapp_other:        'Other / Custom',
};

export const handleMerchantAction = async (
    from: string, 
    input: string, 
    session: UserSession, 
    merchant: Merchant, 
    message?: any
): Promise<void> => {
    try {
        const platformBranding = await getPlatformBranding(db);
        const merchantBranding = await db.merchantBranding.findUnique({ where: { merchant_id: merchant.id } });

        // ── Guided onboarding routing ────────────────────────────────────────
        // Any message while active_prod_id starts with 'ob' routes to onboarding engine
        if (session.active_prod_id?.startsWith('ob')) {
            await handleOnboardingAction(from, input, session, merchant, message);
            return;
        }

        // ONBOARDING merchants with no active flow: show "Resume Setup" for menu/dashboard,
        // or resume automatically if returning from product/variant creation
        if (merchant.status === 'ONBOARDING') {
            const isMenuRequest = input === 'm_dashboard' || input.toLowerCase() === 'menu' || input.toLowerCase() === 'home';
            const isResumeRequest = input === 'ob_resume';

            if (isResumeRequest || (!session.active_prod_id && merchant.onboarding_step)) {
                await startOnboarding(from, merchant, 'OWNER');
                return;
            }

            if (isMenuRequest) {
                await sendButtons(from,
                    `⚙️ *${merchant.trading_name}* — Setup in progress\n\nYour store isn't live yet. Let's finish setting it up!`,
                    [{ id: 'ob_resume', title: '▶️ Resume Setup' }]
                );
                return;
            }
        }

        // ── WhatsApp Lite for merchants ──────────────────────────────────────
        // When MERCHANT_ACTIONS_VIA_HQ is on, active merchants keep a light
        // taste of their store on WhatsApp — today's numbers at a glance and
        // broadcasts — while the full picture (catalogue, orders, analytics,
        // settings) lives in Omeru HQ. Onboarding above still completes here,
        // go-live acceptance below still works, and outbound notifications
        // (sale alerts etc.) are unaffected by this gate.
        if (merchantActionsViaHQ() && merchant.status === 'ACTIVE' && !input.startsWith('ob_golive_accept_')) {
            const lower = input.toLowerCase();

            // Broadcasts remain fully available on WhatsApp
            if (matchesPrefix(input, BROADCAST_PREFIXES) || session.active_prod_id === 'BROADCAST_MESSAGE') {
                await handleBroadcastActions(from, input, session, merchant);
                return;
            }

            // Daily snapshot — the teaser dashboard
            if (input === 'm_dashboard' || input === 'm_stats' || lower === 'menu' || lower === 'home' || lower === 'stats') {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const [todayAgg, todayCount, pendingCount] = await Promise.all([
                    db.order.aggregate({
                        where: { merchant_id: merchant.id, createdAt: { gte: startOfDay }, status: { in: ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as any } },
                        _sum: { total: true },
                    }),
                    db.order.count({
                        where: { merchant_id: merchant.id, createdAt: { gte: startOfDay }, status: { in: ['PAID', 'READY_FOR_PICKUP', 'COMPLETED'] as any } },
                    }),
                    db.order.count({ where: { merchant_id: merchant.id, status: { in: ['PENDING', 'PAID'] as any } } }),
                ]);
                const todayRevenue = todayAgg._sum.total ?? 0;
                await sendButtons(from,
                    `🏪 *${merchant.trading_name}* — Today\n\n` +
                    `💰 Sales today: *${formatCurrency(todayRevenue, { merchant })}* (${todayCount} order${todayCount === 1 ? '' : 's'})\n` +
                    `📦 Open orders: *${pendingCount}*\n\n` +
                    `📈 Your full picture — live analytics, top products, customers, order management — is waiting in *Omeru HQ*:\n${hqUrl()}`,
                    [
                        { id: 'm_broadcast', title: '📣 Send Broadcast' },
                        { id: 'm_dashboard', title: '🔄 Refresh' },
                    ]
                );
                return;
            }

            // Everything else: point to the full merchant suite
            await sendTextMessage(from,
                `🏪 *${merchant.trading_name}*\n\n` +
                `That lives in *Omeru HQ* — your full merchant suite for products, orders, customers, analytics and settings:\n\n${hqUrl()}\n\n` +
                `Here on WhatsApp you'll keep getting sale alerts, plus type *menu* for today's numbers or *broadcast* to message your customers.`
            );
            return;
        }

        // Going-live disclaimer acceptance (end of old onboarding — kept for backward compat)
        if (input.startsWith('ob_golive_accept_')) {
            const activatedMerchant = await db.merchant.update({
                where: { id: merchant.id },
                data: { status: 'ACTIVE' }
            });
            await log(AuditAction.STORE_WENT_LIVE, from, 'Merchant', merchant.id, {
                merchant_name: activatedMerchant.trading_name, handle: activatedMerchant.handle
            });
            await sendButtons(from,
                `🎉 *${activatedMerchant.trading_name} is now LIVE!*\n\n` +
                `Customers can find you at *@${activatedMerchant.handle}*.\n\n` +
                `Welcome to Omeru! 🛍️`,
                [
                    { id: 'm_inventory', title: '📦 My Products' },
                    { id: 'm_dashboard', title: '🏪 Dashboard' }
                ]
            );
            return;
        }

        // Quick open/close toggle from dashboard
        if (input === 'dash_toggle') {
            const updated = await db.merchant.update({
                where: { id: merchant.id },
                data: { manual_closed: !merchant.manual_closed }
            });
            await sendTextMessage(from, `🚦 Shop is now ${updated.manual_closed ? '*CLOSED* 🔴' : '*OPEN* 🟢'}`);
            await showMerchantDashboard(from, updated);
            return;
        }

        // Dashboard
        if (input === 'm_dashboard' || input.toLowerCase() === 'menu' || input.toLowerCase() === 'home') {
            await showMerchantDashboard(from, merchant);
            return;
        }

        // Feedback to platform admin
        if (input === 'm_feedback') {
            await db.userSession.update({
                where: { wa_id: from },
                data: { active_prod_id: 'MERCHANT_FEEDBACK_MSG', state: null }
            });
            await sendTextMessage(from,
                `💬 *Send Feedback to Platform*\n\n` +
                `Type your message below. It will be sent directly to the platform admin.\n\n` +
                `_Type "Omeru" to cancel._`
            );
            return;
        }

        // Capture feedback text
        if (session.active_prod_id === 'MERCHANT_FEEDBACK_MSG') {
            await db.auditLog.create({
                data: {
                    actor_wa_id: from,
                    action: 'MERCHANT_FEEDBACK',
                    entity_type: 'merchant',
                    entity_id: merchant.id,
                    metadata_json: { message: input, merchant_name: merchant.trading_name }
                }
            });
            await db.userSession.update({
                where: { wa_id: from },
                data: { active_prod_id: null, state: null }
            });
            await sendButtons(from,
                `✅ *Feedback sent!*\n\nThank you — the platform team will review your message.`,
                [{ id: 'm_dashboard', title: '🏠 Dashboard' }]
            );
            return;
        }

        if (input === 'm_stats') {
            const stats = await getMerchantStats(merchant.id);
            const fmt = (n: number) => formatCurrency(n, { merchant, merchantBranding, platform: platformBranding });

            let summary = `📊 *${merchant.trading_name} — Performance*\n`;
            summary += `━━━━━━━━━━━━━━━━━━━━\n`;
            summary += `💰 *Revenue*\n`;
            summary += `Last 7 days:   ${fmt(stats.sales7d)}\n`;
            summary += `Last 30 days:  ${fmt(stats.sales30d)}\n`;
            summary += `All time:      ${fmt(stats.salesTotal)}\n`;
            summary += `━━━━━━━━━━━━━━━━━━━━\n`;
            summary += `📦 Orders (7d): ${stats.orders7d}  •  Pending: ${stats.pendingOrders}\n`;
            summary += `👥 Customers: ${stats.customerCount}\n`;
            summary += `📅 Upcoming bookings: ${stats.upcomingBookings}\n`;
            summary += `🛍️ Products: ${stats.activeProducts} live, ${stats.archivedProducts} archived\n`;

            if (stats.topProducts.length > 0) {
                summary += `\n🏆 *Top sellers (30d)*\n`;
                stats.topProducts.forEach((p, i) => {
                    summary += `${['🥇','🥈','🥉'][i] || '•'} ${p.name} — ${p.qty} sold\n`;
                });
            }

            if (stats.recentOrders.length > 0) {
                summary += `\n🧾 *Recent orders*\n`;
                stats.recentOrders.forEach(order => {
                    summary += `• #${order.id.slice(-5)} • ${fmt(order.total)} • ${order.status}\n`;
                });
            }

            await sendTextMessage(from, summary);
            await sendButtons(from, 'Actions:', [
                { id: 'm_dashboard', title: '🏠 Dashboard' },
                { id: 'm_broadcast', title: '📣 Broadcast' },
                { id: 'm_kitchen', title: '🍳 Kitchen' }
            ]);
            return;
        }

        // Stale order shortcut from cron alerts
        if (input.startsWith('view_kitchen_')) {
            const orderId = input.replace('view_kitchen_', '');
            const order = await db.order.findUnique({
                where: { id: orderId },
                include: { order_items: { include: { product: true } } }
            });

            if (!order || order.merchant_id !== merchant.id) {
                await sendTextMessage(from, '❌ Order not found.');
                return;
            }

            let summary = `📋 *Order #${order.id.slice(-5)}*\n\n`;
            order.order_items.forEach(item => {
                summary += `• ${item.quantity}x ${item.product?.name || 'Item'}\n`;
            });
            summary += `\n💰 Total: ${formatCurrency(order.total, { merchant, merchantBranding, platform: platformBranding })}`;

            await sendButtons(from, summary, [
                { id: `ready_${order.id}`, title: '✅ Mark Ready' },
                { id: 'm_kitchen', title: '🍳 Kitchen' }
            ]);
            return;
        }

        // Route to sub-modules
        if (matchesPrefix(input, INVENTORY_PREFIXES)) {
            await handleInventoryActions(from, input, session, merchant, message);
            return;
        }

        if (matchesPrefix(input, KITCHEN_PREFIXES)) {
            await handleKitchenActions(from, input, session, merchant);
            return;
        }

        if (matchesPrefix(input, SETTINGS_PREFIXES)) {
            await handleSettingsActions(from, input, session, merchant, message);
            return;
        }

        if (matchesPrefix(input, BROADCAST_PREFIXES)) {
            await handleBroadcastActions(from, input, session, merchant);
            return;
        }

        // Services gate — must be explicitly enabled by platform admin
        if (matchesPrefix(input, SVC_APP_PREFIXES) || session.active_prod_id === 'SVC_APP_DESC') {
            await handleServiceApplication(from, input, session, merchant);
            return;
        }

        if (matchesPrefix(input, SERVICE_PREFIXES) || (session.active_prod_id || '').startsWith('SV_') || (session.active_prod_id || '').startsWith('BK_')) {
            if (!(merchant as any).services_enabled) {
                await sendButtons(from,
                    `💼 *Services not yet enabled*\n\n` +
                    `Offering bookable services on Omeru requires platform approval. ` +
                    `Apply now — approvals are reviewed within 24 hours.`,
                    [
                        { id: 'm_svc_apply', title: '📋 Apply for Services' },
                        { id: 'm_dashboard', title: '🏠 Dashboard' }
                    ]
                );
                return;
            }
            await handleServiceActions(from, input, session, merchant, message);
            return;
        }

        // Check for active flow state
        if (session.active_prod_id === 'BROADCAST_MESSAGE') {
            await handleBroadcastActions(from, input, session, merchant);
            return;
        }

        if (session.active_prod_id) {
            await handleInventoryActions(from, input, session, merchant, message);
            return;
        }

        // Default to dashboard
        await showMerchantDashboard(from, merchant);

    } catch (error: any) {
        console.error(`❌ Merchant Engine Error: ${error.message}`);
        await sendTextMessage(from, '⚠️ Something went wrong.');
        await showMerchantDashboard(from, merchant);
    }
};

const handleServiceApplication = async (
    from: string,
    input: string,
    session: UserSession,
    merchant: Merchant
): Promise<void> => {
    // Entry — show intro and category picker
    if (input === 'm_svc_apply') {
        const pending = await db.serviceApplication.findFirst({
            where: { merchant_id: merchant.id, status: 'PENDING' }
        });
        if (pending) {
            await sendButtons(from,
                `⏳ *Application already submitted*\n\n` +
                `Your services application is under review. The platform team will respond within 24 hours.`,
                [{ id: 'm_dashboard', title: '🏠 Dashboard' }]
            );
            return;
        }
        await sendListMessage(from,
            `💼 *Apply for Services*\n\n` +
            `Services let customers book appointments, consultations, or time slots directly through WhatsApp.\n\n` +
            `Platform approval is required. Select the category that best describes your services:`,
            '📂 Select Category',
            [{
                title: 'Service Categories',
                rows: [
                    { id: 'sapp_appointments', title: '📅 Appointments',         description: 'Haircuts, repairs, consultations' },
                    { id: 'sapp_professional', title: '👔 Professional Services', description: 'Legal, accounting, coaching' },
                    { id: 'sapp_beauty',       title: '💄 Beauty & Wellness',     description: 'Salons, spas, therapists' },
                    { id: 'sapp_food',         title: '🍽️ Food & Catering',      description: 'Meal prep, private chef, events' },
                    { id: 'sapp_events',       title: '🎉 Events & Entertainment', description: 'Photography, DJs, hosting' },
                    { id: 'sapp_other',        title: '🔧 Other / Custom',        description: 'Something else' },
                ]
            }]
        );
        return;
    }

    // Category selected — ask for description
    if (input in SVC_CATEGORIES) {
        const category = SVC_CATEGORIES[input];
        await db.userSession.update({
            where: { wa_id: from },
            data: { active_prod_id: 'SVC_APP_DESC', state: JSON.stringify({ category }) }
        });
        await sendTextMessage(from,
            `✏️ *Describe your services*\n\n` +
            `Category: *${category}*\n\n` +
            `In 1–3 sentences, tell us:\n` +
            `• What specific services you'll offer\n` +
            `• How often customers typically book\n` +
            `• Your rough price range\n\n` +
            `_Type "cancel" to go back._`
        );
        return;
    }

    // Description captured — create application
    if (session.active_prod_id === 'SVC_APP_DESC') {
        if (input.toLowerCase() === 'cancel') {
            await db.userSession.update({ where: { wa_id: from }, data: { active_prod_id: null, state: null } });
            await showMerchantDashboard(from, merchant);
            return;
        }
        if (input.trim().length < 10) {
            await sendTextMessage(from, '⚠️ Please describe your services in at least 10 characters.');
            return;
        }

        let category = 'Other';
        try {
            const stateObj = JSON.parse(session.state as string || '{}');
            category = stateObj.category || 'Other';
        } catch { /* ignore parse errors */ }

        await db.serviceApplication.create({
            data: {
                merchant_id: merchant.id,
                svc_category: category,
                description: input.trim().substring(0, 500),
                status: 'PENDING',
            }
        });

        await db.userSession.update({ where: { wa_id: from }, data: { active_prod_id: null, state: null } });

        // Notify platform admins
        const adminNumbers = (process.env.PLATFORM_ADMIN_NUMBERS || '').split(',').filter(Boolean);
        for (const adminWaId of adminNumbers) {
            await sendButtons(adminWaId,
                `📋 *New Services Application*\n\n` +
                `Store: *${merchant.trading_name}* (@${merchant.handle})\n` +
                `Category: ${category}\n\n` +
                `"${input.trim().substring(0, 200)}"\n\n` +
                `_Review from the admin panel._`,
                [{ id: 'pa_svc_apps', title: '📋 Review Applications' }]
            );
        }

        await sendButtons(from,
            `✅ *Application submitted!*\n\n` +
            `Your services application is under review. ` +
            `The platform team will respond within 24 hours. ` +
            `You'll receive a WhatsApp notification with the outcome.`,
            [{ id: 'm_dashboard', title: '🏠 Back to Dashboard' }]
        );
    }
};

const matchesPrefix = (input: string, prefixes: string[]): boolean => {
    return prefixes.some(p => input === p || input.startsWith(p));
};
