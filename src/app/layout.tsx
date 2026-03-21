import type { Metadata } from "next";
import { Rubik, Outfit } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ET Gather — RTCW:ET Israel",
  description:
    "Community platform for RTCW: Enemy Territory Israeli players. Organize gathers, track attendance, climb the leaderboard.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "ET Gather — RTCW:ET Israel",
    description:
      "Community platform for RTCW: Enemy Territory Israeli players. Organize gathers, track attendance, climb the leaderboard.",
    url: "https://et-gather.vercel.app",
    siteName: "ET Gather",
    images: [
      {
        url: "/images/og-image.png",
        width: 1024,
        height: 1024,
        alt: "ET Gather — RTCW:ET Israel Community",
      },
    ],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ET Gather — RTCW:ET Israel",
    description:
      "Organize gathers, track attendance, climb the leaderboard.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={`${rubik.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
