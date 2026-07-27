-- Turn one-off coaching tasks into evidence-linked action cycles.
-- Additive only: existing actions are preserved and backfilled as player-scoped cycles.

alter table public.coaching_actions
  add column if not exists scope_type text not null default 'player',
  add column if not exists unit_label text,
  add column if not exists category text not null default 'review_discipline',
  add column if not exists participant_player_ids uuid[] not null default '{}'::uuid[],
  add column if not exists checkpoint_scrim_ids uuid[] not null default '{}'::uuid[],
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_timestamp_seconds integer,
  add column if not exists source_note text,
  add column if not exists pattern_label text,
  add column if not exists player_check_in text,
  add column if not exists player_check_in_note text,
  add column if not exists player_checked_in_at timestamptz,
  add column if not exists review_outcome text,
  add column if not exists review_observation text,
  add column if not exists review_evidence text,
  add column if not exists review_next_action text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists carried_from_action_id uuid references public.coaching_actions(id) on delete set null;

update public.coaching_actions
set participant_player_ids = array[assignee_player_id]
where assignee_player_id is not null and cardinality(participant_player_ids) = 0;

alter table public.coaching_actions drop constraint if exists coaching_actions_assignee_check;
alter table public.coaching_actions drop constraint if exists coaching_actions_scope_type_check;
alter table public.coaching_actions add constraint coaching_actions_scope_type_check
  check (scope_type in ('player','unit','team'));
alter table public.coaching_actions drop constraint if exists coaching_actions_category_check;
alter table public.coaching_actions add constraint coaching_actions_category_check
  check (category in ('draft','laning','pathing','vision','objectives','teamfighting','communication','macro','preparation','review_discipline'));
alter table public.coaching_actions drop constraint if exists coaching_actions_source_type_check;
alter table public.coaching_actions add constraint coaching_actions_source_type_check
  check (source_type in ('manual','scrim','game','coach_feedback','draft_scenario','scouting_evidence','analytics'));
alter table public.coaching_actions drop constraint if exists coaching_actions_player_check_in_check;
alter table public.coaching_actions add constraint coaching_actions_player_check_in_check
  check (player_check_in is null or player_check_in in ('practised','blocked','needs_clarification','ready_for_review'));
alter table public.coaching_actions drop constraint if exists coaching_actions_review_outcome_check;
alter table public.coaching_actions add constraint coaching_actions_review_outcome_check
  check (review_outcome is null or review_outcome in ('demonstrated','partially_demonstrated','not_observed','no_longer_relevant'));
alter table public.coaching_actions drop constraint if exists coaching_actions_source_timestamp_check;
alter table public.coaching_actions add constraint coaching_actions_source_timestamp_check
  check (source_timestamp_seconds is null or source_timestamp_seconds >= 0);
alter table public.coaching_actions drop constraint if exists coaching_actions_scope_owner_check;
alter table public.coaching_actions add constraint coaching_actions_scope_owner_check check (
  (scope_type = 'player' and assignee_player_id is not null)
  or (scope_type = 'unit' and nullif(btrim(unit_label), '') is not null and cardinality(participant_player_ids) >= 2)
  or scope_type = 'team'
);

create index if not exists coaching_actions_participants_gin_idx
  on public.coaching_actions using gin (participant_player_ids);
create index if not exists coaching_actions_checkpoints_gin_idx
  on public.coaching_actions using gin (checkpoint_scrim_ids);
create index if not exists coaching_actions_tenant_pattern_idx
  on public.coaching_actions (tenant_id, pattern_label, created_at desc)
  where pattern_label is not null and archived_at is null;

create table if not exists public.coaching_action_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  success_evidence text,
  category text not null check (category in ('draft','laning','pathing','vision','objectives','teamfighting','communication','macro','preparation','review_discipline')),
  scope_type text not null default 'player' check (scope_type in ('player','unit','team')),
  unit_label text,
  suggested_duration_days integer check (suggested_duration_days is null or suggested_duration_days between 1 and 90),
  review_prompt text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, tenant_id)
);

