-- Restore multi-workspace Draft reads without changing write authorization.
-- The previous SELECT policy compared a tenant ID to a scalar tenant_users
-- subquery, which fails when auth.uid() has more than one membership.
drop policy if exists "Users can view drafts for their tenant games" on public.game_drafts;

create policy "Users can view drafts for their tenant games"
on public.game_drafts
for select
to authenticated
using (
  exists (
    select 1
    from public.scrim_games game
    join public.scrims scrim on scrim.id = game.scrim_id
    where game.id = game_drafts.scrim_game_id
      and public.user_belongs_to_tenant(scrim.tenant_id)
  )
);

-- Deliberately unchanged: INSERT and UPDATE policies retain their existing
-- behavior and are outside WO-2026-029's read-path repair scope.
