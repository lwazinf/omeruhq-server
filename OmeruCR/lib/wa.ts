// WhatsApp Cloud API sender — same env contract as OmeruWA's sender
// (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN), so CR broadcasts go out
// from the same business number the bot uses.

const MESSAGE_DELAY_MS = 150; // mirror the bot's pacing to avoid rate limits
let lastSend = 0;

function config() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not configured');
  }
  return { url: `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, accessToken };
}

export async function sendText(waId: string, body: string): Promise<boolean> {
  const wait = MESSAGE_DELAY_MS - (Date.now() - lastSend);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSend = Date.now();

  const { url, accessToken } = config();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: waId,
        type: 'text',
        text: { body, preview_url: false },
      }),
    });
    if (!res.ok) {
      console.error('WA send failed', waId, res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('WA send error', waId, e);
    return false;
  }
}
