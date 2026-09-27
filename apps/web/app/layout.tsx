import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Grimoire — Manga & Anime Library",
  description:
    "A premium dashboard for tracking your manga and anime collection. Beautiful, modern, and built for readers.",
  keywords: [
    "manga",
    "anime",
    "tracker",
    "library",
    "reading list",
    "Grimoire",
  ],
  authors: [{ name: "Grimoire" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Grimoire — Manga & Anime Library",
    description:
      "A premium dashboard for tracking your manga and anime collection.",
    siteName: "Grimoire",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grimoire — Manga & Anime Library",
    description:
      "A premium dashboard for tracking your manga and anime collection.",
  },
};

import { AuthProvider } from "@/contexts/auth-context";
import { LibraryProvider } from "@/contexts/library-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <LibraryProvider>
            {children}
            <Toaster />
          </LibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
