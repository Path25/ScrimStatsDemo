-- Legacy v4 drafts occasionally stored every completed action with pickTurn = 0.
-- The JSON array retained client action sequence, so recover deterministic order
-- from ordinality without rewriting valid positive pick turns.
with repaired as (
  select draft.id, section.key,
    jsonb_agg(
      case when coalesce((action.value ->> 'order')::integer, 0) <= 0
        then jsonb_set(action.value, '{order}', to_jsonb(action.ordinality::integer), true)
        else action.value end
      order by action.ordinality
    ) as actions
  from public.game_drafts draft
  cross join lateral (values ('picks'), ('bans')) section(key)
  cross join lateral jsonb_array_elements(coalesce(draft.draft_data -> section.key, '[]'::jsonb))
    with ordinality action(value, ordinality)
  group by draft.id, section.key
), combined as (
  select id, jsonb_object_agg(key, actions) as sections
  from repaired group by id
)
update public.game_drafts draft
set draft_data = draft.draft_data || combined.sections
from combined
where combined.id = draft.id;

update public.scrim_games game
set bans = jsonb_build_object(
  'our_bans', coalesce((select jsonb_agg(action - 'team' order by (action ->> 'order')::integer)
    from jsonb_array_elements(coalesce(draft.draft_data -> 'bans', '[]'::jsonb)) action
    where action ->> 'team' = game.side), '[]'::jsonb),
  'enemy_bans', coalesce((select jsonb_agg(action - 'team' order by (action ->> 'order')::integer)
    from jsonb_array_elements(coalesce(draft.draft_data -> 'bans', '[]'::jsonb)) action
    where action ->> 'team' <> game.side), '[]'::jsonb)
)
from public.game_drafts draft
where draft.scrim_game_id = game.id
  and draft.draft_mode = 'client';
