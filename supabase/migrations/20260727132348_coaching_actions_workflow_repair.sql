-- Restore the coaching-action RPC boundary after direct table mutations were revoked.
-- These functions intentionally run as their owner, but expose only a narrow,
-- tenant-authorized workflow to authenticated users.

create or replace function public.create_coaching_action(
  p_tenant_id uuid,
  p_title text,
  p_description text,
  p_priority text,
  p_assignee_user_id uuid,
  p_assignee_player_id uuid,
  p_due_at timestamptz,
  p_scrim_id uuid default null,
  p_scrim_game_id uuid default null,
  p_feedback_id uuid default null,
  p_follow_up_scrim_id uuid default null
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
  if not public.user_has_tenant_role(p_tenant_id, array['owner','admin']::public.tenant_role[]) then
    raise exception 'Owner or admin access is required';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 160 then
    raise exception 'Action title must contain between 1 and 160 characters';
  end if;
  if p_priority not in ('low','medium','high') then raise exception 'Unsupported priority'; end if;
  if p_assignee_user_id is null and p_assignee_player_id is null then raise exception 'An assignee is required'; end if;
  if p_assignee_user_id is not null and not exists (
    select 1 from public.tenant_users member
    where member.tenant_id = p_tenant_id and member.user_id = p_assignee_user_id
  ) then raise exception 'Assignee is not a workspace member'; end if;
  if p_assignee_player_id is not null and not exists (
    select 1 from public.players player
    where player.tenant_id = p_tenant_id and player.id = p_assignee_player_id and player.archived_at is null
  ) then raise exception 'Assignee is not an active roster player'; end if;
  if p_assignee_user_id is not null and p_assignee_player_id is not null and not exists (
    select 1 from public.players player
    where player.id = p_assignee_player_id
      and player.tenant_id = p_tenant_id
      and player.linked_user_id = p_assignee_user_id
  ) then raise exception 'The roster player is not linked to the selected workspace member'; end if;
  if p_scrim_id is not null and not exists (
    select 1 from public.scrims scrim where scrim.id = p_scrim_id and scrim.tenant_id = p_tenant_id
  ) then raise exception 'Practice block does not belong to this workspace'; end if;
  if p_scrim_game_id is not null and not exists (
    select 1 from public.scrim_games game
    join public.scrims scrim on scrim.id = game.scrim_id
    where game.id = p_scrim_game_id and scrim.tenant_id = p_tenant_id
      and (p_scrim_id is null or game.scrim_id = p_scrim_id)
  ) then raise exception 'Game does not belong to this practice block'; end if;
  if p_follow_up_scrim_id is not null and not exists (
    select 1 from public.scrims scrim where scrim.id = p_follow_up_scrim_id and scrim.tenant_id = p_tenant_id
  ) then raise exception 'Follow-up practice does not belong to this workspace'; end if;
  if p_feedback_id is not null and not exists (
    select 1 from public.coach_feedback feedback
    join public.scrim_games game on game.id = feedback.scrim_game_id
    join public.scrims scrim on scrim.id = game.scrim_id
    where feedback.id = p_feedback_id and scrim.tenant_id = p_tenant_id
  ) then raise exception 'Review feedback does not belong to this workspace'; end if;

  insert into public.coaching_actions (
    tenant_id, title, description, priority, owner_user_id, assignee_user_id,
    assignee_player_id, due_at, scrim_id, scrim_game_id, feedback_id,
    follow_up_scrim_id, created_by
  ) values (
    p_tenant_id, btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), p_priority,
    v_user_id, p_assignee_user_id, p_assignee_player_id, p_due_at,
    p_scrim_id, p_scrim_game_id, p_feedback_id, p_follow_up_scrim_id, v_user_id
  ) returning * into v_action;

  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, next_status)
  values (p_tenant_id, v_action.id, v_user_id, 'created', v_action.status);
  return v_action;
end;
$$;

