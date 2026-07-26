-- Web dashboard launch completion.
-- Additive, tenant-scoped workflow data for coaching follow-through,
-- durable notifications, invitation delivery, recovery, and pilot operations.

alter table public.scrims
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

alter table public.team_invitations
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists delivery_error text,
  add column if not exists last_sent_at timestamptz,
  add column if not exists revoked_at timestamptz;

alter table public.team_invitations
  drop constraint if exists team_invitations_delivery_status_check;
alter table public.team_invitations
  add constraint team_invitations_delivery_status_check
  check (delivery_status in ('pending','sent','delivered','failed','accepted','revoked','expired'));

create table if not exists public.coaching_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scrim_id uuid references public.scrims(id) on delete set null,
  scrim_game_id uuid references public.scrim_games(id) on delete set null,
  feedback_id uuid references public.coach_feedback(id) on delete set null,
  follow_up_scrim_id uuid references public.scrims(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'assigned'
    check (status in ('assigned','acknowledged','in_progress','ready_for_review','complete','dismissed')),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  assignee_user_id uuid references auth.users(id) on delete set null,
  assignee_player_id uuid references public.players(id) on delete set null,
  due_at timestamptz,
  completion_evidence text,
  acknowledged_at timestamptz,
  ready_for_review_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint coaching_actions_assignee_check check (
    assignee_user_id is not null or assignee_player_id is not null
  )
);

create index if not exists coaching_actions_tenant_status_due_idx
  on public.coaching_actions (tenant_id, status, due_at nulls last)
  where archived_at is null;
create index if not exists coaching_actions_assignee_idx
  on public.coaching_actions (assignee_user_id, status, due_at)
  where archived_at is null;
create index if not exists coaching_actions_scrim_idx
  on public.coaching_actions (tenant_id, scrim_id, scrim_game_id);

create table if not exists public.coaching_action_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  action_id uuid not null references public.coaching_actions(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('created','updated','acknowledged','started','submitted','completed','reopened','dismissed','archived','restored')),
  previous_status text,
  next_status text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists coaching_action_events_action_idx
  on public.coaching_action_events (action_id, created_at desc);

create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('schedule','invitation','coaching_action','integration','system')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  href text,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (tenant_id, user_id, dedupe_key)
);
create index if not exists workspace_notifications_user_unread_idx
  on public.workspace_notifications (user_id, created_at desc)
  where read_at is null;

create table if not exists public.notification_preferences (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  schedule_enabled boolean not null default true,
  coaching_enabled boolean not null default true,
  integration_enabled boolean not null default true,
  reminder_24h boolean not null default true,
  reminder_2h boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  notification_id uuid references public.workspace_notifications(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  channel text not null check (channel in ('email','in_app')),
  template_key text not null,
  dedupe_key text not null,
  status text not null default 'pending' check (status in ('pending','processing','delivered','failed','cancelled')),
  attempts integer not null default 0 check (attempts between 0 and 10),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, channel, dedupe_key)
);
create index if not exists notification_deliveries_pending_idx
  on public.notification_deliveries (available_at, created_at)
  where status in ('pending','failed');

create table if not exists public.notification_reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scrim_id uuid references public.scrims(id) on delete cascade,
  coaching_action_id uuid references public.coaching_actions(id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('scrim_24h','scrim_2h','action_due','action_overdue')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','queued','sent','cancelled')),
  created_at timestamptz not null default now(),
  unique (user_id, reminder_kind, scrim_id, coaching_action_id)
);
create index if not exists notification_reminders_due_idx
  on public.notification_reminders (scheduled_for)
  where status = 'pending';

create table if not exists public.platform_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pilot_onboarding_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_key text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','complete','blocked','not_applicable')),
  note text,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (tenant_id, item_key)
);

create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  opened_by uuid references auth.users(id) on delete set null,
  assigned_operator_id uuid references auth.users(id) on delete set null,
  subject text not null check (char_length(btrim(subject)) between 1 and 160),
  description text not null,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','investigating','waiting_on_team','resolved','closed')),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists support_cases_status_idx
  on public.support_cases (status, priority, created_at);

