import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "ET Gather — RTCW:ET Israel",
  description:
    "Community platform for RTCW: Enemy Territory Israeli players. Organize gathers, track attendance, climb the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={`${rubik.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
