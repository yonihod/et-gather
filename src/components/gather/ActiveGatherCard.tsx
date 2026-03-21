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
  const [actionLoading, setActionLoading] = useState(false);
  const prevCountRef = useRef(0);
  const supabase = createClient();

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchActiveGather();

    const channel = supabase
      .channel("active-gather")
      .on("postgres_changes", { event: "*", schema: "public", table: "gathers" }, () => fetchActiveGather())
      .on("postgres_changes", { event: "*", schema: "public", table: "gather_participants" }, () => fetchActiveGather())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function joinGather() {
    if (!userId || !gather) return;
    setActionLoading(true);
    await supabase.from("gather_participants").insert({ gather_id: gather.id, user_id: userId });
    await fetchActiveGather();
    setActionLoading(false);
  }

  async function leaveGather() {
    if (!userId || !gather) return;
    setActionLoading(true);
    await supabase.from("gather_participants").delete().eq("gather_id", gather.id).eq("user_id", userId);
    await fetchActiveGather();
    setActionLoading(false);
  }

  async function cancelGather(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!gather) return;
    await supabase
      .from("gathers")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", gather.id);
    setGather(null);
  }

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="h-6 skeleton-scan rounded w-1/3" />
        <div className="h-4 skeleton-scan rounded w-1/2 mt-3" />
      </div>
    );
  }

  // Mock gather (no real gather active)
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
            <div key={name} className="flex items-center gap-2 py-1.5 text-sm border-b border-border/40 animate-slot-pop" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-xs">🇮🇱</span>
              <span className="font-medium">{name}</span>
            </div>
          ))}
          {Array.from({ length: mockMax - mockCount }).map((_, i) => (
            <div key={`empty-${i}`} className="py-1.5 text-sm text-primary/40 border-b border-border/20 italic">
              + {t("gather.join")}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-5">
          {Array.from({ length: mockMax }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < mockCount ? "bg-primary animate-segment-fill" : "bg-border"}`} style={i < mockCount ? { animationDelay: `${i * 50 + 200}ms` } : undefined} />
          ))}
        </div>
      </Link>
    );
  }

  // Real gather
  const participants = gather.participants ?? [];
  const participantCount = participants.length;
  const prevCount = prevCountRef.current;
  prevCountRef.current = participantCount;

  const isCreator = gather.created_by === userId;
  const isInGather = participants.some((p) => p.user_id === userId);
  const isFull = participantCount >= gather.max_players;
  const isLive = gather.status === "live";

  const statusVariant = {
    open: "default" as const,
    ready: "secondary" as const,
    live: "destructive" as const,
    completed: "outline" as const,
    cancelled: "outline" as const,
  }[gather.status];

  return (
    <div
      className={`border rounded-md p-6 transition-all duration-300 ${
        isLive ? "animate-tactical-pulse border-destructive/40" : "hover:border-primary/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <Link href={`/gather/${gather.id}` as "/gather"} className="flex items-center gap-3">
          <Badge variant={statusVariant}>{t(`gather.status.${gather.status}`)}</Badge>
          <span className="text-sm text-muted-foreground">{t(`gather.mode.${gather.mode}`)}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">
            <span className="font-bold">{participantCount}</span>
            <span className="text-muted-foreground">/{gather.max_players}</span>
          </span>
          {isCreator && ["open", "ready", "live"].includes(gather.status) && (
            <button onClick={cancelGather} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              {t("gather.cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Player slots */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4">
        {participants.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between py-1.5 text-sm border-b border-border/40 ${
              i >= prevCount ? "animate-slot-pop" : ""
            }`}
            style={i >= prevCount ? { animationDelay: `${(i - prevCount) * 60}ms` } : undefined}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">🇮🇱</span>
              <span className="font-medium">{p.profile?.display_name || "Player"}</span>
            </div>
            {p.user_id === userId && gather.status === "open" && (
              <button
                onClick={leaveGather}
                disabled={actionLoading}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                {t("gather.leave")}
              </button>
            )}
          </div>
        ))}

        {/* Empty slots — show join button if logged in and not already in */}
        {Array.from({ length: gather.max_players - participantCount }).map((_, i) => (
          <div key={`slot-${i}`} className="py-1.5 text-sm border-b border-border/20">
            {userId && !isInGather && !isFull && gather.status === "open" && i === 0 ? (
              <button
                onClick={joinGather}
                disabled={actionLoading}
                className="text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
              >
                + {t("gather.join")}
              </button>
            ) : (
              <span className="text-muted-foreground/30 italic">
                {!userId ? t("gather.mustLogin") : `slot ${participantCount + i + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar — flashes gold when full */}
      <div className={`flex gap-1 mt-2 ${isFull && prevCount < gather.max_players ? "animate-locked-flash" : ""}`}>
        {Array.from({ length: gather.max_players }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
              i < participantCount
                ? isLive ? "bg-destructive" : isFull ? "bg-accent" : "bg-primary"
                : "bg-border"
            } ${i >= prevCount && i < participantCount ? "animate-segment-fill" : ""}`}
            style={i >= prevCount && i < participantCount ? { animationDelay: `${(i - prevCount) * 50}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
