-- Production access hardening for the existing ScrimStats project.
-- This migration is additive and deliberately does not modify tenant, player,
-- or scrim rows. Apply to a test project/tenant first, then verify with the
-- Supabase Security Advisor before applying to the shared production project.

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  team_name text not null check (char_length(team_name) between 1 and 100),
  message text check (message is null or char_length(message) <= 1000),
  source text not null default 'public_site',
  status text not null default 'pending' check (status in ('pending', 'contacted', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_requests_normalized_email check (email = lower(trim(email))),
  constraint access_requests_email_unique unique (email)
);

alter table public.access_requests enable row level security;
revoke all on table public.access_requests from public, anon, authenticated;
grant select, insert, update on table public.access_requests to service_role;

drop trigger if exists update_access_requests_updated_at on public.access_requests;
create trigger update_access_requests_updated_at
before update on public.access_requests
for each row execute function public.update_updated_at();

-- Self-service tenant creation is intentionally disabled. Approved teams are
-- provisioned through an audited administrative workflow instead.
revoke execute on function public.create_tenant_with_owner(text, text, public.subscription_tier)
from public, anon, authenticated;

-- Invitations are accepted only by a signed-in user. The function verifies
-- that the authenticated email matches the invitation before adding membership.
revoke execute on function public.accept_team_invitation(text) from public, anon;
grant execute on function public.accept_team_invitation(text) to authenticated;

-- This trigger function is invoked by auth, never through the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- The following legacy administrative and credential functions are not part of
-- the production Operations Core. Background Edge Functions use service_role,
-- which retains execution; browser roles must not be able to call them.
revoke execute on function public.decrypt_sensitive_data(text) from public, anon, authenticated;
revoke execute on function public.encrypt_sensitive_data(text) from public, anon, authenticated;
revoke execute on function public.get_all_subscribers_for_admin() from public, anon, authenticated;
revoke execute on function public.get_all_tenant_users_for_admin() from public, anon, authenticated;
revoke execute on function public.get_all_users_for_admin() from public, anon, authenticated;
revoke execute on function public.get_external_draft_tool_decrypted(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_subscription_cancellation(text) from public, anon, authenticated;
revoke execute on function public.insert_external_draft_tool(uuid, text, text, text, text, text, boolean) from public, anon, authenticated;

-- These trigger functions run under their owning table privileges. Pinning the
-- lookup path fixes the advisor warning without changing their trigger use.
alter function public.update_updated_at() set search_path = public;
alter function public.update_notification_preferences_updated_at() set search_path = public;

-- An owner or manager can create a tenant-bound invitation. This is an RPC so
-- the browser never receives direct insert rights on team_invitations.
create or replace function public.create_team_invitation(
  p_tenant_id uuid,
  p_email text,
  p_role public.tenant_role default 'member'
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  invitation public.team_invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_role = 'owner' then
    raise exception 'Owner access cannot be granted through an invitation';
  end if;

  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' then
    raise exception 'A valid email address is required';
  end if;

  if not exists (
    select 1 from public.tenant_users membership
    where membership.tenant_id = p_tenant_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'Only a team owner or manager can invite members';
  end if;

  select * into invitation
  from public.team_invitations existing_invitation
  where existing_invitation.tenant_id = p_tenant_id
    and lower(existing_invitation.email) = normalized_email
    and existing_invitation.accepted_at is null
  order by existing_invitation.created_at desc
  limit 1
  for update;

  if found then
    update public.team_invitations
    set token = public.generate_invitation_token(),
        role = p_role,
        invited_by = auth.uid(),
        expires_at = now() + interval '7 days',
        updated_at = now()
    where id = invitation.id
    returning * into invitation;
  else
    insert into public.team_invitations (tenant_id, email, role, invited_by, token, expires_at)
    values (p_tenant_id, normalized_email, p_role, auth.uid(), public.generate_invitation_token(), now() + interval '7 days')
    returning * into invitation;
  end if;

  return query select invitation.token, invitation.expires_at;
end;
$$;

revoke execute on function public.create_team_invitation(uuid, text, public.tenant_role) from public, anon;
grant execute on function public.create_team_invitation(uuid, text, public.tenant_role) to authenticated;

comment on table public.access_requests is
  'Private public-site access requests. Only the server-side service role may read or write rows.';
