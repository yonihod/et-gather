"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GatherWithParticipants, GatherMode } from "@/types/gather";

export function GatherQueue() {
  const t = useTranslations("gather");
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("gather-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathers" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gather_participants" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function createGather(mode: GatherMode) {
    if (!userId) return;
    setActionLoading(true);

    const { error } = await supabase.from("gathers").insert({
      mode,
      created_by: userId,
      status: "open",
    });

    if (!error) await fetchData();
    setActionLoading(false);
  }

  async function joinGather() {
    if (!userId || !gather) return;
    setActionLoading(true);

    const { error } = await supabase.from("gather_participants").insert({
      gather_id: gather.id,
      user_id: userId,
    });

    if (!error) await fetchData();
    setActionLoading(false);
  }

  async function leaveGather() {
    if (!userId || !gather) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("gather_participants")
      .delete()
      .eq("gather_id", gather.id)
      .eq("user_id", userId);

    if (!error) await fetchData();
    setActionLoading(false);
  }

  async function updateGatherStatus(status: string) {
    if (!gather) return;
    setActionLoading(true);

    const updates: Record<string, unknown> = { status };
    if (status === "live") updates.live_at = new Date().toISOString();
    if (status === "completed")
      updates.completed_at = new Date().toISOString();
    if (status === "cancelled")
      updates.cancelled_at = new Date().toISOString();

    await supabase.from("gathers").update(updates).eq("id", gather.id);
    await fetchData();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-lg p-8 border border-border animate-pulse">
        <div className="h-8 bg-surface-hover rounded w-1/3 mx-auto" />
      </div>
    );
  }

  // No active gather — show create buttons
  if (!gather) {
    if (!userId) {
      return (
        <div className="bg-surface rounded-lg p-8 border border-border text-center">
          <p className="text-muted">{t("mustLogin")}</p>
        </div>
      );
    }

    return (
      <div className="bg-surface rounded-lg p-8 border border-border text-center space-y-4">
        <p className="text-muted">No active gather</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => createGather("5v5")}
            disabled={actionLoading}
            className="bg-accent text-background px-6 py-2.5 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {t("create")} — {t("mode.5v5")}
          </button>
          <button
            onClick={() => createGather("6v6")}
            disabled={actionLoading}
            className="bg-accent text-background px-6 py-2.5 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {t("create")} — {t("mode.6v6")}
          </button>
        </div>
      </div>
    );
  }

  const participants = gather.participants ?? [];
  const isInGather = participants.some((p) => p.user_id === userId);
  const isCreator = gather.created_by === userId;
  const isFull = participants.length >= gather.max_players;
  const halfSize = gather.max_players / 2;

  const team1 = participants.filter((p) => p.team === 1);
  const team2 = participants.filter((p) => p.team === 2);
  const unassigned = participants.filter((p) => p.team === null);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              gather.status === "open"
                ? "bg-green-400 animate-pulse"
                : gather.status === "ready"
                ? "bg-yellow-400"
                : gather.status === "live"
                ? "bg-red-400 animate-pulse"
                : "bg-muted"
            }`}
          />
          <span className="font-semibold">{t(`status.${gather.status}`)}</span>
          <span className="text-muted text-sm">{t(`mode.${gather.mode}`)}</span>
        </div>
        <span className="text-sm">
          <span className="text-foreground font-semibold">
            {participants.length}
          </span>
          <span className="text-muted">/{gather.max_players}</span>
        </span>
      </div>

      {/* Player slots */}
      <div className="p-6">
        {gather.status === "open" || (gather.status === "ready" && team1.length === 0) ? (
          // Show queue grid
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: gather.max_players }).map((_, i) => {
              const participant = unassigned[i] || participants[i];
              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-center text-sm ${
                    participant
                      ? "bg-accent/10 border border-accent/20 text-foreground"
                      : "bg-surface-hover border border-border text-muted"
                  }`}
                >
                  {participant?.profile?.display_name ||
                    participant?.profile?.et_nickname ||
                    `Slot ${i + 1}`}
                </div>
              );
            })}
          </div>
        ) : (
          // Show teams
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-center mb-3">{t("team1")}</h3>
              <div className="space-y-2">
                {Array.from({ length: halfSize }).map((_, i) => {
                  const p = team1[i];
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-center text-sm ${
                        p
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-surface-hover border border-border text-muted"
                      }`}
                    >
                      {p?.profile?.display_name || `Slot ${i + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-center mb-3">{t("team2")}</h3>
              <div className="space-y-2">
                {Array.from({ length: halfSize }).map((_, i) => {
                  const p = team2[i];
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-center text-sm ${
                        p
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-surface-hover border border-border text-muted"
                      }`}
                    >
                      {p?.profile?.display_name || `Slot ${i + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border flex justify-center gap-3">
        {userId && gather.status === "open" && !isInGather && !isFull && (
          <button
            onClick={joinGather}
            disabled={actionLoading}
            className="bg-accent text-background px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {t("join")}
          </button>
        )}
        {userId && gather.status === "open" && isInGather && (
          <button
            onClick={leaveGather}
            disabled={actionLoading}
            className="bg-red-500/10 text-red-400 px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {t("leave")}
          </button>
        )}
        {isCreator && gather.status === "ready" && (
          <button
            onClick={() => updateGatherStatus("live")}
            disabled={actionLoading}
            className="bg-accent text-background px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {t("start")}
          </button>
        )}
        {isCreator && gather.status === "live" && (
          <button
            onClick={() => updateGatherStatus("completed")}
            disabled={actionLoading}
            className="bg-accent text-background px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {t("complete")}
          </button>
        )}
        {isCreator &&
          ["open", "ready", "live"].includes(gather.status) && (
            <button
              onClick={() => updateGatherStatus("cancelled")}
              disabled={actionLoading}
              className="bg-surface-hover text-muted px-6 py-2 rounded-lg text-sm font-medium hover:text-foreground transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          )}
        {!userId && (
          <p className="text-muted text-sm">{t("mustLogin")}</p>
        )}
      </div>
    </div>
  );
}
