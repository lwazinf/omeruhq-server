import type { Metadata } from 'next';
import { Archivo, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import InviteModal from '@/components/InviteModal';

// Self-hosted via next/font — removes render-blocking @import from globals.css.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Omeru HQ — Merchant Portal',
  description: 'Manage your Omeru store — orders, products, bookings, and analytics.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} className={`${archivo.variable} ${hanken.variable}`}>
      <head>
        {/* Icon font stays on the Fonts API (variable icon axes); a <link> is
            discovered earlier than a CSS @import and doesn't block globals.css. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('omeru-theme')==='light')document.documentElement.classList.add('theme-light');}catch(e){}` }} />
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="noise" aria-hidden />
          {children}
          <InviteModal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
