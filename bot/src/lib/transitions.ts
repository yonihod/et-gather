export type GatherStatus = "open" | "ready" | "live" | "completed" | "cancelled";
export type GatherMode = "3v3" | "4v4" | "5v5" | "6v6";

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
