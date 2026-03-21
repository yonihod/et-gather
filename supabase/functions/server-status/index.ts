import "@supabase/functions-js/edge-runtime.d.ts";

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

async function queryServer(host: string, port: number): Promise<ServerStatus> {
  const offline: ServerStatus = { online: false, hostname: "", map: "", players: [], maxPlayers: 0 };

  try {
    // Try Deno UDP
    const conn = Deno.listenDatagram({ port: 0, transport: "udp" });
    const packet = new Uint8Array([
      0xff, 0xff, 0xff, 0xff,
      ...new TextEncoder().encode("getstatus\n"),
    ]);

    await conn.send(packet, { hostname: host, port, transport: "udp" });

    const buf = new Uint8Array(8192);
    const timer = setTimeout(() => conn.close(), 4000);

    try {
      const [data] = await conn.receive(buf);
      clearTimeout(timer);
      conn.close();

      const response = new TextDecoder("latin1").decode(data);
      if (response.includes("statusResponse")) {
        return parseResponse(response);
      }
    } catch {
      clearTimeout(timer);
      try { conn.close(); } catch { /* already closed */ }
    }

    return offline;
  } catch (e) {
    console.error("UDP query failed:", e);
    return offline;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
  "Content-Type": "application/json",
  "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const status = await queryServer("84.229.240.21", 27960);
  return new Response(JSON.stringify(status), { headers: corsHeaders });
});
