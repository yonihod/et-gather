"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    { href: "/" as const, label: t("home") },
    { href: "/gather" as const, label: t("gather") },
    { href: "/community" as const, label: t("community") },
    { href: "/configs" as const, label: t("configs") },
  ];

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="ET Gather" width={36} height={36} className="rounded" />
            <span className="text-primary font-bold text-lg tracking-tight">ET Gather</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
