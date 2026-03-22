import { EmbedBuilder } from "discord.js";
import type { GatherRow, ParticipantRow } from "./gather-queries.js";

const STATUS_COLORS: Record<string, number> = {
  open: 0x22c55e,    // green
  ready: 0xeab308,   // yellow
  live: 0xef4444,    // red
  completed: 0x6b7280, // gray
  cancelled: 0x6b7280,
};

const STATUS_EMOJI: Record<string, string> = {
  open: "🟢",
  ready: "🟡",
  live: "🔴",
  completed: "⚫",
  cancelled: "⚫",
};

function playerName(p: ParticipantRow): string {
  return p.profile?.display_name ?? "Unknown";
}

function playerList(players: ParticipantRow[]): string {
  if (players.length === 0) return "*empty*";
  return players.map((p, i) => `\`${i + 1}.\` ${playerName(p)}`).join("\n");
}

export function buildGatherEmbed(gather: GatherRow): EmbedBuilder {
  const participants = gather.participants ?? [];
  const team1 = participants.filter((p) => p.team === 1);
  const team2 = participants.filter((p) => p.team === 2);
  const unassigned = participants.filter((p) => p.team == null);
  const hasTeams = team1.length > 0 || team2.length > 0;

  const embed = new EmbedBuilder()
    .setTitle(`${STATUS_EMOJI[gather.status]} ET Gather — ${gather.mode}`)
    .setColor(STATUS_COLORS[gather.status] ?? 0x6b7280)
    .addFields({
      name: "Status",
      value: gather.status.toUpperCase(),
      inline: true,
    }, {
      name: "Players",
      value: `${participants.length}/${gather.max_players}`,
      inline: true,
    })
    .setFooter({ text: `ID: ${gather.id.slice(0, 8)}` })
    .setTimestamp(new Date(gather.created_at));

  if (hasTeams) {
    embed.addFields(
      { name: "🔵 Allies", value: playerList(team1), inline: true },
      { name: "🔴 Axis", value: playerList(team2), inline: true },
    );
    if (unassigned.length > 0) {
      embed.addFields({ name: "Unassigned", value: playerList(unassigned) });
    }
  } else {
    embed.addFields({ name: "Players", value: playerList(participants) });
  }

  return embed;
}

export function buildTeamsEmbed(
  gather: GatherRow,
  team1: { userId: string; attendancePoints: number }[],
  team2: { userId: string; attendancePoints: number }[],
): EmbedBuilder {
  const participants = gather.participants ?? [];
  const nameMap = new Map(participants.map((p) => [p.user_id, playerName(p)]));

  const sum1 = team1.reduce((s, p) => s + p.attendancePoints, 0);
  const sum2 = team2.reduce((s, p) => s + p.attendancePoints, 0);

  const formatTeam = (team: { userId: string; attendancePoints: number }[]) =>
    team.map((p, i) => `\`${i + 1}.\` ${nameMap.get(p.userId) ?? "?"} *(${p.attendancePoints})*`).join("\n") || "*empty*";

  return new EmbedBuilder()
    .setTitle(`⚖️ Teams Balanced — ${gather.mode}`)
    .setColor(0x3b82f6)
    .addFields(
      { name: `🔵 Allies (${sum1} pts)`, value: formatTeam(team1), inline: true },
      { name: `🔴 Axis (${sum2} pts)`, value: formatTeam(team2), inline: true },
    )
    .setFooter({ text: `Difference: ${Math.abs(sum1 - sum2)} pts` });
}
