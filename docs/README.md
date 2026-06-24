# Omeru Email Templates — Remoluhle (Pty) Ltd

16 production-ready HTML emails: 8 functions × dark/light variants.
Inline CSS, 600px table layout, Outlook-safe, single primary CTA each,
preheader text included. Placeholders are {{handlebars}} — compatible with
Resend, Brevo, Amazon SES, Postmark, or simple string replacement.

| # | Template | Audience | Job | Subject line |
|---|----------|----------|-----|--------------|
| 01 | merchant-invite | merchant | see file | You're invited: open your shop on Omeru (it takes 15 minutes) |
| 02 | merchant-golive | merchant | see file | 🚀 {{store_name}} is LIVE — here's your link to share everywhere |
| 03 | weekly-stats | merchant | see file | {{store_name}}: R{{revenue_week}} this week — your numbers inside |
| 04 | payout-notice | merchant | see file | 💸 Payout sent: R{{payout_amount}} to your {{bank_name}} account |
| 05 | order-receipt | customer/partner | see file | ✅ Receipt: your order from {{store_name}} (#{{order_id}}) |
| 06 | booking-confirmation | customer/partner | see file | 📅 Confirmed: {{service_name}} at {{store_name}} — {{booking_date}}, {{booking_time}} |
| 07 | merchant-winback | merchant | see file | {{store_name}}, your customers are still here — 2 minutes to restart |
| 08 | partner-outreach | customer/partner | see file | Partnership: put {{partner_audience}} shops online in one afternoon |

## Conversion notes
- **One CTA per email.** Secondary actions live as plain links only.
- **Subjects lead with the benefit or the number** (revenue, payout amount, time).
- Send 03 (weekly stats) Monday 07:00 SAST; 07 (winback) after 14 quiet days.
- 04 (payout) doubles as proof-of-trade — tell merchants to keep them.
- A/B test subjects per audience; keep preheaders under 90 chars.
- Always set both List-Unsubscribe headers and the footer link.
