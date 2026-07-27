-- Game Capture v5: normalized, tenant-safe analytics evidence.

alter table public.scrim_games
  add column if not exists game_classification text,
  add column if not exists quality_flags text[] not null default '{}'::text[],
  add column if not exists roster_coverage integer not null default 0;

alter table public.scrim_games
  drop constraint if exists scrim_games_game_classification_check;
alter table public.scrim_games
  add constraint scrim_games_game_classification_check
  check (game_classification is null or game_classification in ('standard_5v5', 'nonstandard_custom', 'incomplete_capture'));

alter table public.scrim_participants
  add column if not exists is_bot boolean not null default false,
  add column if not exists advanced_stats jsonb not null default '{}'::jsonb;

alter table public.scrim_participants
  drop constraint if exists scrim_participants_advanced_stats_object_check;
alter table public.scrim_participants
  add constraint scrim_participants_advanced_stats_object_check
  check (jsonb_typeof(advanced_stats) = 'object');

create table if not exists public.scrim_game_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scrim_game_id uuid not null references public.scrim_games(id) on delete cascade,
  event_id text not null,
  sequence integer not null default 0,
  occurred_seconds numeric,
  event_type text not null,
  team text not null default 'neutral' check (team in ('our', 'enemy', 'neutral')),
  actor_name text,
  victim_name text,
  objective_type text,
  map_object text,
  created_at timestamptz not null default now(),
  unique (scrim_game_id, event_id)
);

create index if not exists scrim_game_events_tenant_game_time_idx
  on public.scrim_game_events (tenant_id, scrim_game_id, occurred_seconds);
create index if not exists scrim_game_events_type_idx
  on public.scrim_game_events (tenant_id, event_type);

alter table public.scrim_game_events enable row level security;
drop policy if exists "tenant members read game events" on public.scrim_game_events;
create policy "tenant members read game events"
  on public.scrim_game_events for select
  to authenticated
  using (public.user_belongs_to_tenant(tenant_id));

revoke all on table public.scrim_game_events from public, anon, authenticated;
grant select on table public.scrim_game_events to authenticated;
grant select, insert, update, delete on table public.scrim_game_events to service_role;

-- Preserve the useful allow-listed post-game statistics before deleting raw payloads.
with raw_players as (
  select
    game.id as scrim_game_id,
    game.side,
    (team.value ->> 'teamId')::integer as team_id,
    player.value as player
  from public.scrim_games game
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(game.external_game_data -> 'post_game_data' -> 'teams') = 'array'
      then game.external_game_data -> 'post_game_data' -> 'teams' else '[]'::jsonb end
  ) team(value)
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(team.value -> 'players') = 'array'
      then team.value -> 'players' else '[]'::jsonb end
  ) player(value)
), matched as (
  select participant.id, raw.player
  from public.scrim_participants participant
  join raw_players raw on raw.scrim_game_id = participant.scrim_game_id
    and lower(coalesce(raw.player ->> 'championName', '')) = lower(coalesce(participant.champion_name, ''))
    and participant.is_our_team = case
      when raw.side = 'blue' then raw.team_id = 100
      when raw.side = 'red' then raw.team_id = 200
      else participant.is_our_team
    end
)
update public.scrim_participants participant
set
  is_bot = coalesce((matched.player ->> 'botPlayer')::boolean, false),
  advanced_stats = jsonb_strip_nulls(jsonb_build_object(
    'wards_placed', matched.player #> '{stats,WARD_PLACED}',
    'wards_killed', matched.player #> '{stats,WARD_KILLED}',
    'control_wards_purchased', matched.player #> '{stats,VISION_WARDS_BOUGHT_IN_GAME}',
    'damage_to_objectives', matched.player #> '{stats,TOTAL_DAMAGE_DEALT_TO_OBJECTIVES}',
    'damage_to_turrets', matched.player #> '{stats,TOTAL_DAMAGE_DEALT_TO_TURRETS}',
    'healing', matched.player #> '{stats,TOTAL_HEAL}',
    'healing_to_teammates', matched.player #> '{stats,TOTAL_HEAL_ON_TEAMMATES}',
    'shielding_to_teammates', matched.player #> '{stats,TOTAL_DAMAGE_SHIELDED_ON_TEAMMATES}',
    'damage_mitigated', matched.player #> '{stats,TOTAL_DAMAGE_SELF_MITIGATED}',
    'crowd_control_seconds', matched.player #> '{stats,TIME_CCING_OTHERS}',
    'time_dead_seconds', matched.player #> '{stats,TOTAL_TIME_SPENT_DEAD}',
    'neutral_cs', matched.player #> '{stats,NEUTRAL_MINIONS_KILLED}',
    'ally_jungle_cs', matched.player #> '{stats,NEUTRAL_MINIONS_KILLED_YOUR_JUNGLE}',
    'enemy_jungle_cs', matched.player #> '{stats,NEUTRAL_MINIONS_KILLED_ENEMY_JUNGLE}',
    'largest_multi_kill', matched.player #> '{stats,LARGEST_MULTI_KILL}',
    'largest_killing_spree', matched.player #> '{stats,LARGEST_KILLING_SPREE}'
  ))
