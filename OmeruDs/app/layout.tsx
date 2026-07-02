import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ds.omeru.io";

// Self-hosted via next/font — zero render-blocking font CSS, automatic
// preloading, and no layout shift (size-adjusted fallbacks).
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Omeru Demos — See Your Store Live on WhatsApp",
    template: "%s | Omeru Demos",
  },
  description:
    "Interactive, pixel-faithful WhatsApp bot demos. Watch how customers discover, browse, and buy from South African stores right inside WhatsApp — no app, no account. Powered by Omeru.",
  keywords:
    "WhatsApp bot demo, WhatsApp commerce, chatbot showcase, South Africa, Omeru, WhatsApp store demo, conversational commerce",
  authors: [{ name: "Omeru", url: "https://omeru.io" }],
  creator: "Omeru",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: "Omeru Demos",
    title: "Omeru Demos — See Your Store Live on WhatsApp",
    description:
      "Interactive WhatsApp bot demos. Watch customers discover, browse, and buy — right inside WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@OmeruHQ",
    creator: "@OmeruHQ",
    title: "Omeru Demos — See Your Store Live on WhatsApp",
    description:
      "Interactive WhatsApp bot demos. Watch customers discover, browse, and buy — right inside WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Omeru Demos",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Interactive WhatsApp bot demonstration platform for South African commerce, by Omeru.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "ZAR" },
  publisher: { "@type": "Organization", name: "Omeru", url: "https://omeru.io" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-ZA" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