create table if not exists public.operator_audit_events (
  id bigint generated always as identity primary key,
  operator_id uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.tenants(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists operator_audit_events_created_idx
  on public.operator_audit_events (created_at desc);

alter table public.coaching_actions enable row level security;
alter table public.coaching_action_events enable row level security;
alter table public.workspace_notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_reminders enable row level security;
alter table public.platform_operators enable row level security;
alter table public.pilot_onboarding_items enable row level security;
alter table public.support_cases enable row level security;
alter table public.operator_audit_events enable row level security;

create policy coaching_actions_member_read on public.coaching_actions
for select to authenticated using (public.user_belongs_to_tenant(tenant_id));
create policy coaching_actions_staff_insert on public.coaching_actions
for insert to authenticated with check (
  public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])
  and owner_user_id = (select auth.uid()) and created_by = (select auth.uid())
);
create policy coaching_actions_staff_update on public.coaching_actions
for update to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])
) with check (
  public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])
);
create policy coaching_actions_assignee_progress on public.coaching_actions
for update to authenticated using (
  assignee_user_id = (select auth.uid())
) with check (
  assignee_user_id = (select auth.uid())
  and status in ('acknowledged','in_progress','ready_for_review')
);

create policy coaching_action_events_member_read on public.coaching_action_events
for select to authenticated using (public.user_belongs_to_tenant(tenant_id));
create policy coaching_action_events_actor_insert on public.coaching_action_events
for insert to authenticated with check (
  actor_id = (select auth.uid())
  and exists (
    select 1 from public.coaching_actions action
    where action.id = action_id
      and action.tenant_id = coaching_action_events.tenant_id
      and (
        action.assignee_user_id = (select auth.uid())
        or public.user_has_tenant_role(action.tenant_id, array['owner','admin']::public.tenant_role[])
      )
  )
);

create policy workspace_notifications_own_read on public.workspace_notifications
for select to authenticated using (user_id = (select auth.uid()) and public.user_belongs_to_tenant(tenant_id));
create policy workspace_notifications_own_update on public.workspace_notifications
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy notification_preferences_own_read on public.notification_preferences
for select to authenticated using (user_id = (select auth.uid()) and public.user_belongs_to_tenant(tenant_id));
create policy notification_preferences_own_insert on public.notification_preferences
for insert to authenticated with check (user_id = (select auth.uid()) and public.user_belongs_to_tenant(tenant_id));
create policy notification_preferences_own_update on public.notification_preferences
for update to authenticated using (user_id = (select auth.uid()) and public.user_belongs_to_tenant(tenant_id))
with check (user_id = (select auth.uid()) and public.user_belongs_to_tenant(tenant_id));

create policy notification_deliveries_staff_read on public.notification_deliveries
for select to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])
);

create policy support_cases_tenant_read on public.support_cases
for select to authenticated using (tenant_id is not null and public.user_belongs_to_tenant(tenant_id));
create policy support_cases_tenant_insert on public.support_cases
for insert to authenticated with check (
  tenant_id is not null and public.user_belongs_to_tenant(tenant_id) and opened_by = (select auth.uid())
);

grant select, insert, update on public.coaching_actions to authenticated;
grant select, insert on public.coaching_action_events to authenticated;
grant select, update on public.workspace_notifications to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.notification_deliveries to authenticated;
grant select, insert on public.support_cases to authenticated;
grant all on public.coaching_actions, public.coaching_action_events,
  public.workspace_notifications, public.notification_preferences,
  public.notification_deliveries, public.notification_reminders,
  public.platform_operators, public.pilot_onboarding_items,
  public.support_cases, public.operator_audit_events to service_role;
grant usage, select on sequence public.coaching_action_events_id_seq,
  public.operator_audit_events_id_seq to service_role;
grant usage, select on sequence public.coaching_action_events_id_seq to authenticated;

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
security invoker
set search_path = public
as $$
declare v_action public.coaching_actions;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner','admin']::public.tenant_role[]) then
    raise exception 'Owner or admin access is required';
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
  insert into public.coaching_actions (
    tenant_id, title, description, priority, owner_user_id, assignee_user_id,
    assignee_player_id, due_at, scrim_id, scrim_game_id, feedback_id,
    follow_up_scrim_id, created_by
  ) values (
    p_tenant_id, btrim(p_title), nullif(btrim(p_description), ''), p_priority,
    (select auth.uid()), p_assignee_user_id, p_assignee_player_id, p_due_at,
    p_scrim_id, p_scrim_game_id, p_feedback_id, p_follow_up_scrim_id, (select auth.uid())
  ) returning * into v_action;
  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, next_status)
  values (p_tenant_id, v_action.id, (select auth.uid()), 'created', v_action.status);
  return v_action;
