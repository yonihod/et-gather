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
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
  const draggedRef = useRef<string | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});
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

  // ── Drag & Drop ──────────────────────────────────────────────────
  const movePlayer = useCallback(async (participantId: string, targetTeam: number | null) => {
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

    await supabase
      .from("gather_participants")
      .update({ team: targetTeam })
      .eq("id", participantId);
    // Real-time subscription will confirm/correct
  }, [gather, supabase]);

  function handleDragStart(e: React.DragEvent, participant: GatherParticipant) {
    draggedRef.current = participant.id;
    e.dataTransfer.setData("text/plain", participant.id);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    draggedRef.current = null;
    setDragOverZone(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "";
    }
  }

  function handleDrop(e: React.DragEvent, targetTeam: number | null) {
    e.preventDefault();
    setDragOverZone(null);
    const participantId = e.dataTransfer.getData("text/plain");
    if (participantId) movePlayer(participantId, targetTeam);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(zone: string) {
    dragCounterRef.current[zone] = (dragCounterRef.current[zone] || 0) + 1;
    setDragOverZone(zone);
  }

  function handleDragLeave(zone: string) {
    dragCounterRef.current[zone] = (dragCounterRef.current[zone] || 1) - 1;
    if (dragCounterRef.current[zone] <= 0) {
      dragCounterRef.current[zone] = 0;
      setDragOverZone((prev) => prev === zone ? null : prev);
    }
  }

  function handleDropZone(e: React.DragEvent, targetTeam: number | null, zone: string) {
    e.preventDefault();
    dragCounterRef.current[zone] = 0;
    setDragOverZone(null);
    const participantId = e.dataTransfer.getData("text/plain");
    if (participantId) movePlayer(participantId, targetTeam);
  }

  const isCreator = gather?.created_by === userId;
  const canDrag = isCreator && gather && ["open", "ready", "live"].includes(gather.status);

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

  function renderPlayerSlot(participant: GatherParticipant | undefined, index: number, teamColor?: string) {
    if (!participant) {
      return (
        <div className={`rounded-lg p-3 text-center text-sm slot-empty ${teamColor || ""}`}>
          Slot {index + 1}
        </div>
      );
    }

    const name = participant.profile?.display_name || participant.profile?.et_nickname || "Player";

    return (
      <div
        draggable={canDrag}
        onDragStart={canDrag ? (e) => handleDragStart(e, participant) : undefined}
        onDragEnd={canDrag ? handleDragEnd : undefined}
        className={`rounded-lg p-3 text-center text-sm transition-all duration-200 ${
          teamColor || "slot-filled text-foreground"
        } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} animate-slot-pop`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {name}
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
        {/* Drag hint for creator */}
        {canDrag && (
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider text-center mb-3">
            {t("dragHint")}
          </p>
        )}

        {/* Player slots */}
        {!showTeams ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: gather.max_players }).map((_, i) => {
              const participant = unassigned[i] || participants[i];
              const isNew = participant && i >= prevCount;
              return (
                <div
                  key={i}
                  draggable={canDrag && !!participant}
                  onDragStart={canDrag && participant ? (e) => handleDragStart(e, participant) : undefined}
                  onDragEnd={canDrag ? handleDragEnd : undefined}
                  className={`rounded-lg p-3 text-center text-sm transition-all duration-300 ${
                    participant
                      ? `slot-filled text-foreground ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`
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
            <div className="grid grid-cols-2 gap-6">
              {/* Team 1 — drop zone */}
              <div
                onDragOver={canDrag ? handleDragOver : undefined}
                onDragEnter={canDrag ? () => setDragOverZone("team1") : undefined}
                onDragLeave={canDrag ? () => setDragOverZone(null) : undefined}
                onDrop={canDrag ? (e) => handleDrop(e, 1) : undefined}
                className={`transition-all duration-200 rounded-lg p-2 -m-2 ${
                  dragOverZone === "team1" ? "ring-2 ring-blue-400/50 bg-blue-500/5" : ""
                }`}
              >
                <h3 className="font-semibold text-center mb-3 text-blue-400">{t("team1")}</h3>
                <div className="space-y-2">
                  {Array.from({ length: halfSize }).map((_, i) => (
                    <div key={i}>
                      {renderPlayerSlot(
                        team1[i],
                        i,
                        team1[i] ? "bg-blue-500/10 border border-blue-500/20 text-foreground" : undefined
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 — drop zone */}
              <div
                onDragOver={canDrag ? handleDragOver : undefined}
                onDragEnter={canDrag ? () => setDragOverZone("team2") : undefined}
                onDragLeave={canDrag ? () => setDragOverZone(null) : undefined}
                onDrop={canDrag ? (e) => handleDrop(e, 2) : undefined}
                className={`transition-all duration-200 rounded-lg p-2 -m-2 ${
                  dragOverZone === "team2" ? "ring-2 ring-red-400/50 bg-red-500/5" : ""
                }`}
              >
                <h3 className="font-semibold text-center mb-3 text-red-400">{t("team2")}</h3>
                <div className="space-y-2">
                  {Array.from({ length: halfSize }).map((_, i) => (
                    <div key={i}>
                      {renderPlayerSlot(
                        team2[i],
                        i,
                        team2[i] ? "bg-red-500/10 border border-red-500/20 text-foreground" : undefined
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Unassigned — drop zone (only show if there are unassigned or user is dragging) */}
            {(unassigned.length > 0 || canDrag) && (
              <div
                onDragOver={canDrag ? handleDragOver : undefined}
                onDragEnter={canDrag ? () => setDragOverZone("unassigned") : undefined}
                onDragLeave={canDrag ? () => setDragOverZone(null) : undefined}
                onDrop={canDrag ? (e) => handleDrop(e, null) : undefined}
                className={`mt-4 pt-4 border-t transition-all duration-200 rounded-lg p-2 -mx-2 ${
                  dragOverZone === "unassigned" ? "ring-2 ring-primary/50 bg-primary/5" : ""
                }`}
              >
                <h3 className="font-medium text-center mb-2 text-muted-foreground text-sm">{t("unassigned")}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {unassigned.map((p, i) => (
                    <div key={p.id}>
                      {renderPlayerSlot(p, i)}
                    </div>
                  ))}
                  {unassigned.length === 0 && canDrag && (
                    <div className="col-span-2 text-center text-xs text-muted-foreground/30 py-2 slot-empty rounded-lg">
                      Drop here to unassign
                    </div>
                  )}
                </div>
              </div>
            )}
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
