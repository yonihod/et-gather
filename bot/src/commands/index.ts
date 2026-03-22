import { ChatInputCommandInteraction } from "discord.js";
import { create } from "./create.js";
import { join } from "./join.js";
import { leave } from "./leave.js";
import { status } from "./status.js";
import { cancel } from "./cancel.js";
import { start } from "./start.js";
import { teams } from "./teams.js";

export async function handleGatherCommand(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "create": return create(interaction);
    case "join": return join(interaction);
    case "leave": return leave(interaction);
    case "status": return status(interaction);
    case "cancel": return cancel(interaction);
    case "start": return start(interaction);
    case "teams": return teams(interaction);
    default:
      return interaction.reply({ content: `Unknown subcommand: ${sub}`, ephemeral: true });
  }
}
