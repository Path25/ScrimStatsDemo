-- Structured scrim reviews and staff-only mutation boundary.
alter table public.scrim_games
  add column if not exists performance_rating smallint,
  add column if not exists performance_summary text,
  add column if not exists early_game_rating smallint,
  add column if not exists mid_game_rating smallint,
  add column if not exists late_game_rating smallint;

alter table public.scrim_games
  drop constraint if exists scrim_games_performance_rating_check,
  drop constraint if exists scrim_games_early_game_rating_check,
  drop constraint if exists scrim_games_mid_game_rating_check,
  drop constraint if exists scrim_games_late_game_rating_check,
  add constraint scrim_games_performance_rating_check check (performance_rating between 1 and 5),
  add constraint scrim_games_early_game_rating_check check (early_game_rating between 1 and 5),
  add constraint scrim_games_mid_game_rating_check check (mid_game_rating between 1 and 5),
  add constraint scrim_games_late_game_rating_check check (late_game_rating between 1 and 5);

alter table public.scrims
  add column if not exists result_source text not null default 'games',
  add column if not exists result_override_reason text,
  add column if not exists review_status text not null default 'not_started',
  add column if not exists review_completed_at timestamptz,
  add column if not exists review_completed_by uuid references auth.users(id) on delete set null;

alter table public.scrims
  alter column our_score drop default,
  alter column opponent_score drop default,
  drop constraint if exists scrims_result_source_check,
  drop constraint if exists scrims_review_status_check,
  add constraint scrims_result_source_check check (result_source in ('games','manual')),
  add constraint scrims_review_status_check check (review_status in ('not_started','in_review','complete'));

-- Legacy zero defaults did not represent explicit results.
update public.scrims
set our_score = null, opponent_score = null
where result is null and our_score = 0 and opponent_score = 0;

update public.scrims s
set review_status = case
  when s.result is not null and s.our_score is not null and s.opponent_score is not null then 'complete'
  when exists (select 1 from public.scrim_games g where g.scrim_id = s.id) then 'in_review'
  else 'not_started'
end;

create index if not exists scrims_tenant_starts_at_idx
  on public.scrims (tenant_id, starts_at desc);
create index if not exists scrims_tenant_review_starts_idx
  on public.scrims (tenant_id, review_status, starts_at desc);
create index if not exists scrim_games_scrim_review_idx
  on public.scrim_games (scrim_id, status, game_number);
create index if not exists scrims_review_completed_by_idx
  on public.scrims (review_completed_by) where review_completed_by is not null;

create or replace function public.sync_scrim_block_game_score()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_scrim_id uuid := coalesce(new.scrim_id, old.scrim_id);
  v_game_wins integer;
  v_game_losses integer;
  v_review_status text;
  v_result_source text;
begin
  select review_status, result_source into v_review_status, v_result_source
  from public.scrims where id = v_scrim_id;
  if v_result_source <> 'games' then return coalesce(new, old); end if;

  select count(*) filter (where result = 'win'), count(*) filter (where result = 'loss')
  into v_game_wins, v_game_losses
  from public.scrim_games
  where scrim_id = v_scrim_id and status <> 'cancelled' and result is not null;

  update public.scrims set
    our_score = case when v_game_wins + v_game_losses > 0 then v_game_wins else null end,
    opponent_score = case when v_game_wins + v_game_losses > 0 then v_game_losses else null end,
    result = case
      when v_review_status <> 'complete' or v_game_wins + v_game_losses = 0 then null
      when v_game_wins > v_game_losses then 'win'
      when v_game_wins < v_game_losses then 'loss'
      else 'draw'
    end,
    updated_at = now()
  where id = v_scrim_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_scrim_block_game_score_trigger on public.scrim_games;
create trigger sync_scrim_block_game_score_trigger
after insert or update of result, status or delete on public.scrim_games
for each row execute function public.sync_scrim_block_game_score();

