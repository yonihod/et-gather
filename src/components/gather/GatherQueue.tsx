"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants, GatherMode } from "@/types/gather";

export function GatherQueue() {
  const t = useTranslations("gather");
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("gather-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "gathers" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "gather_participants" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function createGather(mode: GatherMode) {
    if (!userId) return;
    setActionLoading(true);
    await supabase.from("gathers").insert({ mode, created_by: userId, status: "open" });
    await fetchData();
    setActionLoading(false);
  }

  async function joinGather() {
    if (!userId || !gather) return;
    setActionLoading(true);
    await supabase.from("gather_participants").insert({ gather_id: gather.id, user_id: userId });
    await fetchData();
    setActionLoading(false);
  }

  async function leaveGather() {
    if (!userId || !gather) return;
    setActionLoading(true);
    await supabase.from("gather_participants").delete().eq("gather_id", gather.id).eq("user_id", userId);
    await fetchData();
    setActionLoading(false);
  }

  async function updateGatherStatus(status: string) {
    if (!gather) return;
    setActionLoading(true);
    const updates: Record<string, unknown> = { status };
    if (status === "live") updates.live_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
    await supabase.from("gathers").update(updates).eq("id", gather.id);
    await fetchData();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="h-8 skeleton-scan rounded w-1/3 mx-auto" />
          <div className="h-4 skeleton-scan rounded w-1/2 mx-auto mt-3" />
        </CardContent>
      </Card>
    );
  }

  if (!gather) {
    if (!userId) {
      return (
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">{t("mustLogin")}</p></CardContent></Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <TacticalEmptyState />
          <div className="flex flex-wrap justify-center gap-2">
            {(["3v3", "4v4", "5v5", "6v6"] as const).map((mode) => (
              <Button key={mode} onClick={() => createGather(mode)} disabled={actionLoading} variant={mode === "6v6" ? "default" : "secondary"} size="sm">
                {t("create")} — {t(`mode.${mode}`)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
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

  const isLive = gather.status === "live";
  const statusChanged = prevStatusRef.current !== null && prevStatusRef.current !== gather.status;
  const prevCount = prevCountRef.current;
  prevStatusRef.current = gather.status;
  prevCountRef.current = participants.length;

  return (
    <Card
      className={`transition-all duration-500 ${
        isLive ? "animate-tactical-pulse border-destructive/40" : ""
      } ${statusChanged ? "animate-slot-pop" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              gather.status === "open" ? "bg-green-500 animate-pulse"
              : gather.status === "ready" ? "bg-yellow-500"
              : gather.status === "live" ? "bg-red-500 animate-heartbeat"
              : "bg-muted-foreground"
            }`}
          />
          <CardTitle className={`text-base ${
            gather.status === "open" ? "status-open"
            : gather.status === "live" ? "status-live"
            : gather.status === "ready" ? "status-ready"
            : ""
          }`}>{t(`status.${gather.status}`)}</CardTitle>
          <Badge variant="outline">{t(`mode.${gather.mode}`)}</Badge>
        </div>
        <span className="text-sm">
          <span className="font-semibold">{participants.length}</span>
          <span className="text-muted-foreground">/{gather.max_players}</span>
        </span>
      </CardHeader>

      <CardContent>
        {/* Player slots */}
        {gather.status === "open" || (gather.status === "ready" && team1.length === 0) ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: gather.max_players }).map((_, i) => {
              const participant = unassigned[i] || participants[i];
              const isNew = participant && i >= prevCount;
              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-center text-sm transition-all duration-300 ${
                    participant
                      ? "slot-filled text-foreground"
                      : "slot-empty"
                  } ${isNew ? "animate-slot-pop" : ""}`}
                  style={isNew ? { animationDelay: `${(i - prevCount) * 60}ms` } : undefined}
                >
                  {participant?.profile?.display_name || participant?.profile?.et_nickname || `Slot ${i + 1}`}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-center mb-3 text-blue-400">{t("team1")}</h3>
              <div className="space-y-2">
                {Array.from({ length: halfSize }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-center text-sm transition-all duration-300 ${
                      team1[i]
                        ? "bg-blue-500/10 border border-blue-500/20 animate-slot-pop"
                        : "bg-secondary text-muted-foreground"
                    }`}
                    style={team1[i] ? { animationDelay: `${i * 80}ms` } : undefined}
                  >
                    {team1[i]?.profile?.display_name || `Slot ${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-center mb-3 text-red-400">{t("team2")}</h3>
              <div className="space-y-2">
                {Array.from({ length: halfSize }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-center text-sm transition-all duration-300 ${
                      team2[i]
                        ? "bg-red-500/10 border border-red-500/20 animate-slot-pop"
                        : "bg-secondary text-muted-foreground"
                    }`}
                    style={team2[i] ? { animationDelay: `${i * 80 + 200}ms` } : undefined}
                  >
                    {team2[i]?.profile?.display_name || `Slot ${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Animated progress bar — flashes when full ("locked and loaded") */}
        <div className={`flex gap-1 mt-6 ${isFull && prevCount < gather.max_players ? "animate-locked-flash" : ""}`}>
          {Array.from({ length: gather.max_players }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
                i < participants.length
                  ? isLive ? "bg-destructive" : isFull ? "bg-accent" : "bg-primary"
                  : "bg-border"
              } ${i >= prevCount && i < participants.length ? "animate-segment-fill" : ""}`}
              style={
                i >= prevCount && i < participants.length
                  ? { animationDelay: `${(i - prevCount) * 50}ms` }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 mt-6 pt-4 border-t">
          {userId && gather.status === "open" && !isInGather && !isFull && (
            <Button onClick={joinGather} disabled={actionLoading}>{t("join")}</Button>
          )}
          {userId && gather.status === "open" && isInGather && (
            <Button onClick={leaveGather} disabled={actionLoading} variant="destructive">{t("leave")}</Button>
          )}
          {isCreator && gather.status === "ready" && (
            <Button onClick={() => updateGatherStatus("live")} disabled={actionLoading}>{t("start")}</Button>
          )}
          {isCreator && gather.status === "live" && (
            <Button onClick={() => updateGatherStatus("completed")} disabled={actionLoading}>{t("complete")}</Button>
          )}
          {isCreator && ["open", "ready", "live"].includes(gather.status) && (
            <Button onClick={() => updateGatherStatus("cancelled")} disabled={actionLoading} variant="ghost">{t("cancel")}</Button>
          )}
          {!userId && <p className="text-muted-foreground text-sm">{t("mustLogin")}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const TACTICAL_MESSAGES = [
  "Waiting for operators...",
  "Briefing room is empty",
  "No active deployment",
  "All units on standby",
  "Be the first to deploy",
];

function TacticalEmptyState() {
  // Pick a message based on the current minute so it changes but isn't random on every render
  const msgIndex = Math.floor(Date.now() / 60000) % TACTICAL_MESSAGES.length;
  return (
    <p className="text-muted-foreground italic">
      {TACTICAL_MESSAGES[msgIndex]}
    </p>
  );
}
