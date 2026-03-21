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
    <div className="space-y-20">
      {/* Hero */}
      <section className="pt-16 pb-8">
        <div className="grid md:grid-cols-[1fr_auto] gap-12 items-center">
          <div className="space-y-6">
            <p className="animate-fade-up text-xs font-semibold tracking-[0.2em] uppercase text-accent">
              RTCW: Enemy Territory
            </p>
            <h1 className="animate-fade-up delay-100 font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="text-primary">ET</span> Gather
              <br />
              <span className="text-muted-foreground text-3xl md:text-4xl font-normal tracking-normal">
                Israel
              </span>
            </h1>
            <p className="animate-fade-up delay-200 text-muted-foreground max-w-[45ch] text-base leading-relaxed">
              {t("home.subtitle")}
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-3 pt-2">
              <Link
                href="/gather"
                className="inline-flex items-center h-11 px-6 rounded-md text-sm font-semibold bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {t("home.createGather")}
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center h-11 px-6 rounded-md text-sm font-medium text-muted-foreground border border-border transition-all duration-200 hover:text-accent hover:border-accent/40 active:translate-y-[0px]"
              >
                {t("home.joinCommunity")}
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-400 flex gap-8 pt-6 text-sm">
              <div>
                <span className="font-display text-3xl font-bold text-accent tabular-nums">20+</span>
                <span className="block text-muted-foreground mt-0.5">{t("home.statsPlayers")}</span>
              </div>
              <div className="border-s border-border ps-8">
                <span className="font-display text-3xl font-bold text-primary">6v6</span>
                <span className="block text-muted-foreground mt-0.5">{t("home.statsMode")}</span>
              </div>
              <div className="border-s border-border ps-8">
                <span className="text-3xl">🇮🇱</span>
                <span className="block text-muted-foreground mt-0.5">{t("home.statsRegion")}</span>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="hidden md:block animate-slide-right delay-200">
            <Image
              src="/images/logo.png"
              alt="ET Gather Israel"
              width={300}
              height={300}
              className="opacity-90 drop-shadow-[0_0_40px_oklch(0.65_0.14_145_/_0.1)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Server Status + Active Gather */}
      <section className="animate-fade-up delay-500">
        <div className="grid md:grid-cols-[1fr_300px] gap-10">
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight">{t("home.activeGather")}</h2>
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
      <section className="pb-16">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-8">{t("home.leaderboard")}</h2>
        <LeaderboardTable />
      </section>
    </div>
  );
}
