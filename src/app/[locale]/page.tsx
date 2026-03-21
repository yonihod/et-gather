import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ActiveGatherCard } from "@/components/gather/ActiveGatherCard";
import { ServerStatus } from "@/components/server/ServerStatus";
import { RadarCanvas } from "@/components/effects/RadarCanvas";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="space-y-20">
      {/* Hero — topo grid background for war room feel */}
      <section className="relative pt-16 pb-8 -mx-4 sm:-mx-6 px-4 sm:px-6 topo-grid">
        <div className="grid md:grid-cols-[1fr_auto] gap-12 items-center">
          <div className="space-y-8">
            <p className="animate-fade-up text-xs font-bold tracking-[0.25em] uppercase text-accent">
              RTCW: Enemy Territory
            </p>
            <h1 className="animate-fade-up delay-100 font-display text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.95]">
              <span className="text-primary">ET</span> Gather
              <br />
              <span className="text-muted-foreground text-2xl md:text-3xl font-light tracking-wide uppercase">
                Israel
              </span>
            </h1>
            <p className="animate-fade-up delay-200 text-muted-foreground max-w-[42ch] text-base leading-relaxed">
              {t("home.subtitle")}
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-4 pt-4">
              <Link
                href="/gather"
                className="clip-tactical-lg btn-crosshair inline-flex items-center h-12 px-8 text-sm font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-primary/60 transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(34,197,94,0.25)] active:scale-[0.97]"
              >
                {t("home.createGather")}
              </Link>
              <Link
                href="/community"
                className="clip-tactical-lg btn-crosshair inline-flex items-center h-12 px-8 text-sm font-semibold uppercase tracking-wider text-foreground/80 border border-border bg-transparent transition-all duration-200 hover:text-accent hover:border-accent/50 active:scale-[0.97]"
              >
                {t("home.joinCommunity")}
              </Link>
            </div>

            {/* Stats — punched up scale */}
            <div className="animate-fade-up delay-400 flex gap-10 pt-8">
              <div>
                <span className="font-display text-5xl font-extrabold text-accent tabular-nums">20+</span>
                <span className="block text-muted-foreground text-xs uppercase tracking-wider mt-1">{t("home.statsPlayers")}</span>
              </div>
              <div className="border-s-2 border-border ps-10">
                <span className="font-display text-5xl font-extrabold text-primary">6v6</span>
                <span className="block text-muted-foreground text-xs uppercase tracking-wider mt-1">{t("home.statsMode")}</span>
              </div>
              <div className="border-s-2 border-border ps-10">
                <span className="text-5xl">🇮🇱</span>
                <span className="block text-muted-foreground text-xs uppercase tracking-wider mt-1">{t("home.statsRegion")}</span>
              </div>
            </div>
          </div>

          {/* Logo with radar behind it */}
          <div className="hidden md:flex items-center justify-center relative animate-slide-right delay-200">
            <div className="absolute inset-0 flex items-center justify-center -m-[90px]">
              <RadarCanvas />
            </div>
            <Image
              src="/images/logo.png"
              alt="ET Gather Israel"
              width={300}
              height={300}
              className="relative z-10 opacity-90 drop-shadow-[0_0_40px_oklch(0.65_0.14_145_/_0.1)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="scroll-reveal h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Server Status + Active Gather */}
      <section className="scroll-reveal">
        <div className="grid md:grid-cols-[1fr_300px] gap-10">
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-display text-3xl font-extrabold tracking-tight">{t("home.activeGather")}</h2>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <ActiveGatherCard />
          </div>
          <div>
            <ServerStatus />
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="scroll-reveal pb-16">
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{t("home.leaderboard")}</h2>
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono border border-border/40 px-2 py-0.5 rounded">Top 20</span>
        </div>
        <LeaderboardTable />
      </section>
    </div>
  );
}
