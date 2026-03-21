"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

  if (loading) {
    return <div className="animate-pulse h-40 bg-surface rounded-lg" />;
  }

  if (!gather) {
    return <p className="text-muted">Gather not found</p>;
  }

  const participants = gather.participants ?? [];
  const team1 = participants.filter((p) => p.team === 1);
  const team2 = participants.filter((p) => p.team === 2);
  const unassigned = participants.filter((p) => p.team === null);
  const halfSize = gather.max_players / 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted">{t(`mode.${gather.mode}`)}</span>
        <span
          className={`text-sm px-2 py-0.5 rounded-full ${
            gather.status === "completed"
              ? "bg-green-500/10 text-green-400"
              : gather.status === "cancelled"
              ? "bg-red-500/10 text-red-400"
              : "bg-accent/10 text-accent"
          }`}
        >
          {t(`status.${gather.status}`)}
        </span>
      </div>

      {/* Teams display */}
      {team1.length > 0 || team2.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="font-semibold text-center mb-3 text-blue-400">
              {t("team1")}
            </h3>
            <div className="space-y-2">
              {Array.from({ length: halfSize }).map((_, i) => {
                const p = team1[i];
                return (
                  <div
                    key={i}
                    className="bg-blue-500/5 rounded p-2 text-center text-sm"
                  >
                    {p?.profile?.display_name || "—"}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="font-semibold text-center mb-3 text-red-400">
              {t("team2")}
            </h3>
            <div className="space-y-2">
              {Array.from({ length: halfSize }).map((_, i) => {
                const p = team2[i];
                return (
                  <div
                    key={i}
                    className="bg-red-500/5 rounded p-2 text-center text-sm"
                  >
                    {p?.profile?.display_name || "—"}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border p-4">
          <h3 className="font-semibold mb-3">
            Players ({unassigned.length}/{gather.max_players})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {unassigned.map((p) => (
              <div key={p.id} className="bg-accent/5 rounded p-2 text-center text-sm">
                {p.profile?.display_name || "Player"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-muted space-y-1">
        <p>Created: {new Date(gather.created_at).toLocaleString()}</p>
        {gather.completed_at && (
          <p>Completed: {new Date(gather.completed_at).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
