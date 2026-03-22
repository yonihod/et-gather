import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { buildGatherEmbed } from "../lib/embeds.js";

export async function join(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather. Create one with `/gather create`.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);
  const already = gather.participants.some((p) => p.user_id === profile.id);
  if (already) {
    return interaction.reply({ content: "You're already in this gather.", ephemeral: true });
  }

  if (gather.participants.length >= gather.max_players) {
    return interaction.reply({ content: "Gather is full.", ephemeral: true });
  }

  const { error } = await supabase.from("gather_participants").insert({
    gather_id: gather.id,
    user_id: profile.id,
  });

  if (error) {
    return interaction.reply({ content: `Failed to join: ${error.message}`, ephemeral: true });
  }

  // Auto-transition to ready if now full
  const newCount = gather.participants.length + 1;
  if (newCount >= gather.max_players && gather.status === "open") {
    await supabase
      .from("gathers")
      .update({ status: "ready", ready_at: new Date().toISOString() })
      .eq("id", gather.id);
  }

  const updated = await getActiveGather();
  return interaction.reply({
    content: `**${profile.display_name}** joined!`,
    embeds: updated ? [buildGatherEmbed(updated)] : [],
  });
}
