-- Follow-up hardening from the Supabase Security and Performance Advisors.

create policy "Staff can create capture settings"
on public.tenant_capture_settings for insert to authenticated
with check (public.user_has_tenant_role(
  tenant_id,
  array['owner'::public.tenant_role, 'admin'::public.tenant_role]
));

create policy "Staff can update capture settings"
on public.tenant_capture_settings for update to authenticated
using (public.user_has_tenant_role(
  tenant_id,
  array['owner'::public.tenant_role, 'admin'::public.tenant_role]
))
with check (public.user_has_tenant_role(
  tenant_id,
  array['owner'::public.tenant_role, 'admin'::public.tenant_role]
));

create policy "Staff can resolve game reconciliations"
on public.scrim_game_reconciliations for update to authenticated
using (public.user_has_tenant_role(
  tenant_id,
  array['owner'::public.tenant_role, 'admin'::public.tenant_role]
))
with check (public.user_has_tenant_role(
  tenant_id,
  array['owner'::public.tenant_role, 'admin'::public.tenant_role]
));

grant insert, update on public.tenant_capture_settings to authenticated;
grant update on public.scrim_game_reconciliations to authenticated;

alter function public.set_workspace_capture_profile(uuid, text) security invoker;
alter function public.resolve_game_reconciliation(uuid, text, uuid, text) security invoker;

create index tenant_capture_settings_selected_by_idx
  on public.tenant_capture_settings(selected_by)
  where selected_by is not null;
create index scrim_game_reconciliations_first_game_idx
  on public.scrim_game_reconciliations(first_game_id);
create index scrim_game_reconciliations_second_game_idx
  on public.scrim_game_reconciliations(second_game_id);
create index scrim_game_reconciliations_accepted_game_idx
  on public.scrim_game_reconciliations(accepted_game_id)
  where accepted_game_id is not null;
create index scrim_game_reconciliations_resolved_by_idx
  on public.scrim_game_reconciliations(resolved_by)
  where resolved_by is not null;
