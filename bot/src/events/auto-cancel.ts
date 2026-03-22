import { Client, TextChannel } from "discord.js";
import { supabase } from "../supabase.js";
import { getChannelForMode } from "../config.js";

const STALE_MINUTES = 30;
const CHECK_INTERVAL_MS = 60_000; // check every minute

export function startAutoCancelTimer(client: Client) {
  setInterval(() => checkStaleGathers(client), CHECK_INTERVAL_MS);
  console.log(`Auto-cancel: will cancel gathers idle for ${STALE_MINUTES}+ minutes`);
}

async function checkStaleGathers(client: Client) {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();

  // Find open/ready gathers created more than 30 minutes ago
  const { data: stale } = await supabase
    .from("gathers")
    .select("id, mode, created_at")
    .in("status", ["open", "ready"])
    .lt("created_at", cutoff);

  if (!stale?.length) return;

  for (const gather of stale) {
    await supabase
      .from("gathers")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", gather.id);

    // Post cancellation notice to the channel
    const channelId = getChannelForMode(gather.mode);
    if (!channelId) continue;

    try {
      const channel = await client.channels.fetch(channelId) as TextChannel;
      await channel.send({
        content: `⏰ Gather **${gather.mode}** auto-cancelled — inactive for ${STALE_MINUTES} minutes.`,
      });
    } catch {
      // channel not accessible
    }

    console.log(`Auto-cancelled gather ${gather.id} (${gather.mode}, created ${gather.created_at})`);
  }
}
