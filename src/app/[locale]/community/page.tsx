"use client";

import { useTranslations } from "next-intl";
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
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

      <div className="grid gap-3">
        {links.map((link, i) => (
          <Card key={i} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{link.icon}</span>
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
          </Card>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigator.clipboard.writeText(text)}
    >
      Copy IP
    </Button>
  );
}
