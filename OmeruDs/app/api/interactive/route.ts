import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/agentServer";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { businessName, botDescription, userMessage, history } = await req.json();

  const system = `You are a WhatsApp bot for "${businessName}". ${botDescription || "You help customers with enquiries, bookings, and orders."}

RULES:
- Respond as the business bot, in first person ("we", "our")
- Keep responses short (1-3 sentences max), mobile-friendly
- Use South African English where natural (e.g. "lekker", "howzit", "no worries hey")
- Use WhatsApp formatting: *bold* for emphasis, emojis sparingly
- Be warm, professional, and helpful
- If asked about prices, use South African Rand (R)
- If asked about location, reference South African cities
- Never break character
- Never make up specific factual claims about the business
- Focus on guiding the customer toward a booking, order, or conversion`;

  const conversationContext = (history || [])
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
    .join("\n");

  const prompt = conversationContext
    ? `Conversation so far:\n${conversationContext}\n\nCustomer: ${userMessage}\n\nRespond as the bot (1-3 sentences, WhatsApp style):`
    : `Customer: ${userMessage}\n\nRespond as the bot (1-3 sentences, WhatsApp style):`;

  const result = await callLLM({
    system,
    user: prompt,
    maxTokens: 300,
    timeoutMs: 15000,
    model: "fast",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }

  return NextResponse.json({ reply: result.text });
}
