import { supabase } from "../supabase.js";
import type { GatherStatus } from "./transitions.js";

export interface GatherRow {
  id: string;
  status: GatherStatus;
  mode: string;
  max_players: number;
  created_by: string;
  created_at: string;
  ready_at: string | null;
  live_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  participants: ParticipantRow[];
}

export interface ParticipantRow {
  id: string;
  gather_id: string;
  user_id: string;
  team: number | null;
  joined_at: string;
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    et_nickname: string | null;
    discord_id: string | null;
  } | null;
}

export async function getActiveGather(): Promise<GatherRow | null> {
  const { data } = await supabase
    .from("gathers")
    .select("*, participants:gather_participants(*, profile:profiles(id, display_name, avatar_url, et_nickname, discord_id))")
    .in("status", ["open", "ready", "live"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as GatherRow) ?? null;
}

export async function getGatherById(id: string): Promise<GatherRow | null> {
  const { data } = await supabase
    .from("gathers")
    .select("*, participants:gather_participants(*, profile:profiles(id, display_name, avatar_url, et_nickname, discord_id))")
    .eq("id", id)
    .single();

  return (data as GatherRow) ?? null;
}
