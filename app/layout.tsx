import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono, Bungee, Space_Grotesk } from "next/font/google";
import { APP_NAME } from "@/lib/types";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-schibsted",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

// Neubrutalist landing identity — Bungee for display headings, Space Grotesk for body.
const bungee = Bungee({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bungee",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — the company-perk arcade`,
  description:
    "Win chips from a house-sponsored bonus pot. Your allowance is never at stake. Powered by Ramp.",
};

export const viewport: Viewport = {
  themeColor: "#17171c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${plex.variable} ${bungee.variable} ${grotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
