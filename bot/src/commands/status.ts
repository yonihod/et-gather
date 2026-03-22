import { ChatInputCommandInteraction } from "discord.js";
import { getActiveGather } from "../lib/gather-queries.js";
import { buildGatherEmbed } from "../lib/embeds.js";

export async function status(interaction: ChatInputCommandInteraction) {
  const gather = await getActiveGather();
  if (!gather) {
    return interaction.reply({ content: "No active gather. Create one with `/gather create`.", ephemeral: true });
  }

  return interaction.reply({ embeds: [buildGatherEmbed(gather)] });
}
