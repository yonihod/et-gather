"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants } from "@/types/gather";
import { MOCK_GATHER_PARTICIPANTS } from "@/lib/mock-data";

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
    // Show mock gather so the page doesn't look empty
    const mockCount = MOCK_GATHER_PARTICIPANTS.length;
    const mockMax = 10;
    return (
      <Link href="/gather" className="block">
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {t("gather.status.open")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t("gather.mode.5v5")}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{mockCount}</span>
                <span className="text-muted-foreground">/{mockMax}</span>
              </div>
            </div>

            {/* Player names */}
            <div className="flex flex-wrap gap-2 mt-4">
              {MOCK_GATHER_PARTICIPANTS.map((name) => (
                <span key={name} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                  {name}
                </span>
              ))}
              {Array.from({ length: mockMax - mockCount }).map((_, i) => (
                <span key={`empty-${i}`} className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-md">
                  ...
                </span>
              ))}
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: mockMax }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < mockCount ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
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
