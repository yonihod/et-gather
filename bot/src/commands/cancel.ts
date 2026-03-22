import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../supabase.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { VALID_TRANSITIONS } from "../lib/transitions.js";

export async function cancel(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather.", ephemeral: true });
  }

  const profile = await getOrCreateProfile(interaction.user);
  const isCreator = gather.created_by === profile.id;
  const isPrivileged = profile.role === "organizer" || profile.role === "admin";

  if (!isCreator && !isPrivileged) {
    return interaction.reply({ content: "Only the gather creator or an admin can cancel.", ephemeral: true });
  }

  if (!VALID_TRANSITIONS[gather.status].includes("cancelled")) {
    return interaction.reply({ content: `Cannot cancel a gather that is **${gather.status}**.`, ephemeral: true });
  }

  await supabase
    .from("gathers")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", gather.id);

  return interaction.reply({ content: `Gather **cancelled** by ${profile.display_name}.` });
}
