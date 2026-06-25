import type { Metadata } from "next";
import "./globals.css";
import GoogleTag from "@/components/GoogleTag";
import ConsentBanner from "@/components/ConsentBanner";
import InviteModal from "@/components/InviteModal";
import { getLocale } from 'next-intl/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hq.omeru.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Omeru — WhatsApp Commerce for South African Merchants",
    template: "%s | Omeru",
  },
  description:
    "Sell on WhatsApp. No app downloads. No account creation. Start selling in minutes with Omeru's zero-friction commerce platform.",
  keywords:
    "WhatsApp commerce, South Africa, merchant, online store, instant EFT, sell on WhatsApp, WhatsApp store, USSD payments, PayFast",
  authors: [{ name: "Omeru", url: SITE_URL }],
  creator: "Omeru",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: "Omeru",
    title: "Omeru — WhatsApp Commerce for South African Merchants",
    description:
      "Sell on WhatsApp. No app downloads. No account creation. Start selling in minutes.",
    images: [
      {
        url: "/omeru-hero.png",
        width: 1200,
        height: 630,
        alt: "Omeru — WhatsApp Commerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@OmeruHQ",
    creator: "@OmeruHQ",
    title: "Omeru — WhatsApp Commerce for South African Merchants",
    description: "Sell on WhatsApp. No app downloads. Start selling in minutes.",
    images: ["/omeru-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Omeru",
  url: SITE_URL,
  logo: `${SITE_URL}/remoluhle-logo.png`,
  sameAs: ["https://x.com/OmeruHQ"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@omeru.io",
    contactType: "customer support",
    areaServed: "ZA",
    availableLanguage: "English",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Omeru",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/stores?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <GoogleTag />
        {children}
        <ConsentBanner />
        <InviteModal />
      </body>
    </html>
  );
}
