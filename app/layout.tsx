import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "FLOOR desk — $49 once. Agents fill SKUs.",
  description:
    "Software agents query specs, stock, and policy. FLOOR is the exchange. Open a merchant desk for $49 once.",
  openGraph: {
    title: "FLOOR desk — $49 once",
    description: "Agents don't browse. They query a catalog and fill. Open a merchant desk.",
    images: [
      "https://assets-2-prod.whop.com/public/uploads/2026-09-03/13a90210-82d1-40d4-bece-e649130468c7/image.jpg",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.className} ${sans.variable} ${mono.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  );
}
