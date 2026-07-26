-- Remove Data API execution from compatibility RPCs with no active web caller.
revoke execute on function public.create_roster_invitation(uuid, uuid, text, public.tenant_role) from public, anon, authenticated;
revoke execute on function public.create_team_invitation(uuid, text, public.tenant_role) from public, anon, authenticated;
revoke execute on function public.get_current_user_email() from public, anon, authenticated;
revoke execute on function public.get_user_tenant_id() from public, anon, authenticated;
revoke execute on function public.set_scrim_block_state(uuid, text) from public, anon, authenticated;
