"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
    }
    fetch();
  }, [period]);

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(["allTime", "last30", "last7"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
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
            <div className="animate-pulse h-4 bg-secondary rounded w-1/3 mx-auto" />
          </div>
        ) : stats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No data yet</div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t("rank")}</TableHead>
                  <TableHead>{t("player")}</TableHead>
                  <TableHead className="text-end">{t("gathers")}</TableHead>
                  <TableHead className="text-end">{t("points")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, i) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {i === 0 ? <span className="text-yellow-400 text-lg">🥇</span>
                        : i === 1 ? <span className="text-gray-300 text-lg">🥈</span>
                        : i === 2 ? <span className="text-amber-600 text-lg">🥉</span>
                        : i + 1}
                    </TableCell>
                    <TableCell>
                      <Link href={`/profile/${s.user_id}` as "/"} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <span className="text-base" title="Israel">🇮🇱</span>
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={s.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{s.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{s.display_name}</span>
                        {s.et_nickname && s.et_nickname !== s.display_name && <span className="text-muted-foreground text-xs">({s.et_nickname})</span>}
                      </Link>
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {period === "allTime" ? s.total_gathers : s.gathers_last_30_days}
                    </TableCell>
                    <TableCell className="text-end font-semibold text-primary">
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
