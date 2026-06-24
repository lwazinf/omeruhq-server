import 'dotenv/config';
import { PrismaClient, MerchantStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Stitch Money store...');

  const ownerWaId = '27741111002';

  const storeData = {
    trading_name: 'Stitch',
    description: 'One platform for every payment, wherever it happens — instant EFT, card, wallets, BNPL, recurring collections, and real-time payouts. Same infrastructure as TFG, Vodacom, Takealot, and MTN.',
    store_category: 'Tech & Electronics',
    address: 'The Colosseum, Century City, Cape Town, 7441',
    location_visible: true,
    status: MerchantStatus.ACTIVE,
    open_time: '08:00',
    close_time: '17:00',
    sat_open_time: '09:00',
    sat_close_time: '13:00',
    sun_open: false,
    show_in_browse: true,
    accepted_terms: true,
    services_enabled: true,
    welcome_message: 'Welcome to Stitch 👋 — SA\'s payments infrastructure. Accept Pay by Bank, card, wallets, BNPL and payouts through a single API. Live in one day.',
    currency: 'ZAR',
    locale: 'en-ZA',
    support_number: '27741111002',
  };

  const merchant = await prisma.merchant.upsert({
    where: { handle: 'stitchmoney' },
    update: storeData,
    create: { wa_id: ownerWaId, handle: 'stitchmoney', ...storeData },
  });

  console.log(`✅ Merchant: @${merchant.handle} (${merchant.id})`);

  await prisma.merchantOwner.upsert({
    where: { merchant_id_wa_id: { merchant_id: merchant.id, wa_id: ownerWaId } },
    update: {},
    create: { merchant_id: merchant.id, wa_id: ownerWaId, role: 'OWNER' },
  });

  await prisma.userSession.upsert({
    where: { wa_id: ownerWaId },
    update: { mode: 'MERCHANT', active_merchant_id: merchant.id },
    create: { wa_id: ownerWaId, mode: 'MERCHANT', active_merchant_id: merchant.id },
  });

  // ── Product categories ─────────────────────────────────────────────────────
  const existing = await prisma.category.findMany({ where: { merchant_id: merchant.id } });
  const catNames = existing.map(c => c.name);

  const ensureCat = async (name: string) => {
    if (catNames.includes(name)) return existing.find(c => c.name === name)!;
    return prisma.category.create({ data: { merchant_id: merchant.id, name } });
  };

  const [catPlan, catAPI, catTools] = await Promise.all([
    ensureCat('Subscription Plans'),
    ensureCat('Payment APIs'),
    ensureCat('Developer Tools'),
  ]);

  console.log('✅ Categories created');

  // ── Products ───────────────────────────────────────────────────────────────
  const products = [
    // Subscription plans
    {
      name: 'Stitch Starter',
      description: 'Everything a growing SA business needs to accept payments online. Includes Pay by Bank (instant EFT), card payments (Visa/Mastercard), and a hosted checkout page. Pay as you go — no monthly fee.',
      price: 0,
      category_id: catPlan.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Stitch Growth',
      description: 'Built for businesses processing R500k+ per month. Lower per-transaction rates, dedicated account manager, priority support SLA, and access to disbursements and debit order products.',
      price: 199900,
      category_id: catPlan.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Stitch Enterprise',
      description: 'Custom pricing and SLAs for high-volume platforms, fintechs, and marketplaces. Includes full suite: Pay by Bank, card, digital wallets, BNPL, DebiCheck, payouts, and float facility. Volume discounts negotiated directly.',
      price: 0,
      category_id: catPlan.id,
      status: 'ACTIVE' as const,
    },

    // Payment APIs
    {
      name: 'Pay by Bank API',
      description: 'Instant EFT via Capitec Pay, Absa Pay, and Nedbank Direct EFT. Real-time payment confirmation, no redirects, no OTPs. Customers pay directly from their banking app. Settlement T+1.',
      price: 0,
      category_id: catAPI.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Card Payments API',
      description: 'Accept Visa, Mastercard, Apple Pay, Google Pay and Samsung Pay. Built-in 3DS2, automated fraud prevention, optimised routing across acquirers. PCI-DSS compliant.',
      price: 0,
      category_id: catAPI.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Instant Payouts API',
      description: '24/7 real-time disbursements to any SA bank account. Powers withdrawals, refunds, marketplace splits, and bulk salary runs. Includes float facility for high-frequency payout businesses.',
      price: 0,
      category_id: catAPI.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'DebiCheck API',
      description: 'Authenticated recurring collections via DebiCheck — authenticated by the customer\'s bank at mandate creation. Reduces unpaid mandates, cuts chargebacks, and provides real-time mandate status.',
      price: 0,
      category_id: catAPI.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Buy Now Pay Later (BNPL)',
      description: 'Merchant-first BNPL: offer flexible payment terms at checkout with zero credit risk to you. Stitch underwrites the instalment plan. Customers pay in 3 or 6 instalments. Increase basket size by up to 30%.',
      price: 0,
      category_id: catAPI.id,
      status: 'ACTIVE' as const,
    },

    // Developer tools
    {
      name: 'Stitch Dashboard',
      description: 'Unified operations dashboard for finance and product teams. Live transaction feed, dispute management, payout scheduling, reconciliation exports (CSV/SFTP), and webhook log inspector.',
      price: 0,
      category_id: catTools.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Hosted Checkout',
      description: 'Drop a single link or embed a pre-built checkout into any website or app in minutes. No front-end development needed. Supports all Stitch payment methods in one flow.',
      price: 0,
      category_id: catTools.id,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Stitch.js SDK',
      description: 'Front-end JavaScript SDK for custom checkout experiences. Accept card, Pay by Bank, and wallets from your own UI. Tokenises sensitive data client-side — keeps your stack out of PCI scope.',
      price: 0,
      category_id: catTools.id,
      status: 'ACTIVE' as const,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { merchant_id: merchant.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({ data: { ...p, merchant_id: merchant.id } });
      console.log(`  ➕ Product: ${p.name}`);
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: { description: p.description, price: p.price, category_id: p.category_id },
      });
      console.log(`  ✏️  Updated: ${p.name}`);
    }
  }

  console.log('✅ Products created/updated');

  // ── Services ───────────────────────────────────────────────────────────────
  const services = [
    {
      name: 'Payments Discovery Call',
      description: 'Free 30-minute call with a Stitch solutions engineer to assess your payment needs, transaction volumes, and tech stack — then recommend the right Stitch products for your business.',
      price: 0,
      duration_min: 30,
      is_active: true,
    },
    {
      name: 'Pay by Bank Integration Session',
      description: 'Hands-on 2-hour integration session with a Stitch engineer. We\'ll walk through the API, set up your test environment, and get instant EFT running end-to-end in your stack.',
      price: 12000,
      duration_min: 120,
      is_active: true,
    },
    {
      name: 'Card & Digital Wallets Setup',
      description: 'End-to-end card integration: Visa, Mastercard, Apple Pay, Google Pay, Samsung Pay. Includes 3DS2 configuration, fraud rules, and acquirer optimisation for your business type.',
      price: 9500,
      duration_min: 90,
      is_active: true,
    },
    {
      name: 'Instant Payouts API Setup',
      description: 'Full implementation of real-time disbursements to SA bank accounts. Covers authentication, idempotency keys, float setup, and reconciliation webhook configuration.',
      price: 7500,
      duration_min: 60,
      is_active: true,
    },
    {
      name: 'DebiCheck & Recurring Billing Setup',
      description: 'Authenticated debit order implementation with DebiCheck mandate flow. Reduces unpaid rates and chargebacks. Includes test-environment walkthrough and go-live checklist.',
      price: 8500,
      duration_min: 90,
      is_active: true,
    },
    {
      name: 'Enterprise Integration Review',
      description: 'Architecture review for platforms processing R1m+/month. Covers security posture, PCI scope, webhook reliability, settlement timing, and volume pricing negotiation.',
      price: 25000,
      duration_min: 180,
      is_active: true,
    },
  ];

  // Delete old services and re-create (cleanest approach for a demo seed)
  await prisma.service.deleteMany({ where: { merchant_id: merchant.id } });
  await prisma.service.createMany({
    data: services.map(s => ({ ...s, merchant_id: merchant.id })),
  });

  console.log('✅ Services created');
  console.log('\n🎉 Done!');
  console.log(`   WhatsApp bot: type @stitchmoney`);
  console.log(`   Web storefront: https://omeru.io/@stitchmoney`);
  console.log(`   Local preview: http://localhost:3002/@stitchmoney`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
