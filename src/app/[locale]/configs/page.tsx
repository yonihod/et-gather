import { useTranslations } from "next-intl";
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
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4">
        {configs.map((cfg) => (
          <Card key={cfg.filename}>
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
                    {t(cfg.category)}
                  </Badge>
                </div>
                <a
                  href={`/configs/${cfg.filename}`}
                  download
                  className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors shrink-0"
                >
                  {t("download")}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
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
