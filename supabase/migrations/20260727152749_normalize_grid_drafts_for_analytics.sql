-- Promote the existing GRID pick evidence into the canonical draft contract.
-- The stored GRID examples do not contain bans, so completeness stays false.
with grid_drafts as (
  select
    game.id as scrim_game_id,
    nullif(game.external_game_data #>> '{grid_metadata,ourTeamSide}', '')::public.draft_team_side as our_team_side,
    game.external_game_data #>> '{grid_metadata,seriesId}' as series_id,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'champion', coalesce(pick.value ->> 'championName', 'Unknown champion'),
        'order', coalesce((pick.value ->> 'order')::integer, pick.ordinality::integer),
        'team', side.name
      ) order by side.sort_order, pick.ordinality)
      from (values ('blue', 1), ('red', 2)) side(name, sort_order)
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(game.external_game_data #> array['draft_data','picks',side.name]) = 'array'
          then game.external_game_data #> array['draft_data','picks',side.name]
          else '[]'::jsonb end
      ) with ordinality pick(value, ordinality)
    ), '[]'::jsonb) as picks,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'champion', coalesce(ban.value ->> 'championName', ban.value ->> 'champion', 'Unknown champion'),
        'order', coalesce((ban.value ->> 'order')::integer, ban.ordinality::integer),
        'team', side.name
      ) order by side.sort_order, ban.ordinality)
      from (values ('blue', 1), ('red', 2)) side(name, sort_order)
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(game.external_game_data #> array['draft_data','bans',side.name]) = 'array'
          then game.external_game_data #> array['draft_data','bans',side.name]
          else '[]'::jsonb end
      ) with ordinality ban(value, ordinality)
    ), '[]'::jsonb) as bans
  from public.scrim_games game
  where game.external_game_data ? 'grid_metadata'
)
insert into public.game_drafts (
  scrim_game_id, draft_mode, our_team_side, draft_data, session_id, completed_at
)
select
  grid.scrim_game_id,
  'grid'::public.draft_mode,
  grid.our_team_side,
  jsonb_build_object(
    'picks', grid.picks,
    'bans', grid.bans,
    'phase', case when jsonb_array_length(grid.picks) > 0 then 'partial' else 'unavailable' end,
    'completed', jsonb_array_length(grid.picks) = 10 and jsonb_array_length(grid.bans) = 10,
    'source', 'grid'
  ),
  nullif(grid.series_id, ''),
  case when jsonb_array_length(grid.picks) = 10 and jsonb_array_length(grid.bans) = 10 then now() end
from grid_drafts grid
where jsonb_array_length(grid.picks) > 0
  and not exists (
    select 1 from public.game_drafts draft
    where draft.scrim_game_id = grid.scrim_game_id
      and draft.draft_mode = 'grid'
  );
