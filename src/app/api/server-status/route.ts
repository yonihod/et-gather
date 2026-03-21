import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("server_status")
    .select("*")
    .eq("id", 1)
    .single();

  if (!data) {
    return NextResponse.json(
      { online: false, hostname: "", map: "", players: [], maxPlayers: 0 },
      { headers: { "Cache-Control": "public, s-maxage=30" } }
    );
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
}
