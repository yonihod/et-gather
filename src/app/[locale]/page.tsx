import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ActiveGatherCard } from "@/components/gather/ActiveGatherCard";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          {t("home.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t("home.subtitle")}
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Link
            href="/gather"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            {t("home.createGather")}
          </Link>
        </div>
      </section>

      {/* Active Gather */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("home.activeGather")}</h2>
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
