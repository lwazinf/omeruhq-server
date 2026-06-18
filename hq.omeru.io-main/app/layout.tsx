import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://omeru.io"),
  title: "Omeru — WhatsApp Commerce for South African Merchants",
  description: "Sell on WhatsApp. No app downloads. No account creation. Start selling in minutes with Omeru's zero-friction commerce platform.",
  keywords: "WhatsApp commerce, South Africa, merchant, online store, instant EFT, Stitch payments, sell on WhatsApp",
  openGraph: {
    title: "Omeru — WhatsApp Commerce",
    description: "Sell on WhatsApp. No app downloads. No account creation.",
    url: "https://omeru.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
