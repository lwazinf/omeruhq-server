// Standalone sync script — runs without MCP, for cron or manual use
// Usage: npm run sync [-- --scope platform|merchants|daily|payouts|all]

import { parseArgs } from 'util';
import {
  getPlatformSummary, getMerchantProfile, getAllMerchants,
  getPayoutIndex, getApplications, getDailyMetrics, sql,
} from './db.js';
import {
  writeNote, today,
  buildPlatformOverview, buildMerchantNote, buildMerchantIndex,
  buildPayoutIndex, buildDailySnapshot, buildApplicationsNote,
} from './vault.js';

const { values } = parseArgs({ options: { scope: { type: 'string', default: 'all' } } });
const scope = values.scope ?? 'all';

console.log(`\n🔄 Omeru Intel sync — scope: ${scope}\n`);

async function syncPlatform() {
  process.stdout.write('  Platform overview... ');
  const data = await getPlatformSummary();
  await writeNote('Platform/Overview.md', buildPlatformOverview(data as Parameters<typeof buildPlatformOverview>[0]));
  console.log('✅');
}

async function syncMerchants() {
  process.stdout.write('  Merchants... ');
  const merchants = await getAllMerchants();
  for (const m of merchants) {
    const data = await getMerchantProfile(m.handle);
    if (!data) continue;
    await writeNote(`Merchants/${m.handle}.md`, buildMerchantNote(data as Parameters<typeof buildMerchantNote>[0]));
  }
  await writeNote('Merchants/_Index.md', buildMerchantIndex(merchants as Parameters<typeof buildMerchantIndex>[0]));
  console.log(`✅ (${merchants.length} merchants)`);
}

async function syncPayouts() {
  process.stdout.write('  Payouts... ');
  const rows = await getPayoutIndex();
  await writeNote('Payouts/_Index.md', buildPayoutIndex(rows as Parameters<typeof buildPayoutIndex>[0]));
  console.log('✅');
}

async function syncDaily() {
  process.stdout.write('  Daily snapshot... ');
  const data = await getDailyMetrics();
  await writeNote(`Platform/Daily/${today()}.md`, buildDailySnapshot(data as Parameters<typeof buildDailySnapshot>[0]));
  console.log('✅');
}

async function syncApplications() {
  process.stdout.write('  Applications... ');
  const apps = await getApplications();
  await writeNote('OmeruIO/Applications.md', buildApplicationsNote(apps as Parameters<typeof buildApplicationsNote>[0]));
  console.log('✅');
}

try {
  if (scope === 'platform' || scope === 'all') await syncPlatform();
  if (scope === 'merchants' || scope === 'all') await syncMerchants();
  if (scope === 'payouts'   || scope === 'all') await syncPayouts();
  if (scope === 'daily'     || scope === 'all') await syncDaily();
  if (scope === 'all') await syncApplications();
  console.log('\n✅ Sync complete\n');
} catch (err) {
  console.error('\n❌ Sync failed:', err);
  process.exit(1);
} finally {
  await sql.end();
}
