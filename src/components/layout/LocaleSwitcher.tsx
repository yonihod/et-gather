"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggleLocale() {
    const nextLocale = locale === "he" ? "en" : "he";
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <button
      onClick={toggleLocale}
      className="px-2 py-1 rounded text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
      title={locale === "he" ? "Switch to English" : "עבור לעברית"}
    >
      {locale === "he" ? "EN" : "עב"}
    </button>
  );
}
