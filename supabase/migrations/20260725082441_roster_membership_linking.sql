-- Link an optional roster profile to the existing invitation and membership flow.
-- Existing staff-only invitations remain valid and retain a null player_id.

alter table public.team_invitations
  add column if not exists player_id uuid;

create unique index if not exists team_invitations_id_tenant_unique
  on public.team_invitations (id, tenant_id);

alter table public.team_invitations
  drop constraint if exists team_invitations_player_tenant_fkey;

alter table public.team_invitations
  add constraint team_invitations_player_tenant_fkey
  foreign key (player_id, tenant_id)
  references public.players(id, tenant_id)
  on delete set null (player_id);

create unique index if not exists team_invitations_pending_player_unique
  on public.team_invitations (player_id)
  where player_id is not null and accepted_at is null;

create index if not exists team_invitations_tenant_player_idx
  on public.team_invitations (tenant_id, player_id, created_at desc);

create or replace function public.create_roster_invitation(
  p_tenant_id uuid,
  p_player_id uuid,
  p_email text,
  p_role public.tenant_role default 'member'
)
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_invitation public.team_invitations;
  v_previous_player_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_role = 'owner' then
    raise exception 'Owner access cannot be granted through an invitation'
      using errcode = '42501';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Only a team owner or manager can invite members'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.players player
    where player.id = p_player_id
      and player.tenant_id = p_tenant_id
      and player.is_active is true
      and player.linked_user_id is null
  ) then
    raise exception 'Choose an active, unlinked roster profile from this workspace'
      using errcode = '23503';
  end if;

  select invitation.*
  into v_invitation
  from public.team_invitations invitation
  where invitation.tenant_id = p_tenant_id
    and lower(invitation.email) = v_email
    and invitation.accepted_at is null
  order by invitation.created_at desc
  limit 1
  for update;

  if found then
    v_previous_player_id := v_invitation.player_id;
    if v_previous_player_id is not null and v_previous_player_id <> p_player_id then
      update public.players
      set membership_state = 'roster_only', updated_at = now()
      where id = v_previous_player_id
        and tenant_id = p_tenant_id
        and linked_user_id is null;
    end if;

    update public.team_invitations
    set
      player_id = p_player_id,
      token = public.generate_invitation_token(),
      role = p_role,
      invited_by = auth.uid(),
      expires_at = now() + interval '7 days',
      updated_at = now()
    where id = v_invitation.id
    returning * into v_invitation;
  else
    insert into public.team_invitations (
      tenant_id,
      player_id,
      email,
      role,
      invited_by,
      token,
      expires_at
    )
    values (
      p_tenant_id,
      p_player_id,
      v_email,
      p_role,
      auth.uid(),
      public.generate_invitation_token(),
      now() + interval '7 days'
    )
    returning * into v_invitation;
  end if;

  update public.players
  set membership_state = 'invited', updated_at = now()
  where id = p_player_id and tenant_id = p_tenant_id;

  return query select v_invitation.token, v_invitation.expires_at;
end;
$$;

create or replace function public.accept_team_invitation(invitation_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.team_invitations;
  v_user_email text;
  v_existing_role public.tenant_role;
begin
  if auth.uid() is null then
    return json_build_object(
      'success', false,
      'error', 'User must be authenticated to accept invitation'
    );
  end if;

  select *
  into v_invitation
  from public.team_invitations invitation
  where invitation.token = invitation_token
    and invitation.expires_at > now()
    and invitation.accepted_at is null
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Invalid or expired invitation');
  end if;

  select lower(email)
  into v_user_email
  from auth.users
  where id = auth.uid();

  if v_user_email is distinct from lower(v_invitation.email) then
    return json_build_object(
      'success', false,
      'error', 'This invitation was sent to a different email address'
    );
  end if;

  select membership.role
  into v_existing_role
  from public.tenant_users membership
  where membership.tenant_id = v_invitation.tenant_id
    and membership.user_id = auth.uid();

  if not found then
    insert into public.tenant_users (tenant_id, user_id, role, invited_by, joined_at)
    values (
      v_invitation.tenant_id,
      auth.uid(),
      v_invitation.role,
      v_invitation.invited_by,
      now()
    );
    v_existing_role := v_invitation.role;
  end if;

  if v_invitation.player_id is not null then
    if exists (
      select 1
      from public.players player
      where player.id = v_invitation.player_id
        and player.tenant_id = v_invitation.tenant_id
        and player.linked_user_id is not null
        and player.linked_user_id <> auth.uid()
    ) then
      raise exception 'This roster profile is already linked to another account'
        using errcode = '23505';
    end if;

    update public.players
    set
      linked_user_id = auth.uid(),
      membership_state = 'linked',
      updated_at = now()
    where id = v_invitation.player_id
      and tenant_id = v_invitation.tenant_id;
  end if;

  update public.team_invitations
  set accepted_at = now(), updated_at = now()
  where id = v_invitation.id;

  return json_build_object(
    'success', true,
    'tenant_id', v_invitation.tenant_id,
    'role', v_existing_role,
    'player_id', v_invitation.player_id,
    'message', 'Successfully joined the team workspace'
  );
end;
$$;

create or replace function public.sync_roster_membership_on_access_removal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.players
  set
    linked_user_id = null,
    membership_state = 'revoked',
    updated_at = now()
  where tenant_id = old.tenant_id
    and linked_user_id = old.user_id;

  return old;
end;
$$;

drop trigger if exists sync_roster_membership_on_access_removal_trigger
  on public.tenant_users;
create trigger sync_roster_membership_on_access_removal_trigger
after delete on public.tenant_users
for each row execute function public.sync_roster_membership_on_access_removal();

create or replace function public.sync_roster_membership_on_invitation_removal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.player_id is not null and old.accepted_at is null then
    update public.players
    set membership_state = 'roster_only', updated_at = now()
    where id = old.player_id
      and tenant_id = old.tenant_id
      and linked_user_id is null
      and not exists (
        select 1
        from public.team_invitations invitation
        where invitation.player_id = old.player_id
          and invitation.accepted_at is null
      );
  end if;

  return old;
end;
$$;

drop trigger if exists sync_roster_membership_on_invitation_removal_trigger
  on public.team_invitations;
create trigger sync_roster_membership_on_invitation_removal_trigger
after delete on public.team_invitations
for each row execute function public.sync_roster_membership_on_invitation_removal();

revoke all on function public.create_roster_invitation(
  uuid, uuid, text, public.tenant_role
) from public, anon;
grant execute on function public.create_roster_invitation(
  uuid, uuid, text, public.tenant_role
) to authenticated;

revoke all on function public.accept_team_invitation(text) from public, anon;
grant execute on function public.accept_team_invitation(text) to authenticated;

revoke all on function public.sync_roster_membership_on_access_removal()
  from public, anon, authenticated;
revoke all on function public.sync_roster_membership_on_invitation_removal()
  from public, anon, authenticated;
