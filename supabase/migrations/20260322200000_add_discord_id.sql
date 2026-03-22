-- Add discord_id to profiles for Discord bot user linking
ALTER TABLE public.profiles ADD COLUMN discord_id TEXT UNIQUE;
CREATE INDEX idx_profiles_discord_id ON public.profiles(discord_id);
