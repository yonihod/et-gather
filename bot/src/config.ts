import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

const channelMap: Record<string, string> = {};
const defaultChannel = process.env.GATHER_CHANNEL_DEFAULT ?? "";

for (const mode of ["3v3", "4v4", "5v5", "6v6"]) {
  const key = `GATHER_CHANNEL_${mode.toUpperCase().replace("V", "V")}`;
  const val = process.env[key];
  if (val) channelMap[mode] = val;
}

/** Get the channel ID for a given gather mode, falling back to the default */
export function getChannelForMode(mode: string): string {
  return channelMap[mode] ?? defaultChannel;
}

export const config = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  guildId: required("DISCORD_GUILD_ID"),
  defaultChannelId: defaultChannel,
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
} as const;
