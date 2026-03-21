"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants } from "@/types/gather";

export function GatherDetail({ gatherId }: { gatherId: string }) {
  const t = useTranslations("gather");
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("gathers")
        .select("*, participants:gather_participants(*, profile:profiles(*))")
        .eq("id", gatherId)
        .single();
      setGather(data as GatherWithParticipants | null);
      setLoading(false);
    }
    fetch();
  }, [gatherId]);

  if (loading) return <div className="animate-pulse h-40 bg-card rounded-lg" />;
  if (!gather) return <p className="text-muted-foreground">Gather not found</p>;

  const participants = gather.participants ?? [];
  const team1 = participants.filter((p) => p.team === 1);
  const team2 = participants.filter((p) => p.team === 2);
  const unassigned = participants.filter((p) => p.team === null);
  const halfSize = gather.max_players / 2;

  const statusVariant = {
    open: "default" as const,
    ready: "secondary" as const,
    live: "destructive" as const,
    completed: "default" as const,
    cancelled: "outline" as const,
  }[gather.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Badge variant="outline">{t(`mode.${gather.mode}`)}</Badge>
        <Badge variant={statusVariant}>{t(`status.${gather.status}`)}</Badge>
      </div>

      {team1.length > 0 || team2.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-blue-400">{t("team1")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: halfSize }).map((_, i) => (
                <div key={i} className={`rounded-lg p-3 text-center text-sm ${team1[i] ? "bg-blue-500/5 border border-blue-500/20" : "bg-secondary text-muted-foreground"}`}>
                  {team1[i]?.profile?.display_name || "—"}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-red-400">{t("team2")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: halfSize }).map((_, i) => (
                <div key={i} className={`rounded-lg p-3 text-center text-sm ${team2[i] ? "bg-red-500/5 border border-red-500/20" : "bg-secondary text-muted-foreground"}`}>
                  {team2[i]?.profile?.display_name || "—"}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Players ({unassigned.length}/{gather.max_players})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {unassigned.map((p) => (
                <div key={p.id} className="bg-primary/5 rounded-lg p-3 text-center text-sm border border-primary/10">
                  {p.profile?.display_name || "Player"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Created: {new Date(gather.created_at).toLocaleString()}</p>
        {gather.completed_at && <p>Completed: {new Date(gather.completed_at).toLocaleString()}</p>}
      </div>
    </div>
  );
}
