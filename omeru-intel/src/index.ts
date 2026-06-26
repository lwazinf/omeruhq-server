import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  getPlatformSummary, getMerchantProfile, getAllMerchants,
  getPayoutIndex, getApplications, getDailyMetrics,
} from './db.js';
import {
  writeNote, readNote, today,
  buildPlatformOverview, buildMerchantNote, buildMerchantIndex,
  buildPayoutIndex, buildDailySnapshot, buildApplicationsNote,
} from './vault.js';

const server = new McpServer({
  name: 'omeru-intel',
  version: '1.0.0',
});

// ── sync_platform_overview ───────────────────────────────────────────────────
server.tool(
  'sync_platform_overview',
  'Fetch live platform metrics from Supabase and write to Platform/Overview.md',
  {},
  async () => {
    const data = await getPlatformSummary();
    const content = buildPlatformOverview(data as Parameters<typeof buildPlatformOverview>[0]);
    await writeNote('Platform/Overview.md', content);
    const summary = [
      `✅ Platform/Overview.md updated`,
      `   Active merchants: ${data.merchants.find((m: { status: string }) => m.status === 'ACTIVE')?.count ?? 0}`,
      `   GMV 30d: R ${Number(data.orders.gmv_30d).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`,
      `   Pending payout: R ${Number(data.payouts.pending_net).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`,
    ].join('\n');
    return { content: [{ type: 'text' as const, text: summary }] };
  }
);

// ── sync_merchant ────────────────────────────────────────────────────────────
server.tool(
  'sync_merchant',
  'Fetch a single merchant profile from Supabase and write to Merchants/{handle}.md',
  { handle: z.string().describe('Merchant handle, e.g. "kasi_eats"') },
  async ({ handle }) => {
    const data = await getMerchantProfile(handle);
    if (!data) return { content: [{ type: 'text' as const, text: `❌ Merchant "${handle}" not found` }] };
    const content = buildMerchantNote(data as Parameters<typeof buildMerchantNote>[0]);
    await writeNote(`Merchants/${handle}.md`, content);
    return {
      content: [{ type: 'text' as const, text: `✅ Merchants/${handle}.md updated — ${data.merchant.trading_name}` }],
    };
  }
);

// ── sync_all_merchants ───────────────────────────────────────────────────────
server.tool(
  'sync_all_merchants',
  'Sync all merchant profiles to Merchants/ and update the index',
  {},
  async () => {
    const merchants = await getAllMerchants();
    const results: string[] = [];
    for (const m of merchants) {
      const data = await getMerchantProfile(m.handle);
      if (!data) continue;
      const content = buildMerchantNote(data as Parameters<typeof buildMerchantNote>[0]);
      await writeNote(`Merchants/${m.handle}.md`, content);
      results.push(`  • ${m.trading_name} (@${m.handle})`);
    }
    const indexContent = buildMerchantIndex(merchants as Parameters<typeof buildMerchantIndex>[0]);
    await writeNote('Merchants/_Index.md', indexContent);
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Synced ${merchants.length} merchants:\n${results.join('\n')}\n\n✅ Merchants/_Index.md updated`,
      }],
    };
  }
);

// ── sync_payouts ─────────────────────────────────────────────────────────────
server.tool(
  'sync_payouts',
  'Fetch payout status for all merchants and write Payouts/_Index.md',
  {},
  async () => {
    const rows = await getPayoutIndex();
    const content = buildPayoutIndex(rows as Parameters<typeof buildPayoutIndex>[0]);
    await writeNote('Payouts/_Index.md', content);
    const total = rows.reduce((s: number, r: { pending_gross: number }) => s + Number(r.pending_gross), 0);
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Payouts/_Index.md updated — ${rows.length} merchants with pending amounts, R ${total.toLocaleString('en-ZA', { maximumFractionDigits: 0 })} total gross pending`,
      }],
    };
  }
);

