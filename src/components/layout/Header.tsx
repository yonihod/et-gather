"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    fetch("/api/server-status")
      .then((r) => r.json())
      .then((d) => setServerOnline(d.online))
      .catch(() => {});
  }, []);

  const navItems = [
    { href: "/" as const, label: t("home"), dot: false },
    { href: "/gather" as const, label: t("gather"), dot: false },
    { href: "/community" as const, label: t("community"), dot: serverOnline },
    { href: "/configs" as const, label: t("configs"), dot: false },
  ];

  return (
    <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="ET Gather" width={36} height={36} className="rounded" />
            <span className="font-display text-primary font-bold text-lg tracking-tight">ET Gather</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:translate-y-[-1px]"
                }`}
              >
                {item.label}
                {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link href={`/profile/${user.id}` as "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {(profile?.display_name || user.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {profile?.display_name || user.user_metadata?.full_name || "Player"}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                {t("logout")}
              </Button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