alter table public.coaching_action_templates enable row level security;
drop policy if exists coaching_action_templates_member_read on public.coaching_action_templates;
create policy coaching_action_templates_member_read on public.coaching_action_templates
  for select to authenticated
  using (public.user_belongs_to_tenant(tenant_id));
revoke all on table public.coaching_action_templates from public, anon;
grant select on table public.coaching_action_templates to authenticated;
grant all on table public.coaching_action_templates to service_role;

create or replace function public.create_coaching_action_cycle(p_payload jsonb)
returns public.coaching_actions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid := (p_payload->>'tenant_id')::uuid;
  v_scope text := coalesce(nullif(p_payload->>'scope_type', ''), 'player');
  v_category text := coalesce(nullif(p_payload->>'category', ''), 'review_discipline');
  v_source_type text := coalesce(nullif(p_payload->>'source_type', ''), 'manual');
  v_assignee_player_id uuid := nullif(p_payload->>'assignee_player_id', '')::uuid;
  v_assignee_user_id uuid := nullif(p_payload->>'assignee_user_id', '')::uuid;
  v_participants uuid[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'participant_player_ids', '[]'::jsonb))::uuid), '{}'::uuid[]);
  v_checkpoints uuid[] := coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'checkpoint_scrim_ids', '[]'::jsonb))::uuid), '{}'::uuid[]);
  v_scrim_id uuid := nullif(p_payload->>'scrim_id', '')::uuid;
  v_scrim_game_id uuid := nullif(p_payload->>'scrim_game_id', '')::uuid;
  v_feedback_id uuid := nullif(p_payload->>'feedback_id', '')::uuid;
  v_action public.coaching_actions;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;
  if not public.user_has_tenant_role(v_tenant_id, array['owner','admin']::public.tenant_role[]) then
    raise exception 'Owner or admin access is required';
  end if;
  if char_length(btrim(coalesce(p_payload->>'title', ''))) not between 1 and 160 then
    raise exception 'Action title must contain between 1 and 160 characters';
  end if;
  if coalesce(p_payload->>'priority', 'medium') not in ('low','medium','high') then raise exception 'Unsupported priority'; end if;
  if v_scope not in ('player','unit','team') then raise exception 'Unsupported action scope'; end if;
  if v_category not in ('draft','laning','pathing','vision','objectives','teamfighting','communication','macro','preparation','review_discipline') then raise exception 'Unsupported action category'; end if;
  if v_source_type not in ('manual','scrim','game','coach_feedback','draft_scenario','scouting_evidence','analytics') then raise exception 'Unsupported evidence source'; end if;

  if v_assignee_player_id is not null and not (v_assignee_player_id = any(v_participants)) then
    v_participants := array_prepend(v_assignee_player_id, v_participants);
  end if;
  if v_scope = 'player' and v_assignee_player_id is null then raise exception 'Player actions require a primary player'; end if;
  if v_scope = 'unit' and (cardinality(v_participants) < 2 or nullif(btrim(coalesce(p_payload->>'unit_label','')), '') is null) then
    raise exception 'Unit actions require a label and at least two players';
  end if;
  if exists (
    select 1 from unnest(v_participants) participant_id
    where not exists (select 1 from public.players p where p.id = participant_id and p.tenant_id = v_tenant_id and p.archived_at is null)
  ) then raise exception 'Every participant must be an active player in this workspace'; end if;
  if v_assignee_user_id is not null and not exists (
    select 1 from public.tenant_users member where member.tenant_id = v_tenant_id and member.user_id = v_assignee_user_id
  ) then raise exception 'Assignee is not a workspace member'; end if;
  if v_assignee_user_id is not null and v_assignee_player_id is not null and not exists (
    select 1 from public.players p where p.id = v_assignee_player_id and p.tenant_id = v_tenant_id and p.linked_user_id = v_assignee_user_id
  ) then raise exception 'The primary player is not linked to the selected workspace member'; end if;
  if exists (
    select 1 from unnest(v_checkpoints) checkpoint_id
    where not exists (select 1 from public.scrims s where s.id = checkpoint_id and s.tenant_id = v_tenant_id)
  ) then raise exception 'Every checkpoint must belong to this workspace'; end if;
  if v_scrim_id is not null and not exists (select 1 from public.scrims s where s.id = v_scrim_id and s.tenant_id = v_tenant_id) then
    raise exception 'Source practice block does not belong to this workspace';
  end if;
  if v_scrim_game_id is not null and not exists (
    select 1 from public.scrim_games g join public.scrims s on s.id = g.scrim_id
    where g.id = v_scrim_game_id and s.tenant_id = v_tenant_id and (v_scrim_id is null or g.scrim_id = v_scrim_id)
  ) then raise exception 'Source game does not belong to this workspace'; end if;
  if v_feedback_id is not null and not exists (
    select 1 from public.coach_feedback f join public.scrim_games g on g.id = f.scrim_game_id join public.scrims s on s.id = g.scrim_id
    where f.id = v_feedback_id and s.tenant_id = v_tenant_id
  ) then raise exception 'Source feedback does not belong to this workspace'; end if;

  insert into public.coaching_actions (
    tenant_id, title, description, priority, scope_type, unit_label, category,
    participant_player_ids, checkpoint_scrim_ids, source_type, source_timestamp_seconds,
    source_note, pattern_label, owner_user_id, assignee_user_id, assignee_player_id,
    due_at, scrim_id, scrim_game_id, feedback_id, follow_up_scrim_id, created_by
  ) values (
    v_tenant_id, btrim(p_payload->>'title'), nullif(btrim(coalesce(p_payload->>'description','')), ''),
    coalesce(p_payload->>'priority','medium'), v_scope, nullif(btrim(coalesce(p_payload->>'unit_label','')), ''), v_category,
    v_participants, v_checkpoints, v_source_type, nullif(p_payload->>'source_timestamp_seconds','')::integer,
    nullif(btrim(coalesce(p_payload->>'source_note','')), ''), nullif(btrim(coalesce(p_payload->>'pattern_label','')), ''),
    v_user_id, v_assignee_user_id, v_assignee_player_id, nullif(p_payload->>'due_at','')::timestamptz,
    v_scrim_id, v_scrim_game_id, v_feedback_id, v_checkpoints[1], v_user_id
  ) returning * into v_action;

  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, next_status, note)
  values (v_tenant_id, v_action.id, v_user_id, 'created', v_action.status, v_action.source_note);
  return v_action;
