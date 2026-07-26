-- Expose the provider's factual tournament/split label to the Draft workspace.
create or replace function public.get_draft_workspace(p_tenant_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select case when not public.user_belongs_to_tenant(p_tenant_id) then null else jsonb_build_object(
    'contract_version','draft-workspace-v2',
    'playbooks',coalesce((select jsonb_agg(to_jsonb(p) order by p.updated_at desc) from public.draft_playbooks p where p.tenant_id=p_tenant_id),'[]'::jsonb),
    'plans',coalesce((select jsonb_agg(to_jsonb(b) order by b.updated_at desc) from public.preparation_briefs b where b.tenant_id=p_tenant_id),'[]'::jsonb),
    'scenarios',coalesce((select jsonb_agg(to_jsonb(s) order by s.updated_at desc) from public.draft_scenarios s where s.tenant_id=p_tenant_id),'[]'::jsonb),
    'actions',coalesce((select jsonb_agg(to_jsonb(a) order by a.sequence_number) from public.draft_scenario_actions a where a.tenant_id=p_tenant_id),'[]'::jsonb),
    'restrictions',coalesce((select jsonb_agg(to_jsonb(r) order by r.champion_name) from public.draft_plan_restrictions r where r.tenant_id=p_tenant_id),'[]'::jsonb),
    'opponents',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) order by o.name) from public.opponent_teams o where o.tenant_id=p_tenant_id),'[]'::jsonb),
    'fixtures',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'opponent_name',s.opponent_name,'opponent_team_id',s.opponent_team_id,'starts_at',s.starts_at,'format',s.format) order by s.starts_at) from public.scrims s where s.tenant_id=p_tenant_id and s.starts_at>=now() and coalesce(s.status,'scheduled') not in ('cancelled','completed') limit 20),'[]'::jsonb),
    'external_drafts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',d.id,'opponent_team_id',d.opponent_team_id,'blue_team',d.blue_team,'red_team',d.red_team,
      'blue_picks',d.blue_picks,'red_picks',d.red_picks,'blue_bans',d.blue_bans,'red_bans',d.red_bans,
      'patch',d.patch,'played_at',d.played_at,'tournament',d.provider_tournament,'source_url',d.source_url
    ) order by d.played_at desc nulls last) from (
      select * from public.opponent_external_draft_games x
      where x.tenant_id=p_tenant_id order by x.played_at desc nulls last limit 100
    ) d),'[]'::jsonb),
    'team_drafts',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'scrim_game_id',d.scrim_game_id,'draft_data',d.draft_data,'completed_at',d.completed_at,'opponent_name',s.opponent_name,'played_at',coalesce(g.game_start_time,s.starts_at)) order by coalesce(g.game_start_time,s.starts_at) desc nulls last) from public.game_drafts d join public.scrim_games g on g.id=d.scrim_game_id join public.scrims s on s.id=g.scrim_id where s.tenant_id=p_tenant_id limit 100),'[]'::jsonb),
    'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.summoner_name,'role',p.role,'linked_user_id',p.linked_user_id,'main_champions',p.main_champions) order by p.role,p.summoner_name) from public.players p where p.tenant_id=p_tenant_id and coalesce(p.is_active,true) and p.archived_at is null),'[]'::jsonb),
    'champion_pools',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'player_id',c.player_id,'champion_name',c.champion_name,'role',c.role,'comfort_level',c.comfort_level,'priority',c.priority,'games_played',c.games_played,'win_rate',c.win_rate)) from public.champion_pools c join public.players p on p.id=c.player_id where p.tenant_id=p_tenant_id),'[]'::jsonb),
    'scouting_evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'opponent_team_id',e.opponent_team_id,'title',e.title,'observation',e.observation,'evidence_type',e.evidence_type,'confidence',e.confidence,'observed_at',e.observed_at) order by e.observed_at desc) from (select * from public.scouting_evidence x where x.tenant_id=p_tenant_id and x.lifecycle_state='active' order by x.observed_at desc limit 100) e),'[]'::jsonb),
    'linked_player_id',(select p.id from public.players p where p.tenant_id=p_tenant_id and p.linked_user_id=(select auth.uid()) limit 1)
  ) end;
$$;

revoke all on function public.get_draft_workspace(uuid) from public, anon, authenticated;
grant execute on function public.get_draft_workspace(uuid) to authenticated;
notify pgrst, 'reload schema';
