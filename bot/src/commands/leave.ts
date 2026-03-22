import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { buildGatherEmbed } from "../lib/embeds.js";

export async function leave(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);
  const inGather = gather.participants.some((p) => p.user_id === profile.id);
  if (!inGather) {
    return interaction.reply({ content: "You're not in this gather.", ephemeral: true });
  }

  await supabase
    .from("gather_participants")
    .delete()
    .eq("gather_id", gather.id)
    .eq("user_id", profile.id);

  // If was ready and now under max, go back to open
  const newCount = gather.participants.length - 1;
  if (gather.status === "ready" && newCount < gather.max_players) {
    await supabase
      .from("gathers")
      .update({ status: "open", ready_at: null })
      .eq("id", gather.id);
  }

  const updated = await getActiveGather();
  return interaction.reply({
    content: `**${profile.display_name}** left the gather.`,
    embeds: updated ? [buildGatherEmbed(updated)] : [],
  });
}
