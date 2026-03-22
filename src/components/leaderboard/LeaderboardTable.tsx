"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef, useCallback } from "react";
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
      {/* Period selector with sliding pill */}
      <PeriodTabs period={period} setPeriod={setPeriod} t={t} />

      <div className="border rounded-md overflow-hidden">
        {loading ? (
          <LeaderboardSkeleton />
        ) : stats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm italic">No intel yet — play some gathers to get on the board.</div>
        ) : (
          <div>
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
                {stats.map((s, i) => {
                  const isPodium = i < 3;
                  return (
                    <TableRow
                      key={s.user_id}
                      className={`row-hover-lift scoreboard-row ${rankGlow(i)} ${
                        isPodium ? "animate-podium-enter" : "animate-row-enter"
                      }`}
                      style={{ animationDelay: isPodium ? `${i * 150 + 100}ms` : `${i * 40 + 550}ms` }}
                    >
                      <TableCell>
                        {isPodium ? (
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
                        <AnimatedPoints value={s.attendance_points} delay={isPodium ? i * 150 + 300 : i * 40 + 750} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Animated counter for points — counts up from 0 to value */
function AnimatedPoints({ value, delay }: { value: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible || !ref.current) return;

    // Use CSS @property counter if supported
    if (CSS.supports && CSS.supports("transition", "--pts 0.5s")) {
      ref.current.style.setProperty("--pts", String(value));
      return;
    }

    // JS fallback: animate counter
    const el = ref.current;
    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo curve
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      el.textContent = String(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, value]);

  // Check reduced motion
  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return <span>{value}</span>;
  }

  // Try CSS @property approach first (chrome/edge/safari)
  if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("transition", "--pts 0.5s")) {
    return (
      <span
        ref={ref}
        className="count-pts"
        style={{ "--pts": visible ? value : 0 } as React.CSSProperties}
      />
    );
  }

  // JS fallback
  return <span ref={ref}>{visible ? value : 0}</span>;
}

const PERIODS: Period[] = ["allTime", "last30", "last7"];

function PeriodTabs({ period, setPeriod, t }: { period: Period; setPeriod: (p: Period) => void; t: (key: string) => string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const updatePill = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLElement>("[data-active='true']");
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, []);

  useEffect(() => {
    updatePill();
  }, [period, updatePill]);

  return (
    <div ref={containerRef} className="tab-pill-container flex gap-1 mb-4">
      <div
        className="tab-pill"
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />
      {PERIODS.map((p) => (
        <button
          key={p}
          data-active={period === p}
          onClick={() => setPeriod(p)}
          className={`relative z-10 px-3 py-1.5 rounded-md text-sm transition-colors duration-200 ${
            period === p
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(p)}
        </button>
      ))}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header row */}
      <div className="flex items-center px-4 py-3 border-b border-border/50">
        <div className="w-14 h-3 bg-secondary rounded" />
        <div className="flex-1 h-3 bg-secondary rounded ms-4 max-w-[80px]" />
        <div className="w-16 h-3 bg-secondary rounded ms-auto" />
        <div className="w-16 h-3 bg-secondary rounded ms-4" />
      </div>
      {/* Skeleton rows with staggered pulse */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center px-4 py-3 border-b border-border/20 animate-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`w-8 h-8 rounded-full ${i < 3 ? "bg-primary/10" : "bg-secondary"}`} style={{ animationDelay: `${i * 100}ms` }} />
          <div className="flex items-center gap-3 ms-3 flex-1">
            <div className="w-7 h-7 rounded-full bg-secondary" />
            <div className={`h-3.5 rounded ${i < 3 ? "bg-primary/10 w-28" : "bg-secondary w-24"}`} />
          </div>
          <div className="w-8 h-3 bg-secondary rounded ms-auto" />
          <div className={`w-10 h-3.5 rounded ms-4 ${i < 3 ? "bg-accent/10" : "bg-secondary"}`} />
        </div>
      ))}
    </div>
  );
}
