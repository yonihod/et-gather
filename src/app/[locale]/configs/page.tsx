"use client";

import { useTranslations } from "next-intl";
import { useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConfigFile {
  name: string;
  description: string;
  filename: string;
  category: "competitive" | "beginner" | "performance";
}

const configs: ConfigFile[] = [
  {
    name: "Competitive autoexec.cfg",
    description: "Optimized competitive settings — high FPS, clean visuals, responsive controls. Used by top players.",
    filename: "competitive-autoexec.cfg",
    category: "competitive",
  },
  {
    name: "Beginner autoexec.cfg",
    description: "Beginner-friendly settings with comfortable defaults. Good starting point for new/returning players.",
    filename: "beginner-autoexec.cfg",
    category: "beginner",
  },
  {
    name: "Performance etconfig.cfg",
    description: "Maximum FPS config for low-end machines. Reduced graphics, optimized network settings.",
    filename: "performance-etconfig.cfg",
    category: "performance",
  },
];

export default function ConfigsPage() {
  const t = useTranslations("configs");

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4" style={{ perspective: "800px" }}>
        {configs.map((cfg, i) => (
          <ConfigCard key={cfg.filename} cfg={cfg} index={i} downloadLabel={t("download")} categoryLabel={t(cfg.category)} />
        ))}
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <CardTitle>{t("setupGuide")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              Download Enemy Territory from{" "}
              <a href="https://www.splashdamage.com/games/wolfenstein-enemy-territory/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Splash Damage
              </a>{" "}
              or use the ET: Legacy client from{" "}
              <a href="https://www.etlegacy.com/download" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                etlegacy.com
              </a>
            </li>
            <li>
              Install the game to the default directory (usually{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">C:\Program Files\Wolfenstein - Enemy Territory</code>)
            </li>
            <li>
              Download a config file from above and place it in your{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">etmain</code> folder
            </li>
            <li>
              For <strong className="text-foreground">autoexec.cfg</strong>: the game runs this automatically on startup. Place it in{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">etmain/autoexec.cfg</code>
            </li>
            <li>
              For <strong className="text-foreground">etconfig.cfg</strong>: this replaces your main config. Back up the existing one first, then replace it in{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">etmain/etconfig.cfg</code>
            </li>
            <li>
              Download custom maps from the{" "}
              <a href="https://limewire.com/d/CHmBU#TSMLD5YgaK" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                community maps link
              </a>{" "}
              and place <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">.pk3</code> files in your{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">etmain</code> folder
            </li>
            <li>
              Launch the game and connect to the community server:{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">/connect 84.229.240.21</code>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigCard({ cfg, index, downloadLabel, categoryLabel }: { cfg: ConfigFile; index: number; downloadLabel: string; categoryLabel: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  }, []);

  function handleDownloadClick() {
    setDownloaded(true);
    const el = btnRef.current;
    if (el) {
      el.classList.remove("animate-btn-press");
      void el.offsetWidth;
      el.classList.add("animate-btn-press");
    }
    setTimeout(() => setDownloaded(false), 2500);
  }

  return (
    <Card
      ref={cardRef}
      className="tilt-card animate-fade-up"
      style={{ animationDelay: `${index * 80 + 100}ms` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">{cfg.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{cfg.description}</p>
            <Badge
              variant="outline"
              className={`mt-2 ${
                cfg.category === "competitive"
                  ? "border-yellow-500/30 text-yellow-400"
                  : cfg.category === "beginner"
                  ? "border-blue-500/30 text-blue-400"
                  : "border-purple-500/30 text-purple-400"
              }`}
            >
              {categoryLabel}
            </Badge>
          </div>
          <a
            ref={btnRef}
            href={`/configs/${cfg.filename}`}
            download
            onClick={handleDownloadClick}
            className={`inline-flex items-center justify-center h-7 px-3 rounded-lg text-sm font-medium transition-all shrink-0 ${
              downloaded
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/80"
            }`}
          >
            {downloaded ? "Downloaded!" : downloadLabel}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
