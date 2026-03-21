"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import type { GatherWithParticipants } from "@/types/gather";

export function ActiveGatherCard() {
  const t = useTranslations();
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchActiveGather() {
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

    // Subscribe to realtime changes
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
    return (
      <div className="bg-surface rounded-lg p-6 border border-border animate-pulse">
        <div className="h-6 bg-surface-hover rounded w-1/3" />
      </div>
    );
  }

  if (!gather) {
    return (
      <div className="bg-surface rounded-lg p-6 border border-border text-center">
        <p className="text-muted">{t("home.noActiveGather")}</p>
        <Link
          href="/gather"
          className="inline-block mt-3 bg-accent text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t("home.createGather")}
        </Link>
      </div>
    );
  }

  const participantCount = gather.participants?.length ?? 0;
  const statusColor = {
    open: "text-green-400",
    ready: "text-yellow-400",
    live: "text-red-400",
    completed: "text-muted",
    cancelled: "text-muted",
  }[gather.status];

  return (
    <Link
      href={`/gather/${gather.id}` as "/gather"}
      className="block bg-surface rounded-lg p-6 border border-border hover:border-accent/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-sm font-medium ${statusColor}`}>
            {t(`gather.status.${gather.status}`)}
          </span>
          <span className="text-muted mx-2">·</span>
          <span className="text-sm text-muted">
            {t(`gather.mode.${gather.mode}`)}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-foreground font-semibold">
            {participantCount}
          </span>
          <span className="text-muted">/{gather.max_players}</span>
        </div>
      </div>

      {/* Player slots visualization */}
      <div className="flex gap-1.5 mt-4">
        {Array.from({ length: gather.max_players }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < participantCount ? "bg-accent" : "bg-surface-hover"
            }`}
          />
        ))}
      </div>
    </Link>
  );
}
