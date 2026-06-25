import axios, { AxiosError } from 'axios';

// ============ CONFIGURATION ============
// Read dynamically per request so key changes and cold-start timing are never an issue
const getConfig = () => {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    if (!phoneNumberId) console.error('⚠️ CRITICAL: WHATSAPP_PHONE_NUMBER_ID is not set!');
    if (!accessToken) console.error('⚠️ CRITICAL: WHATSAPP_ACCESS_TOKEN is not set!');
    const apiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}`;
    return { apiUrl, accessToken };
};

// Rate limiting settings
const MESSAGE_DELAY_MS = 150;
let lastMessageTime = 0;

// ============ TRANSPORT OVERRIDE (terminal simulator) ============
// The CLI simulator (cli.ts) replaces the HTTP transport so the full bot can
// be driven from a terminal — same handlers, same DB, zero WhatsApp calls.

type Transport = (payload: any) => Promise<boolean>;
let transportOverride: Transport | null = null;

/** Used by cli.ts. Pass null to restore the real WhatsApp transport. */
export const setTransport = (t: Transport | null): void => { transportOverride = t; };

// ============ CORE SEND FUNCTION ============

/**
 * Internal helper to send payloads to the WhatsApp API
 */
const sendMessage = async (payload: any): Promise<boolean> => {
    if (transportOverride) return transportOverride(payload);
    try {
        // Enforce a small delay between messages to prevent rate-limiting/out-of-order delivery
        const now = Date.now();
        const timeSinceLastMessage = now - lastMessageTime;
        if (timeSinceLastMessage < MESSAGE_DELAY_MS) {
            await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY_MS - timeSinceLastMessage));
        }
        lastMessageTime = Date.now();

        const { apiUrl, accessToken } = getConfig();
        const response = await axios.post(`${apiUrl}/messages`, payload, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });

        if (response.status === 200 || response.status === 201) {
            return true;
        }

        console.error(`❌ WhatsApp API returned status ${response.status}`);
        return false;

    } catch (error) {
        const err = error as AxiosError;
        if (err.response) {
            console.error('❌ Meta Cloud API Error:', {
                status: err.response.status,
                data: err.response.data,
                recipient: payload.to
            });
        } else {
            console.error('❌ Network Error sending to WhatsApp:', err.message);
        }
        return false;
    }
};

// ============ EXPORTED ACTIONS ============

/**
 * Sends a standard text message
 */
export const sendTextMessage = async (to: string, text: string): Promise<boolean> => {
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'text',
        text: { body: text.substring(0, 4000) }
    });
};

/**
 * Sends interactive buttons (max 3)
 */
export const sendButtons = async (
    to: string, 
    bodyText: string, 
    buttons: Array<{ id: string; title: string }>,
    footer?: string
): Promise<boolean> => {
    const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
                buttons: buttons.slice(0, 3).map(btn => ({
                    type: 'reply',
                    reply: { id: btn.id, title: btn.title.substring(0, 20) }
                }))
            }
        }
    };

    if (footer) payload.interactive.footer = { text: footer };

    return sendMessage(payload);
};

/**
 * Sends a List menu (dropdown style)
 */
export const sendListMessage = async (
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>,
    title?: string,
    footer?: string
): Promise<boolean> => {
    const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
            type: 'list',
            header: title ? { type: 'text', text: title } : undefined,
            body: { text: bodyText },
            footer: footer ? { text: footer } : undefined,
            action: {
                button: buttonText.substring(0, 20),
                sections: sections.map(sec => ({
                    title: sec.title.substring(0, 24),
                    rows: sec.rows.map(row => ({
                        id: row.id,
                        title: row.title.substring(0, 24),
                        description: row.description?.substring(0, 72)
                    }))
                }))
            }
        }
    };

    return sendMessage(payload);
};

/**
 * Sends an interactive message with an image header + reply buttons (max 3).
 * Used for product cards in the customer-facing store view.
 */
export const sendInteractiveImageButtons = async (
    to: string,
    imageUrlOrId: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    footer?: string
): Promise<boolean> => {
    const isUrl = imageUrlOrId.startsWith('http://') || imageUrlOrId.startsWith('https://');
    const imagePayload = isUrl ? { link: imageUrlOrId } : { id: imageUrlOrId };
    const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'interactive',
        interactive: {
            type: 'button',
            header: { type: 'image', image: imagePayload },
            body: { text: bodyText.substring(0, 1024) },
            action: {
                buttons: buttons.slice(0, 3).map(btn => ({
                    type: 'reply',
                    reply: { id: btn.id, title: btn.title.substring(0, 20) }
                }))
            }
        }
    };
    if (footer) payload.interactive.footer = { text: footer.substring(0, 60) };
    return sendMessage(payload);
};

/**
 * Sends an image — auto-detects URL vs 360Dialog media ID.
 * Images uploaded through the bot are stored as media IDs (not URLs).
 * Images on R2/CDN are full https:// URLs.
 */
export const sendImageMessage = async (to: string, imageUrlOrId: string, caption?: string): Promise<boolean> => {
    const isUrl = imageUrlOrId.startsWith('http://') || imageUrlOrId.startsWith('https://');
    const imagePayload = isUrl
        ? { link: imageUrlOrId, ...(caption ? { caption } : {}) }
        : { id: imageUrlOrId, ...(caption ? { caption } : {}) };
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formatPhoneNumber(to),
        type: 'image',
        image: imagePayload
    });
};

/**
 * Marks a message as read (blue ticks)
 */
export const markAsRead = async (messageId: string): Promise<boolean> => {
    if (transportOverride) return true;
    try {
        const { apiUrl, accessToken } = getConfig();
        const response = await axios.post(`${apiUrl}/messages`, {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
        }, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        return response.status === 200;
    } catch (err) {
        return false;
    }
};

// ============ HELPERS ============

/**
 * Standardizes phone numbers for the API (removes +, spaces, etc)
 */
const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
};