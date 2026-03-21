import { useTranslations } from "next-intl";

interface ConfigFile {
  name: string;
  description: string;
  filename: string;
  category: "competitive" | "beginner" | "performance";
}

const configs: ConfigFile[] = [
  {
    name: "Competitive autoexec.cfg",
    description:
      "Optimized competitive settings — high FPS, clean visuals, responsive controls. Used by top players.",
    filename: "competitive-autoexec.cfg",
    category: "competitive",
  },
  {
    name: "Beginner autoexec.cfg",
    description:
      "Beginner-friendly settings with comfortable defaults. Good starting point for new/returning players.",
    filename: "beginner-autoexec.cfg",
    category: "beginner",
  },
  {
    name: "Performance etconfig.cfg",
    description:
      "Maximum FPS config for low-end machines. Reduced graphics, optimized network settings.",
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
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </div>

      {/* Config files */}
      <div className="grid gap-4">
        {configs.map((cfg) => (
          <div
            key={cfg.filename}
            className="bg-surface rounded-lg p-5 border border-border"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{cfg.name}</h3>
                <p className="text-sm text-muted mt-1">{cfg.description}</p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    cfg.category === "competitive"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : cfg.category === "beginner"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-purple-500/10 text-purple-400"
                  }`}
                >
                  {t(cfg.category)}
                </span>
              </div>
              <a
                href={`/configs/${cfg.filename}`}
                download
                className="shrink-0 bg-accent text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                {t("download")}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Guide */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold mb-4">{t("setupGuide")}</h2>
        <ol className="space-y-3 text-sm text-muted list-decimal list-inside">
          <li>
            Download Enemy Territory from{" "}
            <a
              href="https://www.splashdamage.com/games/wolfenstein-enemy-territory/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Splash Damage
            </a>{" "}
            or use the ET: Legacy client from{" "}
            <a
              href="https://www.etlegacy.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              etlegacy.com
            </a>
          </li>
          <li>
            Install the game to the default directory (usually{" "}
            <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
              C:\Program Files\Wolfenstein - Enemy Territory
            </code>
            )
          </li>
          <li>
            Download a config file from above and place it in your{" "}
            <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
              etmain
            </code>{" "}
            folder
          </li>
          <li>
            For <strong>autoexec.cfg</strong>: the game runs this automatically
            on startup. Place it in{" "}
            <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
              etmain/autoexec.cfg
            </code>
          </li>
          <li>
            For <strong>etconfig.cfg</strong>: this replaces your main config.
            Back up the existing one first, then replace it in{" "}
            <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
              etmain/etconfig.cfg
            </code>
          </li>
          <li>
            Download custom maps from the{" "}
            <a
              href="https://limewire.com/d/CHmBU#TSMLD5YgaK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              community maps link
            </a>{" "}
            and place <code className="bg-background px-1.5 py-0.5 rounded text-foreground">.pk3</code>{" "}
            files in your <code className="bg-background px-1.5 py-0.5 rounded text-foreground">etmain</code>{" "}
            folder
          </li>
          <li>
            Launch the game and connect to the community server:{" "}
            <code className="bg-background px-1.5 py-0.5 rounded text-foreground">
              /connect 84.229.240.21
            </code>
          </li>
        </ol>
      </div>
    </div>
  );
}
