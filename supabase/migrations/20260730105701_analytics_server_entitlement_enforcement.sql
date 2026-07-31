-- Enforce the paid Team Analytics boundary below the browser route gate.
-- Keep this SECURITY INVOKER so table RLS and the caller's membership remain in force.

create or replace function public.assert_team_analytics_access(p_tenant_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not public.user_belongs_to_tenant(p_tenant_id)
    or not exists (
      select 1
      from public.tenants tenant
      join public.tenant_feature_access access
        on access.tenant_id = tenant.id
       and access.module_key = 'analytics'
       and access.is_enabled
      where tenant.id = p_tenant_id
        and tenant.subscription_tier in ('pro'::public.subscription_tier, 'elite'::public.subscription_tier)
    ) then
    raise exception 'Analytics access is unavailable for this workspace' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_team_analytics_access(uuid) from public, anon;
grant execute on function public.assert_team_analytics_access(uuid) to authenticated;

create or replace function public.get_team_analytics_dataset(
  p_tenant_id uuid,
  p_date_from date default (current_date - 29),
  p_date_to date default current_date
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with access_guard as materialized (
    select public.assert_team_analytics_access(p_tenant_id)
  ), scoped_games as (
    select
      game.id, game.scrim_id, game.game_number,
      coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz) as played_at,
      scrim.opponent_team_id,
      coalesce(nullif(trim(scrim.opponent_name), ''), 'Opponent not recorded') as opponent_name,
      scrim.format, game.result, lower(game.side) as side, game.duration_seconds,
      game.our_team_kills, game.enemy_team_kills, game.our_team_gold, game.enemy_team_gold,
      game.performance_rating, game.early_game_rating, game.mid_game_rating, game.late_game_rating,
      coalesce(evidence.provider, 'manual') as provider,
      array_remove(array_cat(coalesce(evidence.capabilities, '{}'::text[]), array[
        case when game.result in ('win', 'loss', 'draw') then 'result' end,
        case when exists (select 1 from public.game_drafts draft where draft.scrim_game_id = game.id) then 'draft' end,
        case when exists (select 1 from public.scrim_participants participant where participant.scrim_game_id = game.id and participant.is_our_team) then 'participant_stats' end,
        case when coalesce(game.objectives, '{}'::jsonb) <> '{}'::jsonb then 'objectives' end,
        case when game.performance_rating is not null and nullif(trim(game.performance_summary), '') is not null then 'coach_review' end
      ]::text[]), null) as capabilities,
      evidence.payload_version, evidence.captured_at,
      coalesce(nullif(game.external_game_data -> 'game_context' ->> 'patch', ''), nullif(game.external_game_data ->> 'patch', '')) as patch,
      nullif(game.external_game_data -> 'game_context' ->> 'mode', '') as game_mode,
      nullif(game.external_game_data -> 'game_context' ->> 'map_name', '') as map_name,
      case when game.external_game_data -> 'game_context' ->> 'map_number' ~ '^[0-9]+$'
        then (game.external_game_data -> 'game_context' ->> 'map_number')::integer end as map_number,
      game.game_classification,
      game.quality_flags,
      game.roster_coverage,
      game.game_classification = 'standard_5v5' as score_eligible
    from public.scrim_games game
    join public.scrims scrim on scrim.id = game.scrim_id
    left join public.scrim_game_evidence evidence on evidence.scrim_game_id = game.id
    cross join access_guard
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and game.status = 'completed'
      and not exists (
        select 1 from public.scrim_game_reconciliations reconciliation
        where reconciliation.tenant_id = scrim.tenant_id
          and game.id in (reconciliation.first_game_id, reconciliation.second_game_id)
          and (reconciliation.status = 'pending' or (reconciliation.status = 'resolved' and reconciliation.accepted_game_id <> game.id))
      )
      and coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz)::date between p_date_from and p_date_to
  ), scoped_participants as (
    select participant.scrim_game_id, participant.player_id, participant.summoner_name,
      participant.champion_name, lower(participant.role) as role, participant.is_our_team,
      participant.kills, participant.deaths, participant.assists, participant.cs, participant.gold,
      participant.damage_dealt, participant.damage_taken, participant.vision_score,
      participant.level, participant.is_bot, participant.items, participant.runes,
      participant.summoner_spells, participant.advanced_stats
    from public.scrim_participants participant
    join scoped_games game on game.id = participant.scrim_game_id
  ), scoped_events as (
    select event.scrim_game_id, event.event_id, event.sequence, event.occurred_seconds,
      event.event_type, event.team, event.actor_name, event.victim_name,
      event.objective_type, event.map_object
    from public.scrim_game_events event
    join scoped_games game on game.id = event.scrim_game_id
  ), scoped_drafts as (
    select draft.scrim_game_id, draft.our_team_side, draft.draft_data -> 'picks' as picks,
      draft.draft_data -> 'bans' as bans,
      coalesce((draft.draft_data ->> 'completed')::boolean, false) as completed
    from public.game_drafts draft join scoped_games game on game.id = draft.scrim_game_id
  )
  select jsonb_build_object(
    'contract_version', 'team-analytics-v3',
    'date_from', p_date_from, 'date_to', p_date_to,
    'capture_profile', coalesce((select setting.profile from public.tenant_capture_settings setting where setting.tenant_id = p_tenant_id), 'desktop_manual'),
    'games', coalesce((select jsonb_agg(to_jsonb(game) order by game.played_at desc, game.game_number desc) from scoped_games game), '[]'::jsonb),
    'participants', coalesce((select jsonb_agg(to_jsonb(participant)) from scoped_participants participant), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(event) order by event.scrim_game_id, event.sequence) from scoped_events event), '[]'::jsonb),
    'drafts', coalesce((select jsonb_agg(to_jsonb(draft)) from scoped_drafts draft), '[]'::jsonb),
    'filter_options', jsonb_build_object(
      'opponents', coalesce((select jsonb_agg(to_jsonb(option_row) order by option_row.name) from (
        select distinct coalesce(opponent_team_id::text, 'name:' || lower(opponent_name)) as key, opponent_name as name from scoped_games
      ) option_row), '[]'::jsonb),
      'formats', coalesce((select jsonb_agg(option_row.format order by option_row.format) from (select distinct format from scoped_games where nullif(trim(format), '') is not null) option_row), '[]'::jsonb),
      'patches', coalesce((select jsonb_agg(option_row.patch order by option_row.patch desc) from (select distinct patch from scoped_games where patch is not null) option_row), '[]'::jsonb),
      'game_modes', coalesce((select jsonb_agg(option_row.game_mode order by option_row.game_mode) from (select distinct game_mode from scoped_games where game_mode is not null) option_row), '[]'::jsonb),
      'maps', coalesce((select jsonb_agg(to_jsonb(option_row) order by option_row.map_name) from (select distinct map_number, map_name from scoped_games where map_name is not null) option_row), '[]'::jsonb),
      'classifications', coalesce((select jsonb_agg(option_row.game_classification order by option_row.game_classification) from (select distinct game_classification from scoped_games where game_classification is not null) option_row), '[]'::jsonb)
    )
  ) from access_guard;
$$;

revoke all on function public.get_team_analytics_dataset(uuid, date, date) from public, anon;
grant execute on function public.get_team_analytics_dataset(uuid, date, date) to authenticated;

comment on function public.get_team_analytics_dataset(uuid, date, date) is
  'Returns normalized Team Analytics evidence only to an entitled tenant member, without raw provider payloads.';
