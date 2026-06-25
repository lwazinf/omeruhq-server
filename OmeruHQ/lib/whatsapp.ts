const WA_API = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

export async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(WA_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_PERMANENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
