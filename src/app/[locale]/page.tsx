import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ActiveGatherCard } from "@/components/gather/ActiveGatherCard";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative text-center py-16 space-y-6 overflow-hidden">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <Image
          src="/images/logo.png"
          alt="ET Gather Israel"
          width={200}
          height={200}
          className="mx-auto relative drop-shadow-[0_0_30px_rgba(34,197,94,0.15)]"
          priority
        />
        <div className="relative space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-primary">ET</span> Gather
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {t("home.subtitle")}
          </p>
        </div>

        {/* Stats bar */}
        <div className="relative flex justify-center gap-8 pt-4">
          <Card className="bg-card/50 border-primary/10">
            <CardContent className="px-6 py-3 text-center">
              <div className="text-2xl font-bold text-primary">20+</div>
              <div className="text-xs text-muted-foreground">{t("home.statsPlayers")}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/10">
            <CardContent className="px-6 py-3 text-center">
              <div className="text-2xl font-bold text-primary">6v6</div>
              <div className="text-xs text-muted-foreground">{t("home.statsMode")}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-primary/10">
            <CardContent className="px-6 py-3 text-center">
              <div className="text-2xl font-bold text-primary">IL</div>
              <div className="text-xs text-muted-foreground">{t("home.statsRegion")}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative flex justify-center gap-3 pt-2">
          <Link
            href="/gather"
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            {t("home.createGather")}
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
          >
            {t("home.joinCommunity")}
          </Link>
        </div>
      </section>

      {/* Active Gather */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-xl font-semibold">{t("home.activeGather")}</h2>
        </div>
        <ActiveGatherCard />
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("home.leaderboard")}</h2>
        <LeaderboardTable />
      </section>
    </div>
  );
}
