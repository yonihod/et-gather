import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const offline = { online: false, hostname: "", map: "", players: [], maxPlayers: 0 };

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("server_status")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      console.error("server-status query error:", error?.message);
      return NextResponse.json(offline);
    }

    return NextResponse.json(
      {
        online: data.online,
        hostname: data.hostname,
        map: data.map,
        players: data.players,
        maxPlayers: data.max_players,
      },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch (err) {
    console.error("server-status error:", err);
    return NextResponse.json(offline);
  }
}
