import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { buildGatherEmbed } from "../lib/embeds.js";
import { registerCommandReply } from "../events/realtime.js";
import { getChannelForMode } from "../config.js";
import type { GatherMode } from "../lib/transitions.js";

const PLAYERS_TO_MODE: Record<number, GatherMode> = {
  6: "3v3",
  8: "4v4",
  10: "5v5",
  12: "6v6",
};

export async function create(interaction: ChatInputCommandInteraction) {
  const existing = await getActiveGather();
  if (existing) {
    return interaction.reply({ content: "There's already an active gather. Join it or wait for it to finish.", ephemeral: true });
  }

  const players = interaction.options.getInteger("players", true);
  const mode = PLAYERS_TO_MODE[players];
  if (!mode) {
    return interaction.reply({ content: "Invalid player count. Use 6, 8, 10, or 12.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);

  const { data: gather, error } = await supabase
    .from("gathers")
    .insert({ mode, created_by: profile.id })
    .select("*")
    .single();

  if (error || !gather) {
    return interaction.reply({ content: `Failed to create gather: ${error?.message}`, ephemeral: true });
  }

  // Auto-join the creator
  await supabase.from("gather_participants").insert({
    gather_id: gather.id,
    user_id: profile.id,
  });

  // Fetch full gather with participants for the embed
  const full = await getActiveGather();
  if (!full) return interaction.reply({ content: "Gather created but could not fetch details.", ephemeral: true });

  const reply = await interaction.reply({ embeds: [buildGatherEmbed(full)], fetchReply: true });

  // Register this reply so the realtime listener edits it instead of posting a new message
  registerCommandReply(getChannelForMode(mode), reply.id, gather.id);
}