end;
$$;
revoke all on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.create_coaching_action(uuid,text,text,text,uuid,uuid,timestamptz,uuid,uuid,uuid,uuid) to authenticated;

create or replace function public.transition_coaching_action(
  p_action_id uuid,
  p_next_status text,
  p_note text default null
) returns public.coaching_actions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_action public.coaching_actions;
  v_previous text;
  v_is_staff boolean;
  v_is_assignee boolean;
begin
  select * into v_action from public.coaching_actions where id = p_action_id for update;
  if not found then raise exception 'Coaching action not found'; end if;
  v_is_staff := public.user_has_tenant_role(v_action.tenant_id, array['owner','admin']::public.tenant_role[]);
  v_is_assignee := v_action.assignee_user_id = (select auth.uid());
  if not v_is_staff and not v_is_assignee then raise exception 'Action access is required'; end if;
  if p_next_status not in ('assigned','acknowledged','in_progress','ready_for_review','complete','dismissed') then
    raise exception 'Unsupported coaching action status';
  end if;
  if not v_is_staff and p_next_status not in ('acknowledged','in_progress','ready_for_review') then
    raise exception 'Only staff can complete, reopen, or dismiss actions';
  end if;
  if p_next_status = 'ready_for_review' and nullif(btrim(p_note), '') is null then
    raise exception 'Completion evidence is required before review';
  end if;
  v_previous := v_action.status;
  update public.coaching_actions set
    status = p_next_status,
    completion_evidence = case when p_next_status = 'ready_for_review' then btrim(p_note) else completion_evidence end,
    acknowledged_at = case when p_next_status = 'acknowledged' then coalesce(acknowledged_at, now()) else acknowledged_at end,
    ready_for_review_at = case when p_next_status = 'ready_for_review' then now() when p_next_status in ('assigned','in_progress') then null else ready_for_review_at end,
    completed_at = case when p_next_status = 'complete' then now() when p_next_status <> 'complete' then null else completed_at end,
    completed_by = case when p_next_status = 'complete' then (select auth.uid()) when p_next_status <> 'complete' then null else completed_by end,
    updated_at = now()
  where id = p_action_id returning * into v_action;
  insert into public.coaching_action_events (tenant_id, action_id, actor_id, event_type, previous_status, next_status, note)
  values (
    v_action.tenant_id, v_action.id, (select auth.uid()),
    case p_next_status when 'acknowledged' then 'acknowledged' when 'in_progress' then 'started'
      when 'ready_for_review' then 'submitted' when 'complete' then 'completed'
      when 'dismissed' then 'dismissed' else 'reopened' end,
    v_previous, p_next_status, nullif(btrim(p_note), '')
  );
  return v_action;
end;
$$;
revoke all on function public.transition_coaching_action(uuid,text,text) from public, anon;
grant execute on function public.transition_coaching_action(uuid,text,text) to authenticated;

create or replace function public.archive_scrim_block(p_scrim_id uuid, p_restore boolean default false)
returns public.scrims
language plpgsql
security invoker
set search_path = public
as $$
declare v_scrim public.scrims;
begin
  select * into v_scrim from public.scrims where id = p_scrim_id for update;
  if not found then raise exception 'Scrim block not found'; end if;
  if not public.user_has_tenant_role(v_scrim.tenant_id, array['owner','admin']::public.tenant_role[]) then
    raise exception 'Owner or admin access is required';
  end if;
  update public.scrims set archived_at = case when p_restore then null else now() end,
    archived_by = case when p_restore then null else (select auth.uid()) end,
    updated_at = now()
  where id = p_scrim_id returning * into v_scrim;
  return v_scrim;
end;
$$;
revoke all on function public.archive_scrim_block(uuid,boolean) from public, anon;
grant execute on function public.archive_scrim_block(uuid,boolean) to authenticated;

comment on table public.coaching_actions is 'Tenant-scoped coaching follow-through linked to review evidence and future practice.';
comment on table public.workspace_notifications is 'Idempotent in-app notification inbox. Email delivery is processed server-side.';
comment on table public.platform_operators is 'Private allowlist for cross-tenant managed-pilot operations; service access only.';
