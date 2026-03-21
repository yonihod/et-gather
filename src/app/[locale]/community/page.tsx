"use client";

import { useTranslations } from "next-intl";
import { useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const t = useTranslations("community");

  const links = [
    { label: t("server"), value: "84.229.240.21", href: null, icon: "🖥️" },
    { label: t("maps"), value: "LimeWire", href: "https://limewire.com/d/CHmBU#TSMLD5YgaK", icon: "🗺️" },
    { label: t("telegram"), value: "Telegram Bot", href: "https://t.me/+ksGlgP4EVNNmN2Rk", icon: "📱" },
    { label: t("discord"), value: "Discord #1", href: "https://discord.gg/EpGaFjJ", icon: "🎮" },
    { label: t("discord"), value: "Discord #2", href: "https://discord.gg/QGupJ8qV", icon: "🎮" },
    { label: t("facebook"), value: "Facebook Group", href: "https://www.facebook.com/groups/418417468274159/?ref=share", icon: "📘" },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto topo-grid -mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono mt-2">Comms & Resources</p>
      </div>

      <Card className="animate-fade-up delay-100 hud-corners">
        <CardHeader>
          <CardTitle className="text-primary">{t("welcome")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed" dir="rtl">
            עקב שיח לאחרונה בקבוצה בפייסבוק על קיום טורניר בארץ, החלטנו לפתוח
            פלטפורמה שתאגד את גל השחקנים למטרת הטורניר והמשך הקהילה בארץ.
          </p>
          <p className="text-primary font-semibold mt-3" dir="rtl">
            משחק 6על6 במוצש הקרוב! כל הקודם זוכה!
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3" style={{ perspective: "800px" }}>
        {links.map((link, i) => (
          <TiltCard key={i} delay={i * 60 + 200}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-float" style={{ animationDelay: `${i * 400}ms` }}>
                  {link.icon}
                </span>
                <div>
                  <div className="font-medium">{link.label}</div>
                  <div className="text-sm text-muted-foreground">{link.value}</div>
                </div>
              </div>
              {link.href ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted transition-colors"
                >
                  Open
                </a>
              ) : (
                <CopyButton text={link.value} />
              )}
            </CardContent>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

function TiltCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  }, []);

  return (
    <Card
      ref={cardRef}
      className="tilt-card hover:border-primary/30 animate-fade-up hud-corners"
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Card>
  );
}

function CopyButton({ text }: { text: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  function handleClick() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    const el = btnRef.current;
    if (el) {
      el.classList.remove("animate-copy-success");
      void el.offsetWidth;
      el.classList.add("animate-copy-success");
    }
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      ref={btnRef}
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={copied ? "border-primary/40 text-primary" : ""}
    >
      {copied ? "Copied!" : "Copy IP"}
    </Button>
  );
}
