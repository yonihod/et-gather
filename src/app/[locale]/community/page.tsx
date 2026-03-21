import { useTranslations } from "next-intl";

export default function CommunityPage() {
  const t = useTranslations("community");

  const links = [
    {
      label: t("server"),
      value: "84.229.240.21",
      href: null,
      icon: "🖥️",
    },
    {
      label: t("maps"),
      value: "LimeWire",
      href: "https://limewire.com/d/CHmBU#TSMLD5YgaK",
      icon: "🗺️",
    },
    {
      label: t("telegram"),
      value: "Telegram Bot",
      href: "https://t.me/+ksGlgP4EVNNmN2Rk",
      icon: "📱",
    },
    {
      label: t("discord"),
      value: "Discord #1",
      href: "https://discord.gg/EpGaFjJ",
      icon: "🎮",
    },
    {
      label: t("discord"),
      value: "Discord #2",
      href: "https://discord.gg/QGupJ8qV",
      icon: "🎮",
    },
    {
      label: t("facebook"),
      value: "Facebook Group",
      href: "https://www.facebook.com/groups/418417468274159/?ref=share",
      icon: "📘",
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Welcome message */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-accent mb-3">
          {t("welcome")}
        </h2>
        <p className="text-muted leading-relaxed" dir="rtl">
          עקב שיח לאחרונה בקבוצה בפייסבוק על קיום טורניר בארץ, החלטנו לפתוח
          פלטפורמה שתאגד את גל השחקנים למטרת הטורניר והמשך הקהילה בארץ.
        </p>
        <p className="text-accent font-semibold mt-3" dir="rtl">
          משחק 6על6 במוצש הקרוב! כל הקודם זוכה!
        </p>
      </div>

      {/* Links */}
      <div className="grid gap-3">
        {links.map((link, i) => (
          <div
            key={i}
            className="bg-surface rounded-lg p-4 border border-border flex items-center justify-between hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{link.icon}</span>
              <div>
                <div className="font-medium">{link.label}</div>
                <div className="text-sm text-muted">{link.value}</div>
              </div>
            </div>
            {link.href ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent/10 text-accent px-4 py-1.5 rounded-md text-sm hover:bg-accent/20 transition-colors"
              >
                {link.icon === "🖥️" ? "Copy" : "Open"}
              </a>
            ) : (
              <button
                className="bg-accent/10 text-accent px-4 py-1.5 rounded-md text-sm hover:bg-accent/20 transition-colors"
                onClick={() => {}}
              >
                Copy IP
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
