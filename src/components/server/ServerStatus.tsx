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

        // Track which values changed for flash animation
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
      <div className="border rounded-md p-4">
        <div className="h-4 skeleton-scan rounded w-1/2 mb-3" />
        <div className="h-3 skeleton-scan rounded w-1/3" />
      </div>
    );
  }

  if (!data || !data.online) {
    return (
      <div className="border rounded-md p-4">
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

  return (
    <div className="border rounded-md p-4 border-s-2 border-s-primary/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 signal-dot" />
          <span className="text-sm font-semibold text-primary">{t("title")}</span>
        </div>
        <span className="text-xs tabular-nums font-medium text-accent">
          {data.players.length}/{data.maxPlayers}
        </span>
      </div>

      {/* Server name */}
      <div className="text-xs text-muted-foreground mb-1">{data.hostname}</div>

      {/* Map */}
      <div className="text-xs text-muted-foreground mb-3">
        {t("map")}: <span className="text-accent font-medium">{data.map}</span>
      </div>

      {/* Player list — staggered entrance + value flash on change */}
      {sorted.length > 0 ? (
        <div className="space-y-0.5" key={refreshKey}>
          {sorted.map((player, i) => {
            const prevData = prev.get(player.name);
            const scoreChanged = prevData && prevData.score !== player.score;

            return (
              <div
                key={player.name}
                className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0 animate-row-enter"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">🇮🇱</span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className={scoreChanged ? "animate-value-flash" : "text-muted-foreground"}>
                    {player.score} xp
                  </span>
                  <span className="text-muted-foreground">{player.ping}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      )}

      {/* Server IP */}
      <div className="mt-3 pt-2 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
          /connect 84.229.240.21
        </p>
      </div>
    </div>
  );
}
