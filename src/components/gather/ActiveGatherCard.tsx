"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants } from "@/types/gather";

export function ActiveGatherCard() {
  const t = useTranslations();
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-6 bg-secondary rounded w-1/3" /></CardContent></Card>;
  }

  if (!gather) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{t("home.noActiveGather")}</p>
          <Link
            href="/gather"
            className="inline-flex items-center justify-center mt-3 h-7 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            {t("home.createGather")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const participantCount = gather.participants?.length ?? 0;
  const statusVariant = {
    open: "default" as const,
    ready: "secondary" as const,
    live: "destructive" as const,
    completed: "outline" as const,
    cancelled: "outline" as const,
  }[gather.status];

  return (
    <Link href={`/gather/${gather.id}` as "/gather"} className="block">
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant}>
                {t(`gather.status.${gather.status}`)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t(`gather.mode.${gather.mode}`)}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">{participantCount}</span>
              <span className="text-muted-foreground">/{gather.max_players}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: gather.max_players }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < participantCount ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
