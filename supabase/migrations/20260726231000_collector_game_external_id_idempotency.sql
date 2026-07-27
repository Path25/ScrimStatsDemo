-- A collector retry must reuse the same provider game rather than allocating
-- another series game number for every upload attempt.
create unique index if not exists scrim_games_scrim_external_game_id_key
  on public.scrim_games (scrim_id, external_game_id)
  where external_game_id is not null;
