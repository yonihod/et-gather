import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import "../globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "ET Gather — RTCW:ET Israel",
  description:
    "Community platform for RTCW: Enemy Territory Israeli players. Organize gathers, track attendance, climb the leaderboard.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "he" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${rubik.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
