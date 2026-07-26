-- Discord is a roadmap preview for the managed pilot. Keep historical records,
-- but remove browser execution until the delivery and support journey is promoted.
revoke execute on function public.configure_discord_channel(uuid, text, text, text[]) from public, anon, authenticated;
revoke execute on function public.disconnect_discord_installation(uuid) from public, anon, authenticated;