end;
$$;

create or replace function public.check_in_coaching_action(
  p_action_id uuid,
  p_check_in text,
  p_note text default null
) returns public.coaching_actions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action public.coaching_actions;
  v_player_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;
  select * into v_action from public.coaching_actions where id = p_action_id and archived_at is null for update;
  if not found then raise exception 'Coaching action not found'; end if;
  if p_check_in not in ('practised','blocked','needs_clarification','ready_for_review') then raise exception 'Unsupported check-in'; end if;
  select id into v_player_id from public.players where tenant_id = v_action.tenant_id and linked_user_id = v_user_id and archived_at is null limit 1;
  if not public.user_has_tenant_role(v_action.tenant_id, array['owner','admin']::public.tenant_role[])
    and (v_player_id is null or not (v_player_id = any(v_action.participant_player_ids))) then
    raise exception 'A participating player or staff member is required';
  end if;
  if v_action.status in ('complete','dismissed') then raise exception 'Closed actions cannot receive a check-in'; end if;

  update public.coaching_actions set
    player_check_in = p_check_in,
    player_check_in_note = nullif(btrim(coalesce(p_note,'')), ''),
    player_checked_in_at = now(),
    status = case when p_check_in = 'ready_for_review' then 'ready_for_review' when status = 'assigned' then 'in_progress' else status end,
    ready_for_review_at = case when p_check_in = 'ready_for_review' then now() else ready_for_review_at end,
    completion_evidence = case when p_check_in = 'ready_for_review' and nullif(btrim(coalesce(p_note,'')), '') is not null then btrim(p_note) else completion_evidence end,
    updated_at = now()
  where id = p_action_id returning * into v_action;
  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, previous_status, next_status, note)
  values (v_action.tenant_id, v_action.id, v_user_id, 'submitted', null, v_action.status, concat(replace(p_check_in,'_',' '), case when nullif(btrim(coalesce(p_note,'')), '') is null then '' else ': ' || btrim(p_note) end));
  return v_action;
