// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
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
  title: "AI Movie Insight Builder | Brew",
  description:
    "Explore movie details, audience reviews, and AI-powered sentiment insights. Enter a title or IMDb ID.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-slate-300 min-h-screen flex flex-col selection:bg-sky-500/30`}
      >
        <NavBar />
        <div className="flex-1 flex flex-col relative z-0">
          {children}
        </div>
      </body>
    </html>
  );
}
