import type { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "@/app/providers";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hiring Bazaar AI — Recruitment Intelligence",
  description: "Placement readiness, semantic matching and pipeline tracking for candidates, TPOs and recruiters.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          <AuthHashHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}
