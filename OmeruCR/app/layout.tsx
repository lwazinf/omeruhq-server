import type { Metadata, Viewport } from 'next';
import { Archivo, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'], weight: ['700', '800', '900'],
  variable: '--font-archivo', display: 'swap',
});
const hanken = Hanken_Grotesk({
  subsets: ['latin'], weight: ['400', '500', '600', '700'],
  variable: '--font-hanken', display: 'swap',
});

export const metadata: Metadata = {
  title: 'Omeru Control Room',
  description: 'Private platform administration.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${archivo.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
