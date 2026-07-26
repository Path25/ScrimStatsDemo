create or replace function public.get_competitive_draft_analytics(
  p_tenant_id uuid,
  p_date_from date default (current_date - 90),
  p_date_to date default current_date,
  p_opponent_id uuid default null,
  p_side text default null,
  p_format text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with selected_scrims as (
    select
      scrim.id,
      scrim.opponent_team_id,
      scrim.opponent_name,
      scrim.format,
      coalesce(scrim.starts_at, scrim.match_date) as played_at
    from public.scrims scrim
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and coalesce(scrim.starts_at, scrim.match_date)::date between p_date_from and p_date_to
      and (p_opponent_id is null or scrim.opponent_team_id = p_opponent_id)
      and (p_format is null or lower(coalesce(scrim.format, '')) = lower(p_format))
  ),
  completed_games as (
    select
      game.id,
      game.result,
      lower(game.side) as side,
      coalesce(game.game_start_time, scrim.played_at) as played_at,
      case
        when game.desktop_session_id is not null or game.external_game_id is not null
          then 'legacy_collector'
        else 'manual'
      end as source,
      game.desktop_session_id,
      game.external_game_id
    from public.scrim_games game
    join selected_scrims scrim on scrim.id = game.scrim_id
    where game.status = 'completed'
      and (p_side is null or lower(coalesce(game.side, '')) = lower(p_side))
  ),
  games as (
    select *
    from completed_games
    where result in ('win', 'loss')
  ),
  participants as (
    select
      participant.scrim_game_id,
      participant.player_id,
      nullif(btrim(participant.summoner_name), '') as summoner_name,
      nullif(btrim(participant.champion_name), '') as champion,
      case lower(btrim(participant.role))
        when 'bottom' then 'adc'
        when 'utility' then 'support'
        else lower(btrim(participant.role))
      end as role,
      participant.is_our_team,
      participant.kills,
      participant.deaths,
      participant.assists,
      participant.cs,
      participant.gold,
      participant.damage_dealt,
      participant.vision_score,
      game.result,
      game.played_at,
      game.source
    from public.scrim_participants participant
    join games game on game.id = participant.scrim_game_id
    where participant.tenant_id = p_tenant_id
  ),
  valid_participants as (
    select *
    from participants
    where champion is not null
      and role in ('top', 'jungle', 'mid', 'adc', 'support')
  ),
  champion_grouped as (
    select
      champion,
      role,
      count(distinct scrim_game_id) as games,
      count(distinct scrim_game_id) filter (where result = 'win') as wins,
      count(distinct scrim_game_id) filter (where result = 'loss') as losses,
      count(distinct scrim_game_id) filter (where source = 'legacy_collector') as collector_games,
      count(distinct scrim_game_id) filter (where source = 'manual') as manual_games,
      min(played_at) as date_from,
      max(played_at) as date_to
    from valid_participants
    where is_our_team = true
    group by champion, role
  ),
  matchup_grouped as (
    select
      ours.role,
      ours.champion,
      theirs.champion as opponent_champion,
      count(distinct ours.scrim_game_id) as games,
      count(distinct ours.scrim_game_id) filter (where ours.result = 'win') as wins,
      count(distinct ours.scrim_game_id) filter (where ours.result = 'loss') as losses,
      count(distinct ours.scrim_game_id) filter (where ours.source = 'legacy_collector') as collector_games,
      count(distinct ours.scrim_game_id) filter (where ours.source = 'manual') as manual_games,
      min(ours.played_at) as date_from,
      max(ours.played_at) as date_to
    from valid_participants ours
    join valid_participants theirs
      on theirs.scrim_game_id = ours.scrim_game_id
     and theirs.role = ours.role
     and theirs.is_our_team = false
    where ours.is_our_team = true
    group by ours.role, ours.champion, theirs.champion
  ),
  our_participants as (
    select
      participant.*,
      case participant.role
        when 'top' then 1
        when 'jungle' then 2
        when 'mid' then 3
        when 'adc' then 4
        when 'support' then 5
      end as role_order
    from valid_participants participant
    where participant.is_our_team = true
  ),
  duo_rows as (
    select
      first_pick.role as first_role,
      first_pick.champion as first_champion,
      second_pick.role as second_role,
      second_pick.champion as second_champion,
      first_pick.scrim_game_id,
      first_pick.result,
      first_pick.source,
      first_pick.played_at
    from our_participants first_pick
    join our_participants second_pick
      on second_pick.scrim_game_id = first_pick.scrim_game_id
     and second_pick.role_order > first_pick.role_order
  ),
  duo_metrics as (
    select
      first_role,
      first_champion,
      second_role,
      second_champion,
      count(distinct scrim_game_id) as games,
      count(distinct scrim_game_id) filter (where result = 'win') as wins,
      count(distinct scrim_game_id) filter (where result = 'loss') as losses,
      count(distinct scrim_game_id) filter (where source = 'legacy_collector') as collector_games,
      count(distinct scrim_game_id) filter (where source = 'manual') as manual_games,
      min(played_at) as date_from,
      max(played_at) as date_to
    from duo_rows
    group by first_role, first_champion, second_role, second_champion
  ),
  player_grouped as (
    select
      player_id,
      coalesce(max(summoner_name), 'Unlinked captured player') as player_name,
      count(distinct scrim_game_id) as games,
      count(distinct scrim_game_id) filter (where result = 'win') as wins,
      count(kills) as kills_samples,
      count(deaths) as deaths_samples,
      count(assists) as assists_samples,
      count(cs) as cs_samples,
      count(gold) as gold_samples,
      count(damage_dealt) as damage_samples,
      count(vision_score) as vision_samples,
      sum(kills) as total_kills,
      sum(deaths) as total_deaths,
      sum(assists) as total_assists,
      sum(cs) as total_cs,
      sum(gold) as total_gold,
      sum(damage_dealt) as total_damage,
      sum(vision_score) as total_vision,
      min(played_at) as date_from,
      max(played_at) as date_to
    from valid_participants
    where is_our_team = true
    group by player_id, coalesce(player_id::text, summoner_name)
  ),
  draft_bans as (
    select
      game.id as scrim_game_id,
      game.result,
      game.source,
      game.played_at,
      ban.value #>> '{}' as champion_key
    from games game
    join public.game_drafts draft on draft.scrim_game_id = game.id
    cross join lateral jsonb_array_elements(
      coalesce(
        draft.draft_data->'raw_champion_select'->'bans'->'myTeamBans',
        '[]'::jsonb
      )
    ) ban(value)
    where coalesce((draft.draft_data->>'is_completed')::boolean, draft.completed_at is not null, false)
      and ban.value #>> '{}' not in ('', '0', '-1')
  ),
  ban_grouped as (
    select
      champion_key,
      count(distinct scrim_game_id) as games,
      count(distinct scrim_game_id) filter (where result = 'win') as wins,
      count(distinct scrim_game_id) filter (where result = 'loss') as losses,
      count(distinct scrim_game_id) filter (where source = 'legacy_collector') as collector_games,
      count(distinct scrim_game_id) filter (where source = 'manual') as manual_games,
      min(played_at) as date_from,
      max(played_at) as date_to
    from draft_bans
    group by champion_key
  )
  select jsonb_build_object(
    'contract_version', 'draft-analytics-v1',
    'date_from', p_date_from,
    'date_to', p_date_to,
    'filters', jsonb_build_object(
      'opponent_id', p_opponent_id,
      'side', p_side,
      'format', p_format
    ),
    'coverage', jsonb_build_object(
      'completed_games', (select count(*) from completed_games),
      'qualifying_games', (select count(*) from games),
      'excluded_games', (select count(*) from completed_games where result not in ('win', 'loss') or result is null),
      'games_with_team_picks', (select count(distinct scrim_game_id) from valid_participants where is_our_team = true),
      'games_with_role_matchups', (select count(distinct ours.scrim_game_id) from valid_participants ours join valid_participants theirs on theirs.scrim_game_id = ours.scrim_game_id and theirs.role = ours.role and theirs.is_our_team = false where ours.is_our_team = true),
      'games_with_bans', (select count(distinct scrim_game_id) from draft_bans),
      'collector_games', (select count(*) from games where source = 'legacy_collector'),
      'manual_games', (select count(*) from games where source = 'manual')
    ),
    'champions', coalesce((select jsonb_agg(to_jsonb(metric) order by metric.games desc, metric.champion) from champion_grouped metric), '[]'::jsonb),
    'bans', coalesce((select jsonb_agg(to_jsonb(metric) order by metric.games desc, metric.champion_key) from ban_grouped metric), '[]'::jsonb),
    'matchups', coalesce((select jsonb_agg(to_jsonb(metric) order by metric.games desc, metric.role, metric.champion) from matchup_grouped metric), '[]'::jsonb),
    'duos', coalesce((select jsonb_agg(to_jsonb(metric) order by metric.games desc, metric.first_role, metric.second_role) from duo_metrics metric), '[]'::jsonb),
    'players', coalesce((select jsonb_agg(to_jsonb(metric) order by metric.games desc, metric.player_name) from player_grouped metric), '[]'::jsonb)
  );
$$;

revoke all on function public.get_competitive_draft_analytics(
  uuid, date, date, uuid, text, text
) from public, anon;
grant execute on function public.get_competitive_draft_analytics(
  uuid, date, date, uuid, text, text
) to authenticated;

comment on function public.get_competitive_draft_analytics(
  uuid, date, date, uuid, text, text
) is 'Tenant-authorized draft and participant evidence with explicit coverage and no estimated values.';
