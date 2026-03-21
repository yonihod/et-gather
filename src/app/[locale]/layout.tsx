import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "he" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </NextIntlClientProvider>
    </div>
  );
}
