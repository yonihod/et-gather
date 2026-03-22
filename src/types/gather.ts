export type GatherStatus = "open" | "ready" | "live" | "completed" | "cancelled";
export type GatherMode = "3v3" | "4v4" | "5v5" | "6v6";

export interface Gather {
  id: string;
  status: GatherStatus;
  mode: GatherMode;
  max_players: number;
  created_by: string;
  created_at: string;
  ready_at: string | null;
  live_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
}

export interface GatherParticipant {
  id: string;
  gather_id: string;
  user_id: string;
  team: number | null;
  joined_at: string;
  profile?: Profile;
}

export interface GatherWithParticipants extends Gather {
  participants: GatherParticipant[];
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  et_nickname: string | null;
  role: "player" | "organizer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  et_nickname: string | null;
  total_gathers: number;
  gathers_last_30_days: number;
  attendance_points: number;
}

export interface GatherMessage {
  id: string;
  gather_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export const VALID_TRANSITIONS: Record<GatherStatus, GatherStatus[]> = {
  open: ["ready", "cancelled"],
  ready: ["open", "live", "cancelled"],
  live: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function getMaxPlayers(mode: GatherMode): number {
  const map: Record<GatherMode, number> = { "3v3": 6, "4v4": 8, "5v5": 10, "6v6": 12 };
  return map[mode];
}
