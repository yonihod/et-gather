"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function fetch() {
      try {
        const res = await window.fetch("/api/server-status");
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      }
      setLoading(false);
    }
    fetch();

    // Refresh every 30 seconds
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="border rounded-md p-4 animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/2 mb-3" />
        <div className="h-3 bg-secondary rounded w-1/3" />
      </div>
    );
  }

  if (!data || !data.online) {
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-sm font-medium">{t("title")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("offline")}</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">84.229.240.21</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 border-s-2 border-s-primary/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">{t("title")}</span>
        </div>
        <span className="text-xs tabular-nums font-medium text-accent">
          {data.players.length}/{data.maxPlayers}
        </span>
      </div>

      {/* Map */}
      <div className="text-xs text-muted-foreground mb-3">
        {t("map")}: <span className="text-accent font-medium">{data.map}</span>
      </div>

      {/* Player list */}
      {data.players.length > 0 ? (
        <div className="space-y-0.5">
          {data.players
            .sort((a, b) => b.score - a.score)
            .map((player, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">🇮🇱</span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                  <span>{player.score} xp</span>
                  <span>{player.ping}ms</span>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      )}

      {/* Server IP */}
      <div className="mt-3 pt-2 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground font-mono">
          /connect 84.229.240.21
        </p>
      </div>
    </div>
  );
}