end;
$$;

create or replace function public.review_coaching_action(
  p_action_id uuid,
  p_outcome text,
  p_observation text,
  p_evidence text default null,
  p_next_action text default null
) returns public.coaching_actions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action public.coaching_actions;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;
  select * into v_action from public.coaching_actions where id = p_action_id and archived_at is null for update;
  if not found then raise exception 'Coaching action not found'; end if;
  if not public.user_has_tenant_role(v_action.tenant_id, array['owner','admin']::public.tenant_role[]) then raise exception 'Owner or admin access is required'; end if;
  if v_action.status <> 'ready_for_review' then raise exception 'Action must be ready for review'; end if;
  if p_outcome not in ('demonstrated','partially_demonstrated','not_observed','no_longer_relevant') then raise exception 'Unsupported review outcome'; end if;
  if char_length(btrim(coalesce(p_observation,''))) < 3 then raise exception 'A concise review observation is required'; end if;

  update public.coaching_actions set
    review_outcome = p_outcome,
    review_observation = btrim(p_observation),
    review_evidence = nullif(btrim(coalesce(p_evidence,'')), ''),
    review_next_action = nullif(btrim(coalesce(p_next_action,'')), ''),
    reviewed_at = now(), reviewed_by = v_user_id,
    status = 'complete', completed_at = now(), completed_by = v_user_id, updated_at = now()
  where id = p_action_id returning * into v_action;
  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, previous_status, next_status, note)
  values (v_action.tenant_id, v_action.id, v_user_id, 'completed', 'ready_for_review', 'complete', p_outcome || ': ' || btrim(p_observation));
  return v_action;
end;
$$;

create or replace function public.save_coaching_action_template(p_payload jsonb)
returns public.coaching_action_templates
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid := (p_payload->>'tenant_id')::uuid;
  v_template public.coaching_action_templates;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;
  if not public.user_has_tenant_role(v_tenant_id, array['owner','admin']::public.tenant_role[]) then raise exception 'Owner or admin access is required'; end if;
  if char_length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 160 then raise exception 'Template title is required'; end if;
  insert into public.coaching_action_templates (tenant_id, title, success_evidence, category, scope_type, unit_label, suggested_duration_days, review_prompt, created_by)
  values (v_tenant_id, btrim(p_payload->>'title'), nullif(btrim(coalesce(p_payload->>'success_evidence','')), ''),
    p_payload->>'category', coalesce(p_payload->>'scope_type','player'), nullif(btrim(coalesce(p_payload->>'unit_label','')), ''),
    nullif(p_payload->>'suggested_duration_days','')::integer, nullif(btrim(coalesce(p_payload->>'review_prompt','')), ''), v_user_id)
  returning * into v_template;
  return v_template;
end;
$$;

revoke all on function public.create_coaching_action_cycle(jsonb) from public, anon;
revoke all on function public.check_in_coaching_action(uuid,text,text) from public, anon;
revoke all on function public.review_coaching_action(uuid,text,text,text,text) from public, anon;
revoke all on function public.save_coaching_action_template(jsonb) from public, anon;
grant execute on function public.create_coaching_action_cycle(jsonb) to authenticated;
grant execute on function public.check_in_coaching_action(uuid,text,text) to authenticated;
grant execute on function public.review_coaching_action(uuid,text,text,text,text) to authenticated;
grant execute on function public.save_coaching_action_template(jsonb) to authenticated;

comment on table public.coaching_action_templates is 'Tenant-owned reusable coaching action definitions; no shared marketplace or generated content.';
comment on function public.create_coaching_action_cycle(jsonb) is 'Creates a tenant-validated action cycle with participants, source evidence, and practice checkpoints.';
comment on function public.review_coaching_action(uuid,text,text,text,text) is 'Closes an action with a factual staff review and optional next action, without calculating a score.';

notify pgrst, 'reload schema';
