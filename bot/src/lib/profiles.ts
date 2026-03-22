import { User } from "discord.js";
import { supabase } from "../supabase.js";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  et_nickname: string | null;
  role: string;
  discord_id: string | null;
}

/**
 * Find an existing profile by discord_id, or create a new Supabase auth user
 * (which triggers the handle_new_user DB trigger to auto-create the profile row),
 * then tag it with the discord_id.
 */
export async function getOrCreateProfile(discordUser: User): Promise<Profile> {
  // 1. Check for existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("discord_id", discordUser.id)
    .single();

  if (existing) return existing as Profile;

  // 2. Create a Supabase auth user — the DB trigger creates the profile row
  const email = `discord_${discordUser.id}@bot.etgather.local`;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: discordUser.displayName ?? discordUser.username,
      avatar_url: discordUser.displayAvatarURL({ size: 128 }),
    },
  });

  if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);
  const userId = authData.user.id;

  // 3. Tag the auto-created profile with the discord_id
  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({
      discord_id: discordUser.id,
      avatar_url: discordUser.displayAvatarURL({ size: 128 }),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);
  return profile as Profile;
}
