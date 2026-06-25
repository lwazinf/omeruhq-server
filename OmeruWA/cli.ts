import 'dotenv/config';
import readline from 'readline';
import { setTransport } from './src/services/whatsapp/sender';
import { handleIncomingMessage } from './src/services/whatsapp/handler';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  OMERU TERMINAL SIMULATOR                                        ║
 * ║                                                                  ║
 * ║  Drives the real bot — same handlers, same database — but        ║
 * ║  renders every WhatsApp message in your terminal instead of      ║
 * ║  sending it to Meta. What you see here is exactly what the       ║
 * ║  customer/merchant sees on their phone.                          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Run:        npm run cli
 * Run as:     npm run cli -- 27741234567       (any wa_id you like)
 *
 * Inside the simulator:
 *   hi                    → send plain text (any text works)
 *   1, 2, 3 …             → tap a button / list row from the last message
 *   /img                  → simulate sending a photo
 *   /loc -33.92,18.42     → simulate sharing a location
 *   /as 27749999999       → switch which number you're chatting as
 *   /exit                 → quit
 *
 * Requires only DATABASE_URL (point it at a local Postgres or your
 * Supabase project). No WhatsApp credentials needed.
 */

// ── ANSI styling ─────────────────────────────────────────────────────────────
const dim     = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold    = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green   = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan    = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow  = (s: string) => `\x1b[33m${s}\x1b[0m`;
const magenta = (s: string) => `\x1b[35m${s}\x1b[0m`;

// WhatsApp *bold* → terminal bold
const waFormat = (s: string) => s.replace(/\*([^*\n]+)\*/g, (_, t) => bold(t)).replace(/_([^_\n]+)_/g, (_, t) => dim(t));

// ── Tap registry: number → button/row id ─────────────────────────────────────
let tapMap: Array<{ id: string; title: string }> = [];

const bubble = (lines: string[]) => {
    const width = Math.min(64, Math.max(28, ...lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length)));
    console.log(green('┌' + '─'.repeat(width + 2) + '┐'));
    for (const line of lines) {
        console.log(green('│ ') + line);
    }
    console.log(green('└' + '─'.repeat(width + 2) + '┘'));
};

// ── Console transport: renders any WhatsApp payload ─────────────────────────
const consoleTransport = async (payload: any): Promise<boolean> => {
    const lines: string[] = [];
    const type = payload.type;

    if (type === 'text') {
        lines.push(...waFormat(payload.text.body).split('\n'));
    } else if (type === 'image') {
        const src = payload.image?.link || payload.image?.id || '?';
        lines.push(magenta(`🖼  [IMAGE] ${src.substring(0, 56)}`));
        if (payload.image?.caption) lines.push(...waFormat(payload.image.caption).split('\n'));
    } else if (type === 'interactive') {
        const i = payload.interactive;
        if (i.header?.type === 'image') {
            const src = i.header.image?.link || i.header.image?.id || '?';
            lines.push(magenta(`🖼  [IMAGE] ${String(src).substring(0, 56)}`));
        }
        if (i.body?.text) lines.push(...waFormat(i.body.text).split('\n'));
        if (i.footer?.text) lines.push(dim(i.footer.text));

        if (i.type === 'button') {
            lines.push('');
            tapMap = [];
            for (const b of i.action.buttons) {
                tapMap.push({ id: b.reply.id, title: b.reply.title });
                lines.push(cyan(`  [${tapMap.length}] ${b.reply.title}`));
            }
        } else if (i.type === 'list') {
            lines.push('');
            lines.push(cyan(`  ☰ ${i.action.button}`));
            tapMap = [];
            for (const sec of i.action.sections) {
                if (sec.title) lines.push(dim(`  — ${sec.title} —`));
                for (const row of sec.rows) {
                    tapMap.push({ id: row.id, title: row.title });
                    lines.push(cyan(`  [${tapMap.length}] ${row.title}`) + (row.description ? dim(`  ${row.description}`) : ''));
                }
            }
        }
    } else {
        lines.push(dim(JSON.stringify(payload).substring(0, 200)));
    }

    console.log('');
    console.log(dim(`  Omeru → ${payload.to}`));
    bubble(lines);
    return true;
};

// ── Build webhook-shaped messages ────────────────────────────────────────────
const textMessage = (from: string, body: string) => ({
    from, type: 'text', text: { body }, id: `cli_${Date.now()}`,
});
const buttonReply = (from: string, id: string, title: string) => ({
    from, type: 'interactive', interactive: { type: 'button_reply', button_reply: { id, title } }, id: `cli_${Date.now()}`,
});
const imageMessage = (from: string) => ({
    from, type: 'image', image: { id: `cli-media-${Date.now()}`, mime_type: 'image/jpeg' }, id: `cli_${Date.now()}`,
});
const locationMessage = (from: string, lat: number, lng: number) => ({
    from, type: 'location', location: { latitude: lat, longitude: lng }, id: `cli_${Date.now()}`,
});

// ── Main loop ────────────────────────────────────────────────────────────────
const main = async () => {
    setTransport(consoleTransport);
    let me = process.argv[2] || '27740000001';

    console.clear();
    console.log(yellow(bold('\n  ◉ OMERU TERMINAL SIMULATOR')));
    console.log(dim('  Real bot. Real database. Rendered in your terminal.\n'));
    console.log(`  You are: ${bold(me)}   ${dim('(/as <number> to switch)')}`);
    console.log(dim('  Type text to chat • numbers tap buttons • /img photo • /loc lat,lng • /exit\n'));

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = () => rl.setPrompt(yellow(`  ${me} ▸ `));
    prompt();
    rl.prompt();

    rl.on('line', async (raw) => {
        const line = raw.trim();
        if (!line) { rl.prompt(); return; }

        try {
            if (line === '/exit' || line === '/quit') { rl.close(); return; }

            if (line.startsWith('/as ')) {
                me = line.slice(4).replace(/\D/g, '') || me;
                console.log(dim(`  Now chatting as ${me}\n`));
                prompt(); rl.prompt(); return;
            }

            if (line === '/img') {
                console.log(dim('  [you sent a photo 📷]'));
                await handleIncomingMessage(imageMessage(me));
            } else if (line.startsWith('/loc')) {
                const m = line.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
                const lat = m ? parseFloat(m[1]) : -33.9249;
                const lng = m ? parseFloat(m[2]) : 18.4241;
                console.log(dim(`  [you shared location 📍 ${lat}, ${lng}]`));
                await handleIncomingMessage(locationMessage(me, lat, lng));
            } else if (/^\d{1,2}$/.test(line) && tapMap[parseInt(line, 10) - 1]) {
                const tap = tapMap[parseInt(line, 10) - 1];
                console.log(dim(`  [you tapped: ${tap.title}]`));
                await handleIncomingMessage(buttonReply(me, tap.id, tap.title));
            } else {
                await handleIncomingMessage(textMessage(me, line));
            }
        } catch (err: any) {
            console.error(yellow(`  ⚠ handler error: ${err.message}`));
        }

        console.log('');
        rl.prompt();
    });

    rl.on('close', () => {
        console.log(dim('\n  Simulator closed. 👋\n'));
        process.exit(0);
    });
};

main().catch((err) => {
    console.error('Fatal:', err.message);
    console.error(dim('Check that DATABASE_URL is set and reachable.'));
    process.exit(1);
});