from matched
where participant.id = matched.id;

-- Repair legacy numeric item arrays without discarding their slot order.
update public.scrim_participants participant
set items = (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', item.value::integer,
    'name', 'Item ' || item.value,
    'slot', item.ordinality - 1
  ) order by item.ordinality), '[]'::jsonb)
  from jsonb_array_elements_text(participant.items) with ordinality item(value, ordinality)
  where item.value ~ '^[0-9]+$' and item.value::integer > 0
)
where jsonb_typeof(participant.items) = 'array'
  and jsonb_array_length(participant.items) > 0
  and jsonb_typeof(participant.items -> 0) = 'number';

-- Resolve the numeric bans found in the completed custom-game fixture.
with repaired as (
  select draft.id, key,
    coalesce(jsonb_agg(
      case action ->> 'champion_id'
        when '1' then action || '{"champion":"Annie"}'::jsonb
        when '32' then action || '{"champion":"Amumu"}'::jsonb
        when '34' then action || '{"champion":"Anivia"}'::jsonb
        when '427' then action || '{"champion":"Ivern"}'::jsonb
        when '523' then action || '{"champion":"Aphelios"}'::jsonb
        else action
      end
      order by ordinality
    ), '[]'::jsonb) as actions
  from public.game_drafts draft
  cross join lateral (values ('picks'), ('bans')) section(key)
  cross join lateral jsonb_array_elements(coalesce(draft.draft_data -> section.key, '[]'::jsonb)) with ordinality rows(action, ordinality)
  group by draft.id, key
), combined as (
  select id, jsonb_object_agg(key, actions) as sections from repaired group by id
)
update public.game_drafts draft
set draft_data = draft.draft_data || combined.sections
from combined where combined.id = draft.id;

-- Canonical game-level bans are relative to our recorded side.
update public.scrim_games game
set bans = jsonb_build_object(
  'our_bans', coalesce((select jsonb_agg(action - 'team' order by coalesce((action->>'order')::integer, 0))
    from jsonb_array_elements(coalesce(draft.draft_data -> 'bans', '[]'::jsonb)) action
    where action ->> 'team' = game.side), '[]'::jsonb),
  'enemy_bans', coalesce((select jsonb_agg(action - 'team' order by coalesce((action->>'order')::integer, 0))
    from jsonb_array_elements(coalesce(draft.draft_data -> 'bans', '[]'::jsonb)) action
    where action ->> 'team' <> game.side), '[]'::jsonb)
)
from public.game_drafts draft
where draft.scrim_game_id = game.id and draft.draft_mode = 'client';

-- Promote the saved timelines into normalized, tenant-scoped events.
insert into public.scrim_game_events (
  tenant_id, scrim_game_id, event_id, sequence, occurred_seconds, event_type,
  team, actor_name, victim_name, objective_type, map_object
)
select
  scrim.tenant_id,
  game.id,
  coalesce(event.value ->> 'event_id', event.value ->> 'EventID', event.ordinality::text),
  coalesce((event.value ->> 'sequence')::integer, event.ordinality::integer - 1),
  coalesce((event.value ->> 'occurred_seconds')::numeric, (event.value ->> 'EventTime')::numeric),
  coalesce(event.value ->> 'event_type', event.value ->> 'EventName', 'Unknown'),
  coalesce(nullif(event.value ->> 'team', ''), case
    when exists (
      select 1 from public.scrim_participants participant
      where participant.scrim_game_id = game.id and participant.is_our_team
        and lower(participant.summoner_name) = lower(coalesce(event.value ->> 'actor_name', event.value ->> 'KillerName', event.value ->> 'Recipient', event.value ->> 'Acer', ''))
    ) then 'our'
    when exists (
      select 1 from public.scrim_participants participant
      where participant.scrim_game_id = game.id and not participant.is_our_team
        and lower(participant.summoner_name) = lower(coalesce(event.value ->> 'actor_name', event.value ->> 'KillerName', event.value ->> 'Recipient', event.value ->> 'Acer', ''))
    ) then 'enemy'
    else 'neutral' end),
  coalesce(event.value ->> 'actor_name', event.value ->> 'KillerName', event.value ->> 'Recipient', event.value ->> 'Acer'),
  coalesce(event.value ->> 'victim_name', event.value ->> 'VictimName'),
  coalesce(event.value ->> 'objective_type', event.value ->> 'DragonType',
    case when coalesce(event.value ->> 'event_type', event.value ->> 'EventName') = 'HeraldKill' then 'Herald'
         when coalesce(event.value ->> 'event_type', event.value ->> 'EventName') = 'BaronKill' then 'Baron' end),
  coalesce(event.value ->> 'map_object', event.value ->> 'TurretKilled', event.value ->> 'InhibKilled')
