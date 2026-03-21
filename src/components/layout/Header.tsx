"use client";

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
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-accent font-bold text-lg tracking-tight">
            ET Gather
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
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
            className="bg-accent text-background px-4 py-1.5 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
