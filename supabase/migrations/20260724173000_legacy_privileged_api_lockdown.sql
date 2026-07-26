-- Apply only after auditing production callers.
-- This migration closes privileged legacy API paths that are outside the
-- invite-managed competitive platform.

do $$
declare
  function_record record;
begin
  for function_record in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = any(array[
        'create_tenant_with_owner',
        'decrypt_sensitive_data',
        'encrypt_sensitive_data',
        'get_all_subscribers_for_admin',
        'get_all_tenant_users_for_admin',
        'get_all_users_for_admin',
        'get_external_draft_tool_decrypted',
        'get_public_player_count',
        'get_public_scrim_count',
        'get_public_tenant_count',
        'handle_new_user',
        'handle_subscription_cancellation',
        'insert_external_draft_tool'
      ])
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      function_record.signature
    );
    execute format(
      'grant execute on function %s to service_role',
      function_record.signature
    );
  end loop;
end;
$$;

revoke all on function public.accept_team_invitation(text) from public, anon;
grant execute on function public.accept_team_invitation(text) to authenticated;

revoke all on function public.user_belongs_to_tenant(uuid) from public, anon;
grant execute on function public.user_belongs_to_tenant(uuid) to authenticated;
revoke all on function public.user_has_tenant_role(uuid, public.tenant_role) from public, anon;
grant execute on function public.user_has_tenant_role(uuid, public.tenant_role) to authenticated;
revoke all on function public.user_is_tenant_admin(uuid) from public, anon;
grant execute on function public.user_is_tenant_admin(uuid) to authenticated;

drop policy if exists "Allow public insert" on public.mailing_list_signups;
revoke insert on table public.mailing_list_signups from public, anon, authenticated;
drop policy if exists "insert_subscription" on public.subscribers;
revoke insert on table public.subscribers from public, anon, authenticated;
