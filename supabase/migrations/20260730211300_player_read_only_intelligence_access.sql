-- Give every authenticated tenant member the same read set as staff across
-- Scouting and Draft. Mutation policies remain owner/admin-only.
-- Analytics continues to use its dedicated server-side entitlement assertion.

create policy scouting_opponent_teams_member_read
on public.opponent_teams for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy scouting_opponent_players_member_read
on public.opponent_players for select to authenticated
using (exists (
  select 1 from public.opponent_teams team
  where team.id = opponent_players.opponent_team_id
    and public.user_belongs_to_tenant(team.tenant_id)
));

create policy scouting_evidence_member_read
on public.scouting_evidence for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy scouting_tendencies_member_read
on public.scouting_tendencies for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy scouting_tendency_evidence_member_read
on public.scouting_tendency_evidence for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

create policy draft_brief_evidence_member_read
on public.preparation_brief_evidence for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists draft_playbooks_select on public.draft_playbooks;
create policy draft_playbooks_select on public.draft_playbooks
for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists draft_restrictions_select on public.draft_plan_restrictions;
create policy draft_restrictions_select on public.draft_plan_restrictions
for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists draft_scenarios_select on public.draft_scenarios;
create policy draft_scenarios_select on public.draft_scenarios
for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists draft_actions_select on public.draft_scenario_actions;
create policy draft_actions_select on public.draft_scenario_actions
for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

drop policy if exists "members read published or staff read draft briefs" on public.preparation_briefs;
create policy draft_preparation_briefs_member_read on public.preparation_briefs
for select to authenticated
using (public.user_belongs_to_tenant(tenant_id));

comment on policy scouting_evidence_member_read on public.scouting_evidence is
  'Tenant-scoped read-only intelligence access for every authenticated workspace member.';