create or replace function public.transition_coaching_action(
  p_action_id uuid,
  p_next_status text,
  p_note text default null
) returns public.coaching_actions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action public.coaching_actions;
  v_previous text;
  v_is_staff boolean;
  v_is_assignee boolean;
  v_event_type text;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;
  select * into v_action from public.coaching_actions where id = p_action_id for update;
  if not found or v_action.archived_at is not null then raise exception 'Coaching action not found'; end if;

  v_is_staff := public.user_has_tenant_role(v_action.tenant_id, array['owner','admin']::public.tenant_role[]);
  v_is_assignee := v_action.assignee_user_id = v_user_id;
  if not v_is_staff and not v_is_assignee then raise exception 'Action access is required'; end if;
  if p_next_status not in ('assigned','acknowledged','in_progress','ready_for_review','complete','dismissed') then
    raise exception 'Unsupported coaching action status';
  end if;
  if p_next_status = v_action.status then return v_action; end if;

  if v_is_staff then
    if not (
      (v_action.status = 'assigned' and p_next_status in ('acknowledged','in_progress','dismissed')) or
      (v_action.status = 'acknowledged' and p_next_status in ('in_progress','ready_for_review','dismissed')) or
      (v_action.status = 'in_progress' and p_next_status in ('ready_for_review','dismissed')) or
      (v_action.status = 'ready_for_review' and p_next_status in ('in_progress','complete','dismissed')) or
      (v_action.status in ('complete','dismissed') and p_next_status = 'assigned')
    ) then raise exception 'That action transition is not allowed'; end if;
  else
    if not (
      (v_action.status = 'assigned' and p_next_status in ('acknowledged','in_progress')) or
      (v_action.status = 'acknowledged' and p_next_status in ('in_progress','ready_for_review')) or
      (v_action.status = 'in_progress' and p_next_status = 'ready_for_review')
    ) then raise exception 'That assignee transition is not allowed'; end if;
  end if;

  if p_next_status = 'ready_for_review' and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'Completion evidence is required before review';
  end if;

  v_previous := v_action.status;
  update public.coaching_actions set
    status = p_next_status,
    completion_evidence = case
      when p_next_status = 'ready_for_review' then btrim(p_note)
      when p_next_status = 'assigned' then null
      else completion_evidence
    end,
    acknowledged_at = case when p_next_status = 'acknowledged' then coalesce(acknowledged_at, now()) when p_next_status = 'assigned' then null else acknowledged_at end,
    ready_for_review_at = case when p_next_status = 'ready_for_review' then now() when p_next_status in ('assigned','in_progress') then null else ready_for_review_at end,
    completed_at = case when p_next_status = 'complete' then now() when p_next_status <> 'complete' then null else completed_at end,
    completed_by = case when p_next_status = 'complete' then v_user_id when p_next_status <> 'complete' then null else completed_by end,
    updated_at = now()
  where id = p_action_id
  returning * into v_action;

  v_event_type := case p_next_status
    when 'acknowledged' then 'acknowledged'
    when 'in_progress' then 'started'
    when 'ready_for_review' then 'submitted'
    when 'complete' then 'completed'
    when 'dismissed' then 'dismissed'
    else 'reopened'
  end;
  insert into public.coaching_action_events (
    tenant_id, action_id, actor_id, event_type, previous_status, next_status, note
  ) values (
    v_action.tenant_id, v_action.id, v_user_id, v_event_type,
    v_previous, p_next_status, nullif(btrim(coalesce(p_note, '')), '')
  );
  return v_action;
end;
$$;

revoke insert, update, delete on public.coaching_actions from authenticated;
revoke insert, update, delete on public.coaching_action_events from authenticated;
revoke all on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) from public, anon;
revoke all on function public.transition_coaching_action(uuid,text,text) from public, anon;
grant execute on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.transition_coaching_action(uuid,text,text) to authenticated;

comment on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) is
  'Creates a tenant-consistent coaching action for owner/admin users through an explicitly authorized RPC.';
comment on function public.transition_coaching_action(uuid,text,text) is
  'Applies the coaching action state machine for the linked assignee or tenant staff and records an immutable event.';

notify pgrst, 'reload schema';