// ── sync_daily ───────────────────────────────────────────────────────────────
server.tool(
  'sync_daily',
  'Write today\'s daily metrics snapshot to Platform/Daily/YYYY-MM-DD.md',
  {},
  async () => {
    const data = await getDailyMetrics();
    const content = buildDailySnapshot(data as Parameters<typeof buildDailySnapshot>[0]);
    const path = `Platform/Daily/${today()}.md`;
    await writeNote(path, content);
    return { content: [{ type: 'text' as const, text: `✅ ${path} written` }] };
  }
);

// ── sync_applications ────────────────────────────────────────────────────────
server.tool(
  'sync_applications',
  'Fetch invite applications and write OmeruIO/Applications.md',
  {},
  async () => {
    const apps = await getApplications();
    const content = buildApplicationsNote(apps as Parameters<typeof buildApplicationsNote>[0]);
    await writeNote('OmeruIO/Applications.md', content);
    const pending = apps.find((a: { status: string }) => a.status === 'pending')?.count ?? 0;
    return {
      content: [{
        type: 'text' as const,
        text: `✅ OmeruIO/Applications.md updated — ${pending} pending application${pending !== 1 ? 's' : ''}`,
      }],
    };
  }
);

// ── sync_all ─────────────────────────────────────────────────────────────────
server.tool(
  'sync_all',
  'Full ecosystem sync — platform overview, all merchants, payouts, daily snapshot, applications',
  {},
  async () => {
    const results: string[] = [];

    const platformData = await getPlatformSummary();
    await writeNote('Platform/Overview.md', buildPlatformOverview(platformData as Parameters<typeof buildPlatformOverview>[0]));
    results.push('✅ Platform/Overview.md');

    const merchants = await getAllMerchants();
    for (const m of merchants) {
      const data = await getMerchantProfile(m.handle);
      if (!data) continue;
      await writeNote(`Merchants/${m.handle}.md`, buildMerchantNote(data as Parameters<typeof buildMerchantNote>[0]));
    }
    await writeNote('Merchants/_Index.md', buildMerchantIndex(merchants as Parameters<typeof buildMerchantIndex>[0]));
    results.push(`✅ ${merchants.length} merchant profiles + _Index`);

    const payoutRows = await getPayoutIndex();
    await writeNote('Payouts/_Index.md', buildPayoutIndex(payoutRows as Parameters<typeof buildPayoutIndex>[0]));
    results.push('✅ Payouts/_Index.md');

    const dailyData = await getDailyMetrics();
    const path = `Platform/Daily/${today()}.md`;
    await writeNote(path, buildDailySnapshot(dailyData as Parameters<typeof buildDailySnapshot>[0]));
    results.push(`✅ ${path}`);

    const apps = await getApplications();
    await writeNote('OmeruIO/Applications.md', buildApplicationsNote(apps as Parameters<typeof buildApplicationsNote>[0]));
    results.push('✅ OmeruIO/Applications.md');

    return { content: [{ type: 'text' as const, text: `Ecosystem sync complete:\n${results.join('\n')}` }] };
  }
);

// ── write_insight ────────────────────────────────────────────────────────────
server.tool(
  'write_insight',
  'Append a new insight or recommendation to Insights/Recommendations.md',
  {
    title:   z.string().describe('Short heading for the insight'),
    body:    z.string().describe('The insight content in markdown'),
    section: z.enum(['Recommendations', 'Risk Flags']).default('Recommendations').describe('Which insights file to append to'),
  },
  async ({ title, body, section }) => {
    const path = `Insights/${section}.md`;
    const existing = readNote(path) ?? '';
    const entry = `\n## ${title}\n\n> Added ${new Date().toLocaleString('en-ZA')}\n\n${body}\n`;
    await writeNote(path, existing + entry);
    return { content: [{ type: 'text' as const, text: `✅ Insight appended to ${path}` }] };
  }
);

// ── read_note ────────────────────────────────────────────────────────────────
server.tool(
  'read_note',
  'Read any note from the Obsidian vault by relative path',
  { path: z.string().describe('Relative path within vault, e.g. "Merchants/kasi_eats.md"') },
  async ({ path }) => {
    const content = readNote(path);
    if (!content) return { content: [{ type: 'text' as const, text: `❌ Note not found: ${path}` }] };
    return { content: [{ type: 'text' as const, text: content }] };
  }
);

// ── Start server ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
