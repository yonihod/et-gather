import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ActiveGatherCard } from "@/components/gather/ActiveGatherCard";
import { ServerStatus } from "@/components/server/ServerStatus";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-16">
      {/* Hero — asymmetric, staggered entrance */}
      <section className="pt-12 pb-8">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="space-y-5">
            <p className="animate-fade-up text-sm font-medium tracking-widest uppercase text-accent">
              RTCW: Enemy Territory
            </p>
            <h1 className="animate-fade-up delay-100 text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              <span className="text-primary">ET</span> Gather
              <br />
              <span className="text-muted-foreground text-3xl md:text-4xl font-normal">
                Israel
              </span>
            </h1>
            <p className="animate-fade-up delay-200 text-muted-foreground max-w-md text-base leading-relaxed">
              {t("home.subtitle")}
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-3 pt-2">
              <Link
                href="/gather"
                className="inline-flex items-center h-11 px-6 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 hover:translate-y-[-1px]"
              >
                {t("home.createGather")}
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center h-11 px-6 rounded-md text-sm font-medium text-muted-foreground border border-border hover:text-accent hover:border-accent/40 transition-all duration-200"
              >
                {t("home.joinCommunity")}
              </Link>
            </div>

            {/* Stats — colored accents */}
            <div className="animate-fade-up delay-400 flex gap-8 pt-4 text-sm">
              <div>
                <span className="text-2xl font-bold text-accent tabular-nums">20+</span>
                <span className="block text-muted-foreground">{t("home.statsPlayers")}</span>
              </div>
              <div className="border-s border-border ps-8">
                <span className="text-2xl font-bold text-primary">6v6</span>
                <span className="block text-muted-foreground">{t("home.statsMode")}</span>
              </div>
              <div className="border-s border-border ps-8">
                <span className="text-2xl font-bold text-foreground">🇮🇱</span>
                <span className="block text-muted-foreground">{t("home.statsRegion")}</span>
              </div>
            </div>
          </div>

          {/* Logo — entrance from right */}
          <div className="hidden md:block animate-slide-right delay-200">
            <Image
              src="/images/logo.png"
              alt="ET Gather Israel"
              width={280}
              height={280}
              className="opacity-90 drop-shadow-[0_0_40px_oklch(0.65_0.14_145_/_0.1)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Colored divider — subtle green accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Server Status + Active Gather */}
      <section className="animate-fade-up delay-500">
        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-2xl font-bold">{t("home.activeGather")}</h2>
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <ActiveGatherCard />
          </div>
          <div>
            <ServerStatus />
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="pb-12">
        <h2 className="text-2xl font-bold mb-6">{t("home.leaderboard")}</h2>
        <LeaderboardTable />
      </section>
    </div>
  );
}