create or replace function public.save_scrim_game_review(
  p_scrim_id uuid, p_game_id uuid, p_game_number integer, p_status text, p_side text,
  p_result text, p_duration_seconds integer, p_our_team_kills integer,
  p_enemy_team_kills integer, p_our_team_gold integer, p_enemy_team_gold integer,
  p_performance_rating smallint, p_performance_summary text,
  p_early_game_rating smallint, p_mid_game_rating smallint, p_late_game_rating smallint,
  p_notes text
) returns public.scrim_games language plpgsql set search_path = '' as $$
declare v_tenant_id uuid; v_game public.scrim_games;
begin
  select tenant_id into v_tenant_id from public.scrims where id = p_scrim_id;
  if v_tenant_id is null or not public.user_has_tenant_role(
    v_tenant_id, array['owner','admin']::public.tenant_role[]
  ) then raise exception 'Practice block not found or staff access required'; end if;
  if p_game_number < 1 then raise exception 'Game number must be at least 1'; end if;
  if p_status not in ('pending','draft','in_progress','completed','cancelled') then raise exception 'Invalid game status'; end if;
  if p_side is not null and p_side not in ('blue','red') then raise exception 'Invalid team side'; end if;
  if p_result is not null and p_result not in ('win','loss') then raise exception 'Invalid game result'; end if;
  if p_status = 'completed' and p_result is null then raise exception 'Completed games require a saved outcome'; end if;
  if coalesce(p_duration_seconds,0) < 0 or coalesce(p_our_team_kills,0) < 0
    or coalesce(p_enemy_team_kills,0) < 0 or coalesce(p_our_team_gold,0) < 0
    or coalesce(p_enemy_team_gold,0) < 0
  then raise exception 'Game statistics cannot be negative'; end if;

  if p_game_id is null then
    insert into public.scrim_games (
      scrim_id, game_number, status, side, result, duration_seconds,
      our_team_kills, enemy_team_kills, our_team_gold, enemy_team_gold,
      performance_rating, performance_summary, early_game_rating, mid_game_rating,
      late_game_rating, notes
    ) values (
      p_scrim_id, p_game_number, p_status, p_side, p_result, p_duration_seconds,
      p_our_team_kills, p_enemy_team_kills, p_our_team_gold, p_enemy_team_gold,
      p_performance_rating, nullif(btrim(p_performance_summary),''), p_early_game_rating,
      p_mid_game_rating, p_late_game_rating, nullif(btrim(p_notes),'')
    ) returning * into v_game;
  else
    update public.scrim_games set
      game_number = p_game_number, status = p_status, side = p_side, result = p_result,
      duration_seconds = p_duration_seconds, our_team_kills = p_our_team_kills,
      enemy_team_kills = p_enemy_team_kills, our_team_gold = p_our_team_gold,
      enemy_team_gold = p_enemy_team_gold, performance_rating = p_performance_rating,
      performance_summary = nullif(btrim(p_performance_summary),''),
      early_game_rating = p_early_game_rating, mid_game_rating = p_mid_game_rating,
      late_game_rating = p_late_game_rating, notes = nullif(btrim(p_notes),''), updated_at = now()
    where id = p_game_id and scrim_id = p_scrim_id returning * into v_game;
    if v_game.id is null then raise exception 'Game not found in this practice block'; end if;
  end if;

  update public.scrims set review_status = 'in_review', review_completed_at = null,
    review_completed_by = null, updated_at = now()
  where id = p_scrim_id and review_status <> 'in_review';
  return v_game;
end;
$$;

create or replace function public.finalize_scrim_block_review(
  p_scrim_id uuid, p_result_source text, p_our_score integer,
  p_opponent_score integer, p_override_reason text
) returns public.scrims language plpgsql set search_path = '' as $$
declare
  v_scrim public.scrims; v_missing text; v_game_wins integer; v_game_losses integer;
  v_final_our integer; v_final_opponent integer; v_result text;
