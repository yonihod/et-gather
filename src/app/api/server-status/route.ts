import { NextResponse } from "next/server";
import dgram from "dgram";

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
  gametype: string;
}

function queryServer(host: string, port: number): Promise<ServerStatus> {
  return new Promise((resolve) => {
    const client = dgram.createSocket("udp4");
    const timeout = setTimeout(() => {
      client.close();
      resolve({
        online: false,
        hostname: "",
        map: "",
        players: [],
        maxPlayers: 0,
        gametype: "",
      });
    }, 3000);

    // Quake 3 getstatus packet
    const packet = Buffer.from("\xFF\xFF\xFF\xFFgetstatus\n");

    client.send(packet, port, host, (err) => {
      if (err) {
        clearTimeout(timeout);
        client.close();
        resolve({
          online: false,
          hostname: "",
          map: "",
          players: [],
          maxPlayers: 0,
          gametype: "",
        });
      }
    });

    client.on("message", (msg) => {
      clearTimeout(timeout);
      client.close();

      try {
        const response = msg.toString("latin1");
        const lines = response.split("\n");

        // Parse server vars (line 1 is header, line 2 is vars)
        const vars: Record<string, string> = {};
        if (lines[1]) {
          const parts = lines[1].split("\\").filter(Boolean);
          for (let i = 0; i < parts.length - 1; i += 2) {
            vars[parts[i]] = parts[i + 1];
          }
        }

        // Parse players (remaining lines)
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

        resolve({
          online: true,
          hostname: cleanName(vars["sv_hostname"] || "ET Server"),
          map: vars["mapname"] || "unknown",
          players: players.filter((p) => p.ping > 0), // Filter out bots with 0 ping
          maxPlayers: parseInt(vars["sv_maxclients"] || "20"),
          gametype: vars["g_gametype"] || "",
        });
      } catch {
        resolve({
          online: false,
          hostname: "",
          map: "",
          players: [],
          maxPlayers: 0,
          gametype: "",
        });
      }
    });
  });
}

// Strip Quake 3 color codes (^0-^9, ^a-^z)
function cleanName(name: string): string {
  return name.replace(/\^[0-9a-zA-Z]/g, "").trim();
}

export async function GET() {
  const status = await queryServer("84.229.240.21", 27960);

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    },
  });
}
