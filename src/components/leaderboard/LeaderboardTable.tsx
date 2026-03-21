"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import type { AttendanceStats } from "@/types/gather";

type Period = "allTime" | "last30" | "last7";

export function LeaderboardTable() {
  const t = useTranslations("leaderboard");
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [period, setPeriod] = useState<Period>("allTime");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const supabase = createClient();

      if (period === "allTime") {
        const { data } = await supabase
          .from("attendance_stats")
          .select("*")
          .order("attendance_points", { ascending: false })
          .limit(20);
        setStats((data as AttendanceStats[]) ?? []);
      } else {
        // For filtered periods, query base tables
        const days = period === "last30" ? 30 : 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data } = await supabase.rpc("get_leaderboard", {
          since_date: since.toISOString(),
        });
        setStats((data as AttendanceStats[]) ?? []);
      }
      setLoading(false);
    }
    fetch();
  }, [period]);

  const periods: { key: Period; label: string }[] = [
    { key: "allTime", label: t("allTime") },
    { key: "last30", label: t("last30") },
    { key: "last7", label: t("last7") },
  ];

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Period filter */}
      <div className="px-4 py-3 border-b border-border flex gap-1">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              period === p.key
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center animate-pulse">
          <div className="h-4 bg-surface-hover rounded w-1/3 mx-auto" />
        </div>
      ) : stats.length === 0 ? (
        <div className="p-8 text-center text-muted text-sm">
          No data yet
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs">
              <th className="px-4 py-2 text-start w-12">{t("rank")}</th>
              <th className="px-4 py-2 text-start">{t("player")}</th>
              <th className="px-4 py-2 text-end">{t("gathers")}</th>
              <th className="px-4 py-2 text-end">{t("points")}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr
                key={s.user_id}
                className="border-t border-border/50 hover:bg-surface-hover/50 transition-colors"
              >
                <td className="px-4 py-3 text-muted font-mono">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/profile/${s.user_id}` as "/"}
                    className="hover:text-accent transition-colors"
                  >
                    <span className="font-medium">{s.display_name}</span>
                    {s.et_nickname && (
                      <span className="text-muted ms-2 text-xs">
                        ({s.et_nickname})
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-end text-muted">
                  {period === "allTime"
                    ? s.total_gathers
                    : s.gathers_last_30_days}
                </td>
                <td className="px-4 py-3 text-end font-semibold text-accent">
                  {s.attendance_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
