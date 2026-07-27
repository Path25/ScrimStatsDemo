-- Reopening begins a fresh practice cycle while immutable event history keeps the prior review.

create or replace function public.reset_reopened_coaching_action_cycle()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'assigned' and old.status in ('complete','dismissed') then
    new.player_check_in := null;
    new.player_check_in_note := null;
    new.player_checked_in_at := null;
    new.review_outcome := null;
    new.review_observation := null;
    new.review_evidence := null;
    new.review_next_action := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
  end if;
  return new;
end;
$$;

revoke all on function public.reset_reopened_coaching_action_cycle() from public, anon, authenticated;
drop trigger if exists coaching_action_cycle_reopen_reset on public.coaching_actions;
create trigger coaching_action_cycle_reopen_reset
before update of status on public.coaching_actions
for each row execute function public.reset_reopened_coaching_action_cycle();

notify pgrst, 'reload schema';