from public.scrim_games game
join public.scrims scrim on scrim.id = game.scrim_id
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(game.external_game_data -> 'timeline') = 'array'
    then game.external_game_data -> 'timeline' else '[]'::jsonb end
) with ordinality event(value, ordinality)
on conflict (scrim_game_id, event_id) do update set
  sequence = excluded.sequence,
  occurred_seconds = excluded.occurred_seconds,
  event_type = excluded.event_type,
  team = excluded.team,
  actor_name = excluded.actor_name,
  victim_name = excluded.victim_name,
  objective_type = excluded.objective_type,
  map_object = excluded.map_object;

-- Classify historical captured games independently from roster matching.
with counts as (
  select game.id,
    count(participant.id) filter (where participant.is_our_team) as ours,
    count(participant.id) filter (where not participant.is_our_team) as enemy,
    count(participant.id) filter (where participant.is_bot) as bots,
    count(participant.player_id) filter (where participant.is_our_team) as roster_coverage
  from public.scrim_games game
  left join public.scrim_participants participant on participant.scrim_game_id = game.id
  where game.external_game_data ->> 'source' = 'desktop_collector'
  group by game.id
)
update public.scrim_games game
set
  game_classification = case
    when counts.ours = 0 or counts.enemy = 0 or game.result is null or game.duration_seconds is null then 'incomplete_capture'
    when counts.ours <> 5 or counts.enemy <> 5 or counts.bots > 0 then 'nonstandard_custom'
    else 'standard_5v5'
  end,
  roster_coverage = counts.roster_coverage,
  quality_flags = array_remove(array[
    case when counts.ours <> 5 or counts.enemy <> 5 then 'non_5v5' end,
    case when counts.bots > 0 then 'bots_present' end,
    case when counts.roster_coverage < counts.ours then 'incomplete_roster_match' end,
    case when game.result is null then 'missing_result' end,
    case when game.duration_seconds is null then 'missing_duration' end
  ]::text[], null)
from counts where counts.id = game.id;

-- Replace raw provider blocks with the minimal capability summary after extraction.
update public.scrim_games game
set external_game_data = (game.external_game_data - 'champion_select_data' - 'post_game_data')
  || jsonb_build_object('capture_features', jsonb_build_object(
    'champion_select', game.external_game_data ? 'champion_select_data'
      or coalesce((game.external_game_data #>> '{capture_features,champion_select}')::boolean, false),
    'post_game', game.external_game_data ? 'post_game_data'
      or coalesce((game.external_game_data #>> '{capture_features,post_game}')::boolean, false)
  ))
where game.external_game_data ? 'champion_select_data'
   or game.external_game_data ? 'post_game_data';

-- Existing capture-session events become allow-listed as well.
update public.collector_capture_events event
set payload = jsonb_strip_nulls(jsonb_build_object(
  'event_id', event.payload -> 'event_id',
  'sequence', event.payload -> 'sequence',
  'occurred_at', event.payload -> 'occurred_at',
  'event_type', coalesce(event.payload -> 'event_type', event.payload -> 'EventName'),
  'occurred_seconds', coalesce(event.payload -> 'occurred_seconds', event.payload -> 'EventTime'),
  'team', event.payload -> 'team',
  'actor_name', coalesce(event.payload -> 'actor_name', event.payload -> 'KillerName', event.payload -> 'Recipient', event.payload -> 'Acer'),
  'victim_name', coalesce(event.payload -> 'victim_name', event.payload -> 'VictimName'),
  'objective_type', coalesce(event.payload -> 'objective_type', event.payload -> 'DragonType'),
  'map_object', coalesce(event.payload -> 'map_object', event.payload -> 'TurretKilled', event.payload -> 'InhibKilled')
));

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
  );
$$;

revoke all on function public.get_team_analytics_dataset(uuid, date, date) from public, anon;
grant execute on function public.get_team_analytics_dataset(uuid, date, date) to authenticated;

comment on function public.get_team_analytics_dataset(uuid, date, date) is
  'Returns normalized tenant-authorized Team Analytics v3 evidence without raw provider payloads.';
