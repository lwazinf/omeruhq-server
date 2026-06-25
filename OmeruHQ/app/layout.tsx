import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Omeru HQ — Merchant Portal',
  description: 'Manage your Omeru store — orders, products, bookings, and analytics.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="noise" aria-hidden />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
