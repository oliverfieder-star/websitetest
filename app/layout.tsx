import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mainfranken Digital — KI und Automatisierung fürs Handwerk",
  description:
    "Mainfranken Digital nimmt Handwerksbetrieben in Bayern die Büroarbeit ab — mit KI und Automatisierung, die im Alltag funktionieren. Digital-Check 1.900 € netto, Umsetzungsprojekte ab 15.000 €, Förderung bis 7.500 €.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
