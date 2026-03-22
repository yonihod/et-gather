import { Client, TextChannel } from "discord.js";
import { supabase } from "../supabase.js";
import { getChannelForMode } from "../config.js";
import { getGatherById } from "../lib/gather-queries.js";
import { buildGatherEmbed } from "../lib/embeds.js";

/** Track the last status message per channel so we can edit instead of spamming */
const lastMessages = new Map<string, { messageId: string; gatherId: string }>();

/** Debounce: skip rapid-fire updates within this window */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingGatherId: string | null = null;
let pendingClient: Client | null = null;

async function getChannel(client: Client, channelId: string): Promise<TextChannel | null> {
  if (!channelId) return null;
  try {
    const ch = await client.channels.fetch(channelId);
    return ch as TextChannel;
  } catch {
    return null;
  }
}

async function doPostUpdate(client: Client, gatherId: string) {
  const gather = await getGatherById(gatherId);
  if (!gather) return;

  const channelId = getChannelForMode(gather.mode);
  const channel = await getChannel(client, channelId);
  if (!channel) return;

  const embed = buildGatherEmbed(gather);
  const last = lastMessages.get(channelId);

  // Same gather — edit the existing message
  if (last && last.gatherId === gather.id) {
    try {
      const msg = await channel.messages.fetch(last.messageId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      // Message was deleted — fall through to post new
    }
  }

  // New gather or missing message — post new
  const msg = await channel.send({ embeds: [embed] });
  lastMessages.set(channelId, { messageId: msg.id, gatherId: gather.id });
}

function scheduleUpdate(client: Client, gatherId: string) {
  pendingGatherId = gatherId;
  pendingClient = client;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (pendingClient && pendingGatherId) {
      doPostUpdate(pendingClient, pendingGatherId).catch(console.error);
    }
  }, 1500);
}

/**
 * Register a command reply so the realtime listener knows to edit it
 * instead of posting a new message.
 */
export function registerCommandReply(channelId: string, messageId: string, gatherId: string) {
  lastMessages.set(channelId, { messageId, gatherId });
}

export function startRealtimeListener(client: Client) {
  supabase
    .channel("bot-gather-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "gathers" }, (payload) => {
      const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
      if (id) scheduleUpdate(client, id);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "gather_participants" }, (payload) => {
      const gatherId = (payload.new as { gather_id?: string })?.gather_id ?? (payload.old as { gather_id?: string })?.gather_id;
      if (gatherId) scheduleUpdate(client, gatherId);
    })
    .subscribe((status) => {
      console.log(`Realtime subscription: ${status}`);
    });
}
