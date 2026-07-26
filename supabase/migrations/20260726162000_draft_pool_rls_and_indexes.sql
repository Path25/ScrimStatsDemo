-- Harden the canonical champion-pool boundary and cover Draft workspace foreign keys.

drop policy if exists "Users can view champion pools for their tenant players" on public.champion_pools;
drop policy if exists "Users can insert champion pools for their tenant players" on public.champion_pools;
drop policy if exists "Users can update champion pools for their tenant players" on public.champion_pools;
drop policy if exists "Users can delete champion pools for their tenant players" on public.champion_pools;

create policy "Tenant members can view champion pools"
on public.champion_pools for select to authenticated
using (exists (
  select 1 from public.players p
  where p.id = champion_pools.player_id
    and public.user_belongs_to_tenant(p.tenant_id)
));

create policy "Tenant staff can insert champion pools"
on public.champion_pools for insert to authenticated
with check (exists (
  select 1 from public.players p
  where p.id = champion_pools.player_id
    and public.user_has_tenant_role(p.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create policy "Tenant staff can update champion pools"
on public.champion_pools for update to authenticated
using (exists (
  select 1 from public.players p
  where p.id = champion_pools.player_id
    and public.user_has_tenant_role(p.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
))
with check (exists (
  select 1 from public.players p
  where p.id = champion_pools.player_id
    and public.user_has_tenant_role(p.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create policy "Tenant staff can delete champion pools"
on public.champion_pools for delete to authenticated
using (exists (
  select 1 from public.players p
  where p.id = champion_pools.player_id
    and public.user_has_tenant_role(p.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
));

create index if not exists preparation_briefs_opponent_tenant_idx on public.preparation_briefs(opponent_team_id, tenant_id);
create index if not exists preparation_briefs_parent_tenant_idx on public.preparation_briefs(parent_brief_id, tenant_id) where parent_brief_id is not null;
create index if not exists preparation_briefs_published_by_idx on public.preparation_briefs(published_by) where published_by is not null;
create index if not exists preparation_briefs_scrim_tenant_idx on public.preparation_briefs(scrim_id, tenant_id) where scrim_id is not null;
create index if not exists preparation_briefs_source_playbook_tenant_idx on public.preparation_briefs(source_playbook_id, tenant_id) where source_playbook_id is not null;

create index if not exists preparation_brief_evidence_brief_tenant_idx on public.preparation_brief_evidence(brief_id, tenant_id);
create index if not exists preparation_brief_evidence_evidence_tenant_idx on public.preparation_brief_evidence(evidence_id, tenant_id);
create index if not exists preparation_brief_evidence_tenant_idx on public.preparation_brief_evidence(tenant_id);

create index if not exists preparation_external_drafts_brief_tenant_idx on public.preparation_brief_external_drafts(brief_id, tenant_id);
create index if not exists preparation_external_drafts_game_tenant_idx on public.preparation_brief_external_drafts(external_draft_game_id, tenant_id);
create index if not exists preparation_external_drafts_tenant_idx on public.preparation_brief_external_drafts(tenant_id);

notify pgrst, 'reload schema';
