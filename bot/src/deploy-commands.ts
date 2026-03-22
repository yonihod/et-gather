import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "./config.js";

const command = new SlashCommandBuilder()
  .setName("gather")
  .setDescription("ET Gather system")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Create a new gather")
      .addIntegerOption((opt) =>
        opt
          .setName("players")
          .setDescription("Total number of players (e.g. 6, 8, 10, 12)")
          .setRequired(true)
          .addChoices(
            { name: "6 (3v3)", value: 6 },
            { name: "8 (4v4)", value: 8 },
            { name: "10 (5v5)", value: 10 },
            { name: "12 (6v6)", value: 12 },
          ),
      ),
  )
  .addSubcommand((sub) => sub.setName("join").setDescription("Join the active gather"))
  .addSubcommand((sub) => sub.setName("leave").setDescription("Leave the active gather"))
  .addSubcommand((sub) => sub.setName("status").setDescription("Show current gather status"))
  .addSubcommand((sub) => sub.setName("cancel").setDescription("Cancel the gather (creator only)"))
  .addSubcommand((sub) => sub.setName("start").setDescription("Start the gather (go live)"))
  .addSubcommand((sub) => sub.setName("teams").setDescription("Auto-balance teams"));

const rest = new REST().setToken(config.discordToken);

async function main() {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.guildId), {
    body: [command.toJSON()],
  });
  console.log("Done — /gather command registered.");
}

main().catch(console.error);
