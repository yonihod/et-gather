import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { buildGatherEmbed } from "../lib/embeds.js";
import { VALID_TRANSITIONS } from "../lib/transitions.js";

export async function start(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);
  const isCreator = gather.created_by === profile.id;
  const isPrivileged = profile.role === "organizer" || profile.role === "admin";

  if (!isCreator && !isPrivileged) {
    return interaction.reply({ content: "Only the gather creator or an admin can start.", ephemeral: true });
  }

  if (!VALID_TRANSITIONS[gather.status].includes("live")) {
    return interaction.reply({ content: `Cannot start a gather that is **${gather.status}**. It needs to be **ready** first.`, ephemeral: true });
  }

  // Check teams are assigned
  const unassigned = gather.participants.filter((p) => p.team == null);
  if (unassigned.length > 0) {
    return interaction.reply({
      content: `${unassigned.length} player(s) still unassigned. Run \`/gather teams\` first.`,
      ephemeral: true,
    });
  }

  await supabase
    .from("gathers")
    .update({ status: "live", live_at: new Date().toISOString() })
    .eq("id", gather.id);

  const updated = await getActiveGather();
  return interaction.reply({
    content: "🔴 **GATHER IS LIVE — GL HF!**",
    embeds: updated ? [buildGatherEmbed(updated)] : [],
  });
}
