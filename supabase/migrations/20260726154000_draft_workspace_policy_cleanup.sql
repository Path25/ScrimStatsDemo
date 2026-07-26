-- Remove superseded permissive policy names after the Draft workspace installs
-- its canonical tenant/staff/published policies.
drop policy if exists "members read published or staff read draft scenarios" on public.draft_scenarios;
drop policy if exists "staff create draft scenarios" on public.draft_scenarios;
drop policy if exists "staff update draft scenarios" on public.draft_scenarios;
drop policy if exists "staff delete draft scenarios" on public.draft_scenarios;

drop policy if exists "members read published scenario actions" on public.draft_scenario_actions;
drop policy if exists "staff create draft scenario actions" on public.draft_scenario_actions;
drop policy if exists "staff update draft scenario actions" on public.draft_scenario_actions;
drop policy if exists "staff delete draft scenario actions" on public.draft_scenario_actions;
