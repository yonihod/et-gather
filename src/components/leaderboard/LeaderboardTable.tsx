"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AttendanceStats } from "@/types/gather";
import { MOCK_LEADERBOARD } from "@/lib/mock-data";

type Period = "allTime" | "last30" | "last7";

export function LeaderboardTable() {
  const t = useTranslations("leaderboard");
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [period, setPeriod] = useState<Period>("allTime");
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const prevPeriod = useRef<Period>(period);

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
        setStats((data as AttendanceStats[])?.length ? (data as AttendanceStats[]) : MOCK_LEADERBOARD);
      } else {
        const days = period === "last30" ? 30 : 7;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const { data } = await supabase.rpc("get_leaderboard", {
          since_date: since.toISOString(),
        });
        setStats((data as AttendanceStats[])?.length ? (data as AttendanceStats[]) : MOCK_LEADERBOARD.slice(0, 5));
      }
      setLoading(false);

      if (prevPeriod.current !== period) {
        setAnimKey((k) => k + 1);
        prevPeriod.current = period;
      }
    }
    fetch();
  }, [period]);

  const rankGlow = (i: number) =>
    i === 0 ? "rank-glow-gold" : i === 1 ? "rank-glow-silver" : i === 2 ? "rank-glow-bronze" : "";

  return (
    <div className="hud-corners">
      {/* Period selector */}
      <div className="flex gap-1 mb-4">
        {(["allTime", "last30", "last7"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`relative px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
              period === p
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(p)}
          </button>
        ))}
      </div>

      <div className="border rounded-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="skeleton-scan h-4 rounded w-1/3 mx-auto" />
          </div>
        ) : stats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm italic">No intel yet — play some gathers to get on the board.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="scoreboard-header">
                <TableHead className="w-14">{t("rank")}</TableHead>
                <TableHead>{t("player")}</TableHead>
                <TableHead className="text-end">{t("gathers")}</TableHead>
                <TableHead className="text-end">{t("points")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={animKey}>
              {stats.map((s, i) => (
                <TableRow
                  key={s.user_id}
                  className={`transition-colors duration-150 hover:bg-secondary/50 animate-row-enter scoreboard-row ${rankGlow(i)}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <TableCell>
                    {i < 3 ? (
                      <span className={`rank-badge ${
                        i === 0 ? "rank-badge-gold" : i === 1 ? "rank-badge-silver" : "rank-badge-bronze"
                      }`}>
                        {i + 1}
                      </span>
                    ) : (
                      <span className="rank-badge text-muted-foreground/50">{i + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/profile/${s.user_id}` as "/"} className="flex items-center gap-3 transition-colors duration-150 hover:text-primary">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={s.avatar_url || undefined} />
                        <AvatarFallback className={`text-xs ${
                          i === 0 ? "bg-yellow-500/15 text-yellow-400"
                          : i === 1 ? "bg-slate-400/15 text-slate-300"
                          : i === 2 ? "bg-orange-500/15 text-orange-400"
                          : ""
                        }`}>
                          {s.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`font-medium ${i === 0 ? "shimmer-gold" : ""}`}>{s.display_name}</span>
                      {s.et_nickname && s.et_nickname !== s.display_name && (
                        <span className="text-muted-foreground text-xs">({s.et_nickname})</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground tabular-nums">
                    {period === "allTime" ? s.total_gathers : s.gathers_last_30_days}
                  </TableCell>
                  <TableCell className={`text-end font-bold tabular-nums ${
                    i === 0 ? "text-yellow-400"
                    : i === 1 ? "text-slate-300"
                    : i === 2 ? "text-orange-400"
                    : "text-primary"
                  }`}>
                    {s.attendance_points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
