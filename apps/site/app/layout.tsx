import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

// Self-hosted (was next/font/google). next/font/google downloads at build
// time from fonts.googleapis.com, which fails offline / behind a proxy.
// These variable woff2 files are the `latin` subset — same as the previous
// `subsets: ["latin"]` config.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leapscore.dev"),
  title: {
    default: "LeapScore — how bad is your codebase, and what's it cost to fix?",
    template: "%s · LeapScore",
  },
  description:
    "Paste any GitHub repo. Get a maintainability score, the evidence behind every point, and the exact remediation to raise it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
