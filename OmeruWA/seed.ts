import 'dotenv/config';
import { PrismaClient, MerchantStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo store...');

  const ownerWaId = '27740000001';

  // Merchant
  const merchant = await prisma.merchant.upsert({
    where: { handle: 'bakehaus' },
    update: {},
    create: {
      wa_id: ownerWaId,
      handle: 'bakehaus',
      trading_name: 'Bakehaus',
      description: 'Artisan breads, pastries, and custom cakes baked fresh every morning in Cape Town. Order ahead on WhatsApp for same-day pickup.',
      store_category: 'Bakery & Café',
      address: '14 Kloof Street, Gardens, Cape Town',
      location_visible: true,
      status: MerchantStatus.ACTIVE,
      open_time: '07:00',
      close_time: '17:00',
      sat_open_time: '08:00',
      sat_close_time: '14:00',
      sun_open: false,
      show_in_browse: true,
      accepted_terms: true,
      welcome_message: 'Welcome to Bakehaus 🥐 — what can we bake for you today?',
    },
  });

  console.log(`✅ Merchant: @${merchant.handle} (${merchant.id})`);

  // MerchantOwner
  await prisma.merchantOwner.upsert({
    where: { merchant_id_wa_id: { merchant_id: merchant.id, wa_id: ownerWaId } },
    update: {},
    create: { merchant_id: merchant.id, wa_id: ownerWaId, role: 'OWNER' },
  });

  // UserSession for the owner
  await prisma.userSession.upsert({
    where: { wa_id: ownerWaId },
    update: { mode: 'MERCHANT', active_merchant_id: merchant.id },
    create: { wa_id: ownerWaId, mode: 'MERCHANT', active_merchant_id: merchant.id },
  });

  // Categories
  const [breads, pastries, cakes] = await Promise.all([
    prisma.category.create({ data: { merchant_id: merchant.id, name: 'Breads' } }),
    prisma.category.create({ data: { merchant_id: merchant.id, name: 'Pastries' } }),
    prisma.category.create({ data: { merchant_id: merchant.id, name: 'Cakes & Custom Orders' } }),
  ]);

  console.log('✅ Categories created');

  // Products
  await prisma.product.createMany({
    data: [
      { merchant_id: merchant.id, category_id: breads.id, name: 'Sourdough Loaf', description: 'Classic 48-hour cold-fermented sourdough with a crackly crust.', price: 85, is_in_stock: true },
      { merchant_id: merchant.id, category_id: breads.id, name: 'Seeded Rye Loaf', description: 'Dark rye with sunflower, sesame and poppy seeds. Dense and hearty.', price: 75, is_in_stock: true },
      { merchant_id: merchant.id, category_id: breads.id, name: 'Ciabatta', description: 'Thin-crusted Italian ciabatta, airy crumb, perfect for bruschetta.', price: 45, is_in_stock: true },
      { merchant_id: merchant.id, category_id: pastries.id, name: 'Almond Croissant', description: 'Twice-baked with almond cream and flaked almonds. A house favourite.', price: 55, is_in_stock: true },
      { merchant_id: merchant.id, category_id: pastries.id, name: 'Pain au Chocolat', description: 'Two fingers of dark Valrhona chocolate inside a buttery laminated dough.', price: 45, is_in_stock: true },
      { merchant_id: merchant.id, category_id: pastries.id, name: 'Kouign-Amann', description: 'Caramelised Breton pastry — crispy, buttery, salty-sweet.', price: 50, is_in_stock: true },
      { merchant_id: merchant.id, category_id: pastries.id, name: 'Seasonal Fruit Danish', description: 'Open-faced pastry with cream cheese and whatever fruit is at peak.', price: 48, is_in_stock: false },
      { merchant_id: merchant.id, category_id: cakes.id, name: 'Lemon Drizzle Slice', description: 'Moist lemon sponge with a tart glaze and candied zest.', price: 38, is_in_stock: true },
      { merchant_id: merchant.id, category_id: cakes.id, name: 'Chocolate Fudge Brownie', description: 'Triple-chocolate with a fudgy centre and crisp top.', price: 42, is_in_stock: true },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Products created');

  // Services (custom cake orders)
  await prisma.service.createMany({
    data: [
      { merchant_id: merchant.id, name: 'Custom Birthday Cake', description: '2-tier celebration cake — flavour, filling and decoration to your spec. Requires 48h notice.', price: 650, duration_min: 0, is_active: true },
      { merchant_id: merchant.id, name: 'Wedding Cake Consultation', description: '30-minute tasting session with our pastry chef. Up to 4 flavour samples.', price: 200, duration_min: 30, is_active: true },
      { merchant_id: merchant.id, name: 'Corporate Platter (20 pax)', description: 'Mixed pastry and bread platter for office events. Customise fillings via WhatsApp.', price: 890, duration_min: 0, is_active: true },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Services created');
  console.log('\n🎉 Done! Visit http://localhost:3000/@bakehaus to see the storefront.');
  console.log('   Run the CLI as the owner: npm run cli -- 27740000001');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
