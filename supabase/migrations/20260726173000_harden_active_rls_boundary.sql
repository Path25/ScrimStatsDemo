-- Remove overlapping legacy policies that could bypass the managed-pilot role boundary.
drop policy if exists "Enable insert for authenticated users" on public.tenants;
drop policy if exists "Enable select for tenant members" on public.tenants;
drop policy if exists "Enable update for tenant owners" on public.tenants;
drop policy if exists "Enable delete for tenant owners" on public.tenants;
create policy tenants_member_read on public.tenants for select to authenticated using (public.user_belongs_to_tenant(id));
create policy tenants_staff_update on public.tenants for update to authenticated using (public.user_has_tenant_role(id, array['owner','admin']::public.tenant_role[])) with check (public.user_has_tenant_role(id, array['owner','admin']::public.tenant_role[]));
create policy tenants_owner_delete on public.tenants for delete to authenticated using (public.user_has_tenant_role(id, array['owner']::public.tenant_role[]));

drop policy if exists "Users can create tenant memberships" on public.tenant_users;
drop policy if exists "Users can insert themselves into tenants" on public.tenant_users;
drop policy if exists "Users can update their own tenant memberships" on public.tenant_users;
drop policy if exists "Users can delete their own tenant memberships" on public.tenant_users;
drop policy if exists "Users can view their own tenant memberships" on public.tenant_users;
drop policy if exists "Users can view their tenant memberships" on public.tenant_users;

drop policy if exists "Users can manage players in their tenants" on public.players;
drop policy if exists "Users can view players in their tenant" on public.players;
drop policy if exists "Users can view players in their tenants" on public.players;
drop policy if exists "Tenant admins can create players" on public.players;
drop policy if exists "Tenant admins can update players" on public.players;
drop policy if exists "Tenant admins can delete players" on public.players;
create policy players_member_read on public.players for select to authenticated using (public.user_belongs_to_tenant(tenant_id));
create policy players_staff_insert on public.players for insert to authenticated with check (public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));
create policy players_staff_update on public.players for update to authenticated using (public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])) with check (public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));
create policy players_staff_delete on public.players for delete to authenticated using (public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

drop policy if exists "Tenant members can create events" on public.calendar_events;
drop policy if exists "Tenant members can update events" on public.calendar_events;
drop policy if exists "Tenant admins can delete events" on public.calendar_events;
drop policy if exists "Users can view events in their tenant" on public.calendar_events;
create policy calendar_events_member_read on public.calendar_events for select to authenticated using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists "Admins can create invitations" on public.team_invitations;
drop policy if exists "Admins can update invitations" on public.team_invitations;
drop policy if exists "Admins can delete invitations" on public.team_invitations;
drop policy if exists "Tenant admins can create invitations" on public.team_invitations;
drop policy if exists "Tenant admins can delete tenant invitations" on public.team_invitations;
drop policy if exists "Users can update invitations sent to their email" on public.team_invitations;
drop policy if exists "Users can view invitations by valid token only" on public.team_invitations;
drop policy if exists "Users can view invitations sent to their email" on public.team_invitations;
drop policy if exists "Users can view invitations they created" on public.team_invitations;
drop policy if exists "Users can view tenant invitations they manage" on public.team_invitations;

drop policy if exists "Users can insert their own notification preferences" on public.user_notification_preferences;
drop policy if exists "Users can update their own notification preferences" on public.user_notification_preferences;
drop policy if exists "Users can view their own notification preferences" on public.user_notification_preferences;
create policy user_notification_preferences_read on public.user_notification_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy user_notification_preferences_insert on public.user_notification_preferences for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_notification_preferences_update on public.user_notification_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Coaching mutations are transactional RPC workflows, not direct table writes.
drop policy if exists coaching_actions_assignee_progress on public.coaching_actions;
drop policy if exists coaching_actions_staff_insert on public.coaching_actions;
drop policy if exists coaching_actions_staff_update on public.coaching_actions;
