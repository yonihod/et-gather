const dgram = require("dgram");
const https = require("https");
const url = require("url");

const SERVER_HOST = "84.229.240.21";
const SERVER_PORT = 27960;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERVAL_MS = 60_000; // 1 minute

function cleanName(name) {
  return name.replace(/\^[0-9a-zA-Z]/g, "").trim();
}

function queryServer() {
  return new Promise((resolve) => {
    const client = dgram.createSocket("udp4");

    // Bind first, then send
    client.bind(0, "0.0.0.0", () => {
      const timeout = setTimeout(() => {
        try { client.close(); } catch {}
        resolve(null);
      }, 5000);

      const packet = Buffer.from("\xFF\xFF\xFF\xFFgetstatus\n");

      client.send(packet, 0, packet.length, SERVER_PORT, SERVER_HOST, (err) => {
        if (err) {
          console.error("Send error:", err.message);
          clearTimeout(timeout);
          try { client.close(); } catch {}
          resolve(null);
        }
      });

      client.on("message", (msg) => {
        clearTimeout(timeout);
        try { client.close(); } catch {}

      const response = msg.toString("latin1");
      if (!response.includes("statusResponse")) {
        resolve(null);
        return;
      }

      const lines = response.split("\n");
      const vars = {};
      if (lines[1]) {
        const parts = lines[1].split("\\").filter(Boolean);
        for (let i = 0; i < parts.length - 1; i += 2) {
          vars[parts[i]] = parts[i + 1];
        }
      }

      const players = [];
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^(-?\d+)\s+(\d+)\s+"(.+)"$/);
        if (match && parseInt(match[2]) > 0) {
          players.push({
            name: cleanName(match[3]),
            score: parseInt(match[1]),
            ping: parseInt(match[2]),
          });
        }
      }

      resolve({
        online: true,
        hostname: cleanName(vars["sv_hostname"] || "ET Server"),
        map: vars["mapname"] || "unknown",
        players,
        max_players: parseInt(vars["sv_maxclients"] || "20"),
      });
    });

      client.on("error", (err) => {
        console.error("Socket error:", err.message);
        clearTimeout(timeout);
        try { client.close(); } catch {}
        resolve(null);
      });
    });
  });
}

function updateSupabase(data) {
  const body = JSON.stringify({
    ...data,
    updated_at: new Date().toISOString(),
  });

  const parsed = url.parse(`${SUPABASE_URL}/rest/v1/server_status?id=eq.1`);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.path,
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(res.statusCode));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function poll() {
  try {
    const result = await queryServer();
    const data = result || {
      online: false,
      hostname: "",
      map: "",
      players: [],
      max_players: 0,
    };

    const status = await updateSupabase(data);
    const playerCount = data.players?.length || 0;
    console.log(
      `[${new Date().toISOString()}] ${data.online ? "ONLINE" : "OFFLINE"} - ${data.map || "n/a"} - ${playerCount} players - HTTP ${status}`
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
  }
}

// Run immediately, then every minute
console.log("ET Server Status Poller started");
console.log(`Target: ${SERVER_HOST}:${SERVER_PORT}`);
console.log(`Supabase: ${SUPABASE_URL}`);
console.log(`Interval: ${INTERVAL_MS / 1000}s`);

poll();
setInterval(poll, INTERVAL_MS);
