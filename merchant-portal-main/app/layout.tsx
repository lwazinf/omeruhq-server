import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Omeru HQ — Merchant Portal',
  description: 'Manage your Omeru store — orders, products, bookings, and analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="noise" aria-hidden />
        {children}
      </body>
    </html>
  );
}
