"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface PlayerInfo {
  score: number;
  ping: number;
  name: string;
}

interface ServerData {
  online: boolean;
  hostname: string;
  map: string;
  players: PlayerInfo[];
  maxPlayers: number;
}

export function ServerStatus() {
  const t = useTranslations("server");
  const [data, setData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevPlayersRef = useRef<Map<string, { score: number; ping: number }>>(new Map());

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await window.fetch("/api/server-status");
        const json = await res.json();

        if (data?.players) {
          const prev = new Map<string, { score: number; ping: number }>();
          for (const p of data.players) {
            prev.set(p.name, { score: p.score, ping: p.ping });
          }
          prevPlayersRef.current = prev;
        }

        setData(json);
        setRefreshKey((k) => k + 1);
      } catch {
        setData(null);
      }
      setLoading(false);
    }
    fetchStatus();

    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="border rounded-md p-4 hud-corners">
        <div className="h-4 skeleton-scan rounded w-1/2 mb-3" />
        <div className="h-3 skeleton-scan rounded w-1/3" />
      </div>
    );
  }

  if (!data || !data.online) {
    return (
      <div className="border rounded-md p-4 hud-corners">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium">{t("title")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("offline")}</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">84.229.240.21</p>
      </div>
    );
  }

  const sorted = [...data.players].sort((a, b) => b.score - a.score);
  const prev = prevPlayersRef.current;
  const playerCount = data.players.length;

  return (
    <div className="border rounded-md p-4 border-s-2 border-s-primary/50 hud-corners">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 signal-dot" />
          <span className="text-sm font-semibold text-primary">{t("title")}</span>
        </div>
        <span className={`text-xs tabular-nums font-bold ${playerCount > 0 ? "text-accent" : "text-muted-foreground"}`}>
          {playerCount}/{data.maxPlayers}
        </span>
      </div>

      {/* Map — with colored accent bar */}
      <div className="map-accent-bar text-xs mb-3">
        <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wider">{t("map")}</div>
        <div className="text-accent font-semibold text-sm">{data.map}</div>
      </div>

      {/* Player scoreboard */}
      {sorted.length > 0 ? (
        <div className="space-y-0" key={refreshKey}>
          {/* Mini scoreboard header */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider pb-1 mb-1 border-b border-border/30">
            <span>Player</span>
            <div className="flex gap-3">
              <span>Score</span>
              <span>Ping</span>
            </div>
          </div>
          {sorted.map((player, i) => {
            const prevData = prev.get(player.name);
            const scoreChanged = prevData && prevData.score !== player.score;

            return (
              <div
                key={player.name}
                className={`flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0 animate-row-enter ${
                  i % 2 === 1 ? "bg-secondary/20" : ""
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1 h-1 rounded-full ${playerCount > 0 ? "bg-green-500/60" : "bg-muted"}`} />
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className={scoreChanged ? "animate-value-flash font-semibold" : "text-muted-foreground"}>
                    {player.score}
                  </span>
                  <span className={`text-muted-foreground/60 ${
                    player.ping < 50 ? "" : player.ping < 100 ? "text-yellow-500/60" : "text-red-500/60"
                  }`}>
                    {player.ping}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">{t("empty")}</p>
      )}

      {/* Server IP */}
      <CopyConnect />
    </div>
  );
}

function CopyConnect() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText("/connect 84.229.240.21");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
      <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
        /connect 84.229.240.21
      </p>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        title="Copy to clipboard"
      >
        {copied ? (
          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
