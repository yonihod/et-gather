"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full">
          <div className="px-4 pt-3">
            <TabsList>
              <TabsTrigger value="allTime">{t("allTime")}</TabsTrigger>
              <TabsTrigger value="last30">{t("last30")}</TabsTrigger>
              <TabsTrigger value="last7">{t("last7")}</TabsTrigger>
            </TabsList>
          </div>

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
                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Link href={`/profile/${s.user_id}` as "/"} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={s.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{s.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{s.display_name}</span>
                        {s.et_nickname && <span className="text-muted-foreground text-xs">({s.et_nickname})</span>}
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