begin
  select * into v_scrim from public.scrims where id = p_scrim_id for update;
  if v_scrim.id is null or not public.user_has_tenant_role(
    v_scrim.tenant_id, array['owner','admin']::public.tenant_role[]
  ) then raise exception 'Practice block not found or staff access required'; end if;

  select string_agg('Game ' || game_number || ': ' || concat_ws(', ',
    case when result is null then 'result' end,
    case when side is null then 'side' end,
    case when performance_rating is null then 'performance rating' end,
    case when nullif(btrim(performance_summary),'') is null then 'performance summary' end
  ), '; ' order by game_number) into v_missing
  from public.scrim_games where scrim_id = p_scrim_id and status <> 'cancelled'
    and (result is null or side is null or performance_rating is null
      or nullif(btrim(performance_summary),'') is null);

  if not exists (select 1 from public.scrim_games where scrim_id = p_scrim_id and status <> 'cancelled')
    then raise exception 'Add at least one game before completing the review'; end if;
  if v_missing is not null then raise exception 'Complete the required review fields — %', v_missing; end if;

  select count(*) filter (where result = 'win'), count(*) filter (where result = 'loss')
  into v_game_wins, v_game_losses
  from public.scrim_games where scrim_id = p_scrim_id and status <> 'cancelled';

  if p_result_source = 'games' then
    v_final_our := v_game_wins; v_final_opponent := v_game_losses;
  elsif p_result_source = 'manual' then
    if p_our_score is null or p_opponent_score is null or p_our_score < 0 or p_opponent_score < 0
      then raise exception 'Manual scores must be non-negative numbers'; end if;
    if (p_our_score <> v_game_wins or p_opponent_score <> v_game_losses)
      and nullif(btrim(p_override_reason),'') is null
      then raise exception 'Explain why the final score differs from recorded game outcomes'; end if;
    v_final_our := p_our_score; v_final_opponent := p_opponent_score;
  else raise exception 'Result source must be games or manual'; end if;

  v_result := case when v_final_our > v_final_opponent then 'win'
    when v_final_our < v_final_opponent then 'loss' else 'draw' end;
  update public.scrims set our_score = v_final_our, opponent_score = v_final_opponent,
    result = v_result, result_source = p_result_source,
    result_override_reason = case when p_result_source = 'manual'
      then nullif(btrim(p_override_reason),'') else null end,
    review_status = 'complete', review_completed_at = now(),
    review_completed_by = (select auth.uid()), status = 'completed', updated_at = now()
  where id = p_scrim_id returning * into v_scrim;
  return v_scrim;
end;
$$;

create or replace function public.reopen_scrim_block_review(p_scrim_id uuid)
returns public.scrims language plpgsql set search_path = '' as $$
declare v_scrim public.scrims;
begin
  select * into v_scrim from public.scrims where id = p_scrim_id;
  if v_scrim.id is null or not public.user_has_tenant_role(
    v_scrim.tenant_id, array['owner','admin']::public.tenant_role[]
  ) then raise exception 'Practice block not found or staff access required'; end if;
  update public.scrims set review_status = 'in_review', review_completed_at = null,
    review_completed_by = null,
    result = case when result_source = 'games' then null else result end, updated_at = now()
  where id = p_scrim_id returning * into v_scrim;
  return v_scrim;
end;
$$;

alter table public.scrims enable row level security;
alter table public.scrim_games enable row level security;
alter table public.scrim_participants enable row level security;

drop policy if exists "Tenant members can view scrim blocks" on public.scrims;
drop policy if exists "Staff can create scrim blocks" on public.scrims;
drop policy if exists "Staff can update scrim blocks" on public.scrims;
drop policy if exists "Staff can delete scrim blocks" on public.scrims;
create policy "Tenant members can view scrim blocks" on public.scrims for select to authenticated
  using (public.user_belongs_to_tenant(tenant_id));
create policy "Staff can create scrim blocks" on public.scrims for insert to authenticated
  with check (public.user_has_tenant_role(tenant_id,array['owner','admin']::public.tenant_role[]) and created_by=(select auth.uid()));
