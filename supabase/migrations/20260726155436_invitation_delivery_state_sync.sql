create or replace function public.sync_invitation_delivery_state()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.accepted_at is not null and old.accepted_at is null then
    new.delivery_status := 'accepted';
  elsif new.revoked_at is not null and old.revoked_at is null then
    new.delivery_status := 'revoked';
    new.expires_at := least(new.expires_at, now());
  end if;
  return new;
end;
$$;
revoke all on function public.sync_invitation_delivery_state() from public, anon, authenticated;
drop trigger if exists sync_invitation_delivery_state on public.team_invitations;
create trigger sync_invitation_delivery_state before update on public.team_invitations
for each row execute function public.sync_invitation_delivery_state();
