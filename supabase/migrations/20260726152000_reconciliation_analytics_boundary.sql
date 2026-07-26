-- Allow parent cascade cleanup while preserving direct evidence immutability.
create or replace function public.prevent_evidence_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'Game provenance is immutable';
end;
$$;

revoke all on function public.prevent_evidence_mutation() from public, anon, authenticated;

-- Pending duplicate pairs are excluded from analytics until staff resolve them.
-- Resolved pairs contribute only the explicitly accepted game.
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
  with scoped_games as (
    select
      game.id,
      game.scrim_id,
      game.game_number,
      coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz) as played_at,
      scrim.opponent_team_id,
      coalesce(nullif(trim(scrim.opponent_name), ''), 'Opponent not recorded') as opponent_name,
      scrim.format,
      game.result,
      lower(game.side) as side,
      game.duration_seconds,
      game.our_team_kills,
      game.enemy_team_kills,
      game.our_team_gold,
      game.enemy_team_gold,
      game.performance_rating,
      game.early_game_rating,
      game.mid_game_rating,
      game.late_game_rating,
      coalesce(evidence.provider, 'manual') as provider,
      array_remove(array_cat(
        coalesce(evidence.capabilities, '{}'::text[]),
        array[
          case when game.result in ('win', 'loss', 'draw') then 'result' end,
          case when exists (
            select 1 from public.scrim_participants participant
            where participant.scrim_game_id = game.id
              and participant.champion_name is not null
          ) then 'draft' end,
          case when exists (
            select 1 from public.scrim_participants participant
            where participant.scrim_game_id = game.id
              and participant.is_our_team = true
          ) then 'participant_stats' end,
          case when coalesce(game.objectives, '{}'::jsonb) <> '{}'::jsonb then 'objectives' end,
          case when game.performance_rating is not null
            and nullif(trim(game.performance_summary), '') is not null then 'coach_review' end
        ]::text[]
      ), null) as capabilities,
      evidence.payload_version,
      evidence.captured_at,
      coalesce(
        nullif(split_part(game.external_game_data ->> 'gameVersion', '.', 1), ''),
        nullif(game.external_game_data ->> 'patch', '')
      ) as patch
    from public.scrim_games game
    join public.scrims scrim on scrim.id = game.scrim_id
    left join public.scrim_game_evidence evidence on evidence.scrim_game_id = game.id
    where scrim.tenant_id = p_tenant_id
      and public.user_belongs_to_tenant(p_tenant_id)
      and game.status = 'completed'
      and not exists (
        select 1
        from public.scrim_game_reconciliations reconciliation
        where reconciliation.tenant_id = scrim.tenant_id
          and game.id in (reconciliation.first_game_id, reconciliation.second_game_id)
          and (
            reconciliation.status = 'pending'
            or (
              reconciliation.status = 'resolved'
              and reconciliation.accepted_game_id <> game.id
            )
          )
      )
      and coalesce(game.game_start_time, scrim.starts_at, scrim.match_date::timestamptz)::date
        between p_date_from and p_date_to
  ),
  scoped_participants as (
    select
      participant.scrim_game_id,
      participant.player_id,
      participant.summoner_name,
      participant.champion_name,
      lower(participant.role) as role,
      participant.is_our_team,
      participant.kills,
      participant.deaths,
      participant.assists,
      participant.cs,
      participant.gold,
      participant.damage_dealt,
      participant.damage_taken,
      participant.vision_score
    from public.scrim_participants participant
    join scoped_games game on game.id = participant.scrim_game_id
  )
  select jsonb_build_object(
    'contract_version', 'team-analytics-v2',
    'date_from', p_date_from,
    'date_to', p_date_to,
    'capture_profile', coalesce((
      select setting.profile
      from public.tenant_capture_settings setting
      where setting.tenant_id = p_tenant_id
    ), 'desktop_manual'),
    'games', coalesce((
      select jsonb_agg(to_jsonb(game) order by game.played_at desc, game.game_number desc)
      from scoped_games game
    ), '[]'::jsonb),
    'participants', coalesce((
      select jsonb_agg(to_jsonb(participant))
      from scoped_participants participant
    ), '[]'::jsonb),
    'filter_options', jsonb_build_object(
      'opponents', coalesce((
        select jsonb_agg(to_jsonb(option_row) order by option_row.name)
        from (
          select distinct
            coalesce(opponent_team_id::text, 'name:' || lower(opponent_name)) as key,
            opponent_name as name
          from scoped_games
        ) option_row
      ), '[]'::jsonb),
      'formats', coalesce((
        select jsonb_agg(option_row.format order by option_row.format)
        from (select distinct format from scoped_games where nullif(trim(format), '') is not null) option_row
      ), '[]'::jsonb),
      'patches', coalesce((
        select jsonb_agg(option_row.patch order by option_row.patch desc)
        from (select distinct patch from scoped_games where patch is not null) option_row
      ), '[]'::jsonb)
    )
  );
$$;

revoke all on function public.get_team_analytics_dataset(uuid, date, date)
  from public, anon;
grant execute on function public.get_team_analytics_dataset(uuid, date, date)
  to authenticated;
