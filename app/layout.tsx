import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import LenisProvider from "@/components/motion/LenisProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "BataMarket — Trusted EKSU Student Marketplace",
    template: "%s | BataMarket",
  },
  description:
    "Buy textbooks, sell gadgets, book student services, and find accommodation. The verified peer-to-peer marketplace built for Ekiti State University students.",
  keywords: [
    "EKSU marketplace",
    "student marketplace Nigeria",
    "buy sell EKSU",
    "student accommodation Ekiti",
    "campus marketplace",
    "BataMarket",
  ],
  metadataBase: new URL("https://batamarket.vercel.app"),
  openGraph: {
    title: "BataMarket — Trusted EKSU Student Marketplace",
    description:
      "Buy textbooks, sell gadgets, book student services, and find accommodation — all within the EKSU campus community.",
    siteName: "BataMarket",
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "BataMarket — Trusted EKSU Student Marketplace",
    description:
      "The verified peer-to-peer marketplace built for Ekiti State University students.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${GeistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-primary font-sans">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
