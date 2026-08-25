import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadre AI — Support Assistant",
  description:
    "Ask about Cadre AI's services, industries, the AI Maturity Index, or book a strategy call.",
};

/**
 * Props are declared explicitly rather than using Next 16's generated `LayoutProps<"/">`
 * global, which only exists after a build has run — depending on it means `tsc --noEmit`
 * fails on a clean checkout, including in CI.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--color-bg] text-[--color-fg]">
        {children}
      </body>
    </html>
  );
}
