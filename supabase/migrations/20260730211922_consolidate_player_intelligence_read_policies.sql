-- Consolidate the WO-024 read contract after the hosted Advisor identified
-- duplicate permissive SELECT policies. The retained policies use the same
-- tenant-membership predicates and all mutation policies remain unchanged.

drop policy if exists "Users can view opponent teams in their tenant" on public.opponent_teams;
drop policy if exists "Users can view opponent players from their tenant teams" on public.opponent_players;
drop policy if exists "staff read scouting evidence" on public.scouting_evidence;
drop policy if exists "staff read scouting tendencies" on public.scouting_tendencies;
drop policy if exists "staff read tendency evidence" on public.scouting_tendency_evidence;
drop policy if exists "members read published brief evidence" on public.preparation_brief_evidence;
