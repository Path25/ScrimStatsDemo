alter table public.coach_feedback enable row level security;

drop policy if exists "Users can view feedback for their tenant games" on public.coach_feedback;
drop policy if exists "Users can insert feedback for their tenant games" on public.coach_feedback;
drop policy if exists "Users can update their own feedback" on public.coach_feedback;
drop policy if exists "Users can delete their own feedback" on public.coach_feedback;

create policy "Tenant members can view coach feedback"
on public.coach_feedback for select to authenticated
using (exists (
  select 1 from public.scrim_games game
  join public.scrims block on block.id = game.scrim_id
  where game.id = coach_feedback.scrim_game_id
    and public.user_belongs_to_tenant(block.tenant_id)
));

create policy "Staff can create coach feedback"
on public.coach_feedback for insert to authenticated
with check (
  coach_id = (select auth.uid())
  and exists (
    select 1 from public.scrim_games game
    join public.scrims block on block.id = game.scrim_id
    where game.id = coach_feedback.scrim_game_id
      and public.user_has_tenant_role(
        block.tenant_id,
        array['owner','admin']::public.tenant_role[]
      )
  )
);

create policy "Staff can update coach feedback"
on public.coach_feedback for update to authenticated
using (exists (
  select 1 from public.scrim_games game
  join public.scrims block on block.id = game.scrim_id
  where game.id = coach_feedback.scrim_game_id
    and public.user_has_tenant_role(
      block.tenant_id,
      array['owner','admin']::public.tenant_role[]
    )
))
with check (exists (
  select 1 from public.scrim_games game
  join public.scrims block on block.id = game.scrim_id
  where game.id = coach_feedback.scrim_game_id
    and public.user_has_tenant_role(
      block.tenant_id,
      array['owner','admin']::public.tenant_role[]
    )
));

create policy "Staff can delete coach feedback"
on public.coach_feedback for delete to authenticated
using (exists (
  select 1 from public.scrim_games game
  join public.scrims block on block.id = game.scrim_id
  where game.id = coach_feedback.scrim_game_id
    and public.user_has_tenant_role(
      block.tenant_id,
      array['owner','admin']::public.tenant_role[]
    )
));

grant select, insert, update, delete on public.coach_feedback to authenticated;
grant all on public.coach_feedback to service_role;