create policy "Staff can update scrim blocks" on public.scrims for update to authenticated
  using (public.user_has_tenant_role(tenant_id,array['owner','admin']::public.tenant_role[]))
  with check (public.user_has_tenant_role(tenant_id,array['owner','admin']::public.tenant_role[]));
create policy "Staff can delete scrim blocks" on public.scrims for delete to authenticated
  using (public.user_has_tenant_role(tenant_id,array['owner','admin']::public.tenant_role[]));

drop policy if exists "Tenant members can view scrim games" on public.scrim_games;
drop policy if exists "Staff can create scrim games" on public.scrim_games;
drop policy if exists "Staff can update scrim games" on public.scrim_games;
drop policy if exists "Staff can delete scrim games" on public.scrim_games;
create policy "Tenant members can view scrim games" on public.scrim_games for select to authenticated
  using (exists (select 1 from public.scrims s where s.id=scrim_id and public.user_belongs_to_tenant(s.tenant_id)));
create policy "Staff can create scrim games" on public.scrim_games for insert to authenticated
  with check (exists (select 1 from public.scrims s where s.id=scrim_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));
create policy "Staff can update scrim games" on public.scrim_games for update to authenticated
  using (exists (select 1 from public.scrims s where s.id=scrim_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])))
  with check (exists (select 1 from public.scrims s where s.id=scrim_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));
create policy "Staff can delete scrim games" on public.scrim_games for delete to authenticated
  using (exists (select 1 from public.scrims s where s.id=scrim_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));

drop policy if exists "Tenant members can view scrim participants" on public.scrim_participants;
drop policy if exists "Staff can create scrim participants" on public.scrim_participants;
drop policy if exists "Staff can update scrim participants" on public.scrim_participants;
drop policy if exists "Staff can delete scrim participants" on public.scrim_participants;
create policy "Tenant members can view scrim participants" on public.scrim_participants for select to authenticated
  using (exists (select 1 from public.scrim_games g join public.scrims s on s.id=g.scrim_id where g.id=scrim_game_id and s.tenant_id=scrim_participants.tenant_id and public.user_belongs_to_tenant(s.tenant_id)));
create policy "Staff can create scrim participants" on public.scrim_participants for insert to authenticated
  with check (exists (select 1 from public.scrim_games g join public.scrims s on s.id=g.scrim_id where g.id=scrim_game_id and s.tenant_id=scrim_participants.tenant_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));
create policy "Staff can update scrim participants" on public.scrim_participants for update to authenticated
  using (exists (select 1 from public.scrim_games g join public.scrims s on s.id=g.scrim_id where g.id=scrim_game_id and s.tenant_id=scrim_participants.tenant_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])))
  with check (exists (select 1 from public.scrim_games g join public.scrims s on s.id=g.scrim_id where g.id=scrim_game_id and s.tenant_id=scrim_participants.tenant_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));
create policy "Staff can delete scrim participants" on public.scrim_participants for delete to authenticated
  using (exists (select 1 from public.scrim_games g join public.scrims s on s.id=g.scrim_id where g.id=scrim_game_id and s.tenant_id=scrim_participants.tenant_id and public.user_has_tenant_role(s.tenant_id,array['owner','admin']::public.tenant_role[])));

grant select on public.scrims, public.scrim_games, public.scrim_participants to authenticated;
grant insert, update, delete on public.scrims, public.scrim_games, public.scrim_participants to authenticated;
grant all on public.scrims, public.scrim_games, public.scrim_participants to service_role;
grant execute on function public.save_scrim_game_review(uuid,uuid,integer,text,text,text,integer,integer,integer,integer,integer,smallint,text,smallint,smallint,smallint,text) to authenticated, service_role;
grant execute on function public.finalize_scrim_block_review(uuid,text,integer,integer,text) to authenticated, service_role;
grant execute on function public.reopen_scrim_block_review(uuid) to authenticated, service_role;
