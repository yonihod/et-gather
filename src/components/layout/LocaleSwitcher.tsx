"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggleLocale() {
    const nextLocale = locale === "he" ? "en" : "he";
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      title={locale === "he" ? "Switch to English" : "עבור לעברית"}
    >
      {locale === "he" ? "EN" : "עב"}
    </Button>
  );
}
