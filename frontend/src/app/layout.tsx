import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import ClientProviders from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FreshKart — Groceries Delivered in Minutes",
  description: "Experience premium, lightning-fast grocery delivery. Order fruits, fresh vegetables, dairy, snacks, and home essentials and get them in under 15 minutes.",
  keywords: ["grocery", "delivery", "freshkart", "blinkit", "zepto", "instamart", "vegetables", "milk"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

