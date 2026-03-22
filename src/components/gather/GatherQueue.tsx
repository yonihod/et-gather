"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GatherWithParticipants, GatherMode, GatherParticipant } from "@/types/gather";
import { PlayerFigures } from "./PlayerFigures";
import { GatherChat } from "./GatherChat";

export function GatherQueue() {
  const t = useTranslations("gather");
  const [gather, setGather] = useState<GatherWithParticipants | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
  const supabase = createClient();

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data } = await supabase
      .from("gathers")
      .select("*, participants:gather_participants(*, profile:profiles(*))")
      .in("status", ["open", "ready", "live"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Auto-cancel stale gathers (open/ready for 30+ minutes)
    if (data && (data.status === "open" || data.status === "ready")) {
      const age = Date.now() - new Date(data.created_at).getTime();
      if (age > 30 * 60 * 1000) {
        await supabase
          .from("gathers")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", data.id);
        setGather(null);
        setLoading(false);
        return;
      }
    }

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

  const assignPlayer = useCallback(async (participantId: string, targetTeam: number | null) => {
    if (!gather) return;

    // Optimistic update
    setGather((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, team: targetTeam } : p
        ),
      };
    });

    setSelectedPlayer(null);

    await supabase
      .from("gather_participants")
      .update({ team: targetTeam })
      .eq("id", participantId);
    // Real-time subscription will confirm/correct
  }, [gather, supabase]);

  const isCreator = gather?.created_by === userId;
  const canAssign = isCreator && gather && ["open", "ready", "live"].includes(gather.status);

  // ── Render ────────────────────────────────────────────────────────
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

  // Show team view if teams are assigned, OR if creator wants to organize (has participants)
  const hasTeamAssignments = team1.length > 0 || team2.length > 0;
  const showTeams = hasTeamAssignments || (isCreator && participants.length >= 2);

  function getPlayerName(participant: GatherParticipant) {
    return participant.profile?.display_name || participant.profile?.et_nickname || "Player";
  }

  function renderUnassignedPlayer(participant: GatherParticipant, index: number) {
    const name = getPlayerName(participant);
    const isSelected = selectedPlayer === participant.id;

    return (
      <div key={participant.id} className="relative">
        <div
          onClick={canAssign ? () => setSelectedPlayer(isSelected ? null : participant.id) : undefined}
          className={`rounded-lg p-3 text-center text-sm transition-all duration-200 slot-filled text-foreground animate-slot-pop ${
            canAssign ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : ""
          } ${isSelected ? "ring-2 ring-primary" : ""}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {name}
        </div>
        {/* Team assignment buttons */}
        {canAssign && isSelected && (
          <div className="flex gap-1 mt-1 justify-center">
            <button
              onClick={() => assignPlayer(participant.id, 1)}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              {t("team1")}
            </button>
            <button
              onClick={() => assignPlayer(participant.id, 2)}
              className="px-3 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              {t("team2")}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderTeamPlayer(participant: GatherParticipant | undefined, index: number, team: 1 | 2) {
    if (!participant) {
      return (
        <div key={`empty-${team}-${index}`} className={`rounded-lg p-3 text-center text-sm slot-empty`}>
          Slot {index + 1}
        </div>
      );
    }

    const name = getPlayerName(participant);

    return (
      <div
        key={participant.id}
        className={`rounded-lg p-3 text-center text-sm transition-all duration-200 text-foreground animate-slot-pop ${
          team === 1
            ? "border-s-4 border-s-blue-500 bg-blue-500/10 border border-blue-500/20"
            : "border-s-4 border-s-red-500 bg-red-500/10 border border-red-500/20"
        }`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-center justify-between">
          <span>{name}</span>
          {canAssign && (
            <button
              onClick={() => assignPlayer(participant.id, null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ms-2"
              title={t("unassigned")}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

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
        {!showTeams ? (
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
          <>
            {/* Unassigned pool — shown above teams */}
            {(unassigned.length > 0 || canAssign) && (
              <div className="mb-6 pb-4 border-b">
                <h3 className="font-medium text-center mb-3 text-muted-foreground text-sm">{t("unassigned")}</h3>
                {unassigned.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {unassigned.map((p, i) => renderUnassignedPlayer(p, i))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground/40 py-2">—</p>
                )}
              </div>
            )}

            {/* Teams */}
            <div className="grid grid-cols-2 gap-6">
              {/* Team 1 */}
              <div>
                <h3 className="font-semibold text-center mb-3 text-blue-400">{t("team1")}</h3>
                <div className="space-y-2">
                  {Array.from({ length: halfSize }).map((_, i) => (
                    <div key={i}>
                      {renderTeamPlayer(team1[i], i, 1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 */}
              <div>
                <h3 className="font-semibold text-center mb-3 text-red-400">{t("team2")}</h3>
                <div className="space-y-2">
                  {Array.from({ length: halfSize }).map((_, i) => (
                    <div key={i}>
                      {renderTeamPlayer(team2[i], i, 2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Player figures — shows occupancy */}
        <div className={isFull && prevCount < gather.max_players ? "animate-locked-flash" : ""}>
          <PlayerFigures
            total={gather.max_players}
            filled={participants.length}
            prevFilled={prevCount}
            variant={isLive ? "destructive" : isFull ? "accent" : "primary"}
            className="mt-6"
          />
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

        {/* Chat — visible to participants */}
        {isInGather && userId && ["open", "ready", "live"].includes(gather.status) && (
          <GatherChat gatherId={gather.id} userId={userId} />
        )}
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
  const msgIndex = Math.floor(Date.now() / 60000) % TACTICAL_MESSAGES.length;
  return (
    <p className="text-muted-foreground italic">
      {TACTICAL_MESSAGES[msgIndex]}
    </p>
  );
}
