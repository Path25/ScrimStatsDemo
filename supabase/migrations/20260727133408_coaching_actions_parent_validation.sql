-- Correct tenant validation for legacy child tables whose tenant ownership is
-- inherited through scrim_games -> scrims rather than a direct tenant_id.

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

revoke all on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) to authenticated;
notify pgrst, 'reload schema';
