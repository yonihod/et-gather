import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 10;

interface PlayerInfo {
  score: number;
  ping: number;
  name: string;
}

interface ServerStatus {
  online: boolean;
  hostname: string;
  map: string;
  players: PlayerInfo[];
  maxPlayers: number;
}

function cleanName(name: string): string {
  return name.replace(/\^[0-9a-zA-Z]/g, "").trim();
}

function parseResponse(raw: string): ServerStatus {
  const lines = raw.split("\n");

  const vars: Record<string, string> = {};
  if (lines[1]) {
    const parts = lines[1].split("\\").filter(Boolean);
    for (let i = 0; i < parts.length - 1; i += 2) {
      vars[parts[i]] = parts[i + 1];
    }
  }

  const players: PlayerInfo[] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const match = line.match(/^(-?\d+)\s+(\d+)\s+"(.+)"$/);
    if (match) {
      players.push({
        score: parseInt(match[1]),
        ping: parseInt(match[2]),
        name: cleanName(match[3]),
      });
    }
  }

  return {
    online: true,
    hostname: cleanName(vars["sv_hostname"] || "ET Server"),
    map: vars["mapname"] || "unknown",
    players: players.filter((p) => p.ping > 0),
    maxPlayers: parseInt(vars["sv_maxclients"] || "20"),
  };
}

export async function GET() {
  try {
    // Use netcat to query the server via UDP
    // printf sends the Quake 3 getstatus packet, nc reads the response
    const raw = execSync(
      `printf '\\xff\\xff\\xff\\xffgetstatus\\n' | nc -u -w 3 84.229.240.21 27960`,
      { timeout: 5000, encoding: "latin1" }
    );

    if (raw && raw.includes("statusResponse")) {
      const status = parseResponse(raw);
      return NextResponse.json(status, {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      });
    }
  } catch {
    // nc not available or query failed
  }

  return NextResponse.json(
    { online: false, hostname: "", map: "", players: [], maxPlayers: 0 },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
