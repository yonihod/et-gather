"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants } from "@/types/gather";
import { MOCK_GATHER_PARTICIPANTS } from "@/lib/mock-data";

export function ActiveGatherCard() {
  const t = useTranslations();
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function fetchActiveGather() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data } = await supabase
        .from("gathers")
        .select("*, participants:gather_participants(*, profile:profiles(*))")
        .in("status", ["open", "ready", "live"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setGather(data as GatherWithParticipants | null);
      setLoading(false);
    }

    fetchActiveGather();

    const channel = supabase
      .channel("active-gather")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathers" },
        () => fetchActiveGather()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gather_participants" },
        () => fetchActiveGather()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="animate-pulse border rounded-md p-6"><div className="h-6 bg-secondary rounded w-1/3" /></div>;
  }

  if (!gather) {
    const mockCount = MOCK_GATHER_PARTICIPANTS.length;
    const mockMax = 10;
    return (
      <Link href="/gather" className="block border rounded-md p-6 hover:border-primary/40 transition-colors">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="default">{t("gather.status.open")}</Badge>
            <span className="text-sm text-muted-foreground">{t("gather.mode.5v5")}</span>
          </div>
          <span className="text-sm tabular-nums">
            <span className="font-bold text-foreground">{mockCount}</span>
            <span className="text-muted-foreground">/{mockMax}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {MOCK_GATHER_PARTICIPANTS.map((name, i) => (
            <div
              key={name}
              className="flex items-center gap-2 py-1.5 text-sm border-b border-border/40 animate-slot-pop"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-xs">🇮🇱</span>
              <span className="font-medium">{name}</span>
            </div>
          ))}
          {Array.from({ length: mockMax - mockCount }).map((_, i) => (
            <div key={`empty-${i}`} className="py-1.5 text-sm text-muted-foreground/40 border-b border-border/20">
              empty slot
            </div>
          ))}
        </div>

        {/* Animated progress */}
        <div className="flex gap-1 mt-5">
          {Array.from({ length: mockMax }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-sm ${
                i < mockCount ? "bg-primary animate-segment-fill" : "bg-border"
              }`}
              style={i < mockCount ? { animationDelay: `${i * 50 + 200}ms` } : undefined}
            />
          ))}
        </div>
      </Link>
    );
  }

  const participantCount = gather.participants?.length ?? 0;
  const prevCount = prevCountRef.current;
  prevCountRef.current = participantCount;

  const isCreator = gather.created_by === userId;
  const statusVariant = {
    open: "default" as const,
    ready: "secondary" as const,
    live: "destructive" as const,
    completed: "outline" as const,
    cancelled: "outline" as const,
  }[gather.status];

  const isLive = gather.status === "live";

  async function cancelGather(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await supabase
      .from("gathers")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", gather!.id);
    setGather(null);
  }

  return (
    <div
      className={`border rounded-md p-6 transition-all duration-300 ${
        isLive
          ? "animate-tactical-pulse border-destructive/40"
          : "hover:border-primary/40"
      }`}
    >
      <div className="flex items-baseline justify-between mb-4">
        <Link href={`/gather/${gather.id}` as "/gather"} className="flex items-center gap-3">
          <Badge variant={statusVariant}>
            {t(`gather.status.${gather.status}`)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t(`gather.mode.${gather.mode}`)}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">
            <span className="font-bold">{participantCount}</span>
            <span className="text-muted-foreground">/{gather.max_players}</span>
          </span>
          {isCreator && ["open", "ready", "live"].includes(gather.status) && (
            <button
              onClick={cancelGather}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              title={t("cancel")}
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Participants — with slot-pop animation for new joins */}
      {participantCount > 0 && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4">
          {gather.participants?.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 py-1.5 text-sm border-b border-border/40 ${
                i >= prevCount ? "animate-slot-pop" : ""
              }`}
              style={i >= prevCount ? { animationDelay: `${(i - prevCount) * 60}ms` } : undefined}
            >
              <span className="text-xs">🇮🇱</span>
              <span className="font-medium">{p.profile?.display_name || "Player"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Animated progress bar */}
      <div className="flex gap-1 mt-2">
        {Array.from({ length: gather.max_players }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
              i < participantCount
                ? isLive ? "bg-destructive" : "bg-primary"
                : "bg-border"
            } ${i >= prevCount && i < participantCount ? "animate-segment-fill" : ""}`}
            style={
              i >= prevCount && i < participantCount
                ? { animationDelay: `${(i - prevCount) * 50}ms` }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
