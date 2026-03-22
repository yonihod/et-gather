import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { handleGatherCommand } from "./commands/index.js";
import { startRealtimeListener } from "./events/realtime.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online as ${c.user.tag}`);
  startRealtimeListener(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "gather") return;

  try {
    await handleGatherCommand(interaction);
  } catch (err) {
    console.error("Command error:", err);
    const msg = "Something went wrong. Try again.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.login(config.discordToken);
