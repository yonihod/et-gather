import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { balanceTeams } from "../lib/balance.js";
import { buildTeamsEmbed } from "../lib/embeds.js";

export async function teams(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);
  const isCreator = gather.created_by === profile.id;
  const isPrivileged = profile.role === "organizer" || profile.role === "admin";

  if (!isCreator && !isPrivileged) {
    return interaction.reply({ content: "Only the gather creator or an admin can balance teams.", ephemeral: true });
  }

  if (gather.participants.length < 2) {
    return interaction.reply({ content: "Need at least 2 players to balance teams.", ephemeral: true });
  }

  // Fetch attendance stats for participants
  const userIds = gather.participants.map((p) => p.user_id);
  const { data: stats } = await supabase
    .from("attendance_stats")
    .select("user_id, attendance_points")
    .in("user_id", userIds);

  const pointsMap = new Map((stats ?? []).map((s: { user_id: string; attendance_points: number }) => [s.user_id, s.attendance_points]));

  const players = gather.participants.map((p) => ({
    userId: p.user_id,
    attendancePoints: pointsMap.get(p.user_id) ?? 0,
  }));

  const { team1, team2 } = balanceTeams(players);

  // Update team assignments in DB
  const updates = [
    ...team1.map((p) => supabase.from("gather_participants").update({ team: 1 }).eq("gather_id", gather.id).eq("user_id", p.userId)),
    ...team2.map((p) => supabase.from("gather_participants").update({ team: 2 }).eq("gather_id", gather.id).eq("user_id", p.userId)),
  ];
  await Promise.all(updates);

  // Auto-transition to ready if full and currently open
  if (gather.status === "open" && gather.participants.length >= gather.max_players) {
    await supabase
      .from("gathers")
      .update({ status: "ready", ready_at: new Date().toISOString() })
      .eq("id", gather.id);
  }

  return interaction.reply({ embeds: [buildTeamsEmbed(gather, team1, team2)] });
}
