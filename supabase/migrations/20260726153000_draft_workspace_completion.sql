-- Complete the tenant-safe Draft workspace while preserving preparation data.

create table if not exists public.draft_playbooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 140),
  description text not null default '',
  patch_label text,
  preferred_side text not null default 'either' check (preferred_side in ('blue', 'red', 'either')),
  composition_identity text,
  priorities jsonb not null default '[]'::jsonb check (jsonb_typeof(priorities) = 'array'),
  role_assignments jsonb not null default '{}'::jsonb check (jsonb_typeof(role_assignments) = 'object'),
  flex_picks jsonb not null default '[]'::jsonb check (jsonb_typeof(flex_picks) = 'array'),
  execution_goals jsonb not null default '[]'::jsonb check (jsonb_typeof(execution_goals) = 'array'),
  vulnerabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(vulnerabilities) = 'array'),
  contingency_notes text not null default '',
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  revision integer not null default 1 check (revision >= 1),
  parent_playbook_id uuid references public.draft_playbooks(id) on delete set null,
  snapshot jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint draft_playbooks_publish_consistency check (
    status <> 'published' or (published_at is not null and snapshot is not null)
  )
);

create unique index if not exists draft_playbooks_id_tenant_unique
  on public.draft_playbooks(id, tenant_id);
create index if not exists draft_playbooks_tenant_status_updated_idx
  on public.draft_playbooks(tenant_id, status, updated_at desc);

alter table public.preparation_briefs
  add column if not exists draft_format text not null default 'standard'
    check (draft_format in ('standard', 'series_restricted')),
  add column if not exists series_game_number smallint not null default 1
    check (series_game_number between 1 and 9),
  add column if not exists preferred_side text not null default 'either'
    check (preferred_side in ('blue', 'red', 'either')),
  add column if not exists source_playbook_id uuid,
  add column if not exists published_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;

alter table public.preparation_briefs
  drop constraint if exists preparation_briefs_source_playbook_tenant_fkey,
  add constraint preparation_briefs_source_playbook_tenant_fkey
    foreign key (source_playbook_id, tenant_id)
    references public.draft_playbooks(id, tenant_id) on delete set null;

alter table public.draft_scenarios
  alter column brief_id drop not null,
  add column if not exists playbook_id uuid,
  add column if not exists branch_sequence smallint check (branch_sequence between 1 and 20);

alter table public.draft_scenarios
  drop constraint if exists draft_scenarios_playbook_tenant_fkey,
  add constraint draft_scenarios_playbook_tenant_fkey
    foreign key (playbook_id, tenant_id)
    references public.draft_playbooks(id, tenant_id) on delete cascade,
  drop constraint if exists draft_scenarios_single_owner_check,
  add constraint draft_scenarios_single_owner_check
    check ((brief_id is not null)::integer + (playbook_id is not null)::integer = 1);

create index if not exists draft_scenarios_playbook_idx
  on public.draft_scenarios(tenant_id, playbook_id, updated_at desc)
  where playbook_id is not null;

create table if not exists public.draft_plan_restrictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brief_id uuid not null,
  champion_name text not null check (char_length(trim(champion_name)) between 1 and 80),
  source_game_number smallint check (source_game_number between 1 and 9),
  reason text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint draft_plan_restrictions_brief_tenant_fkey
    foreign key (brief_id, tenant_id)
    references public.preparation_briefs(id, tenant_id) on delete cascade,
  unique (brief_id, champion_name)
);

create index if not exists draft_plan_restrictions_tenant_brief_idx
  on public.draft_plan_restrictions(tenant_id, brief_id);

create table if not exists public.draft_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null check (entity_type in ('match_plan', 'playbook', 'scenario')),
  entity_id uuid not null,
  action text not null check (action in ('created', 'updated', 'published', 'revised', 'archived', 'restored', 'branched')),
  actor_id uuid not null references auth.users(id) on delete restrict,
  material_changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists draft_audit_events_tenant_entity_idx
  on public.draft_audit_events(tenant_id, entity_type, entity_id, created_at desc);

alter table public.draft_playbooks enable row level security;
alter table public.draft_plan_restrictions enable row level security;
alter table public.draft_audit_events enable row level security;

revoke all on table public.draft_playbooks, public.draft_plan_restrictions, public.draft_audit_events
  from public, anon, authenticated;
grant select, insert, update, delete on table public.draft_playbooks, public.draft_plan_restrictions
  to authenticated;
grant select, insert on table public.draft_audit_events to authenticated;
grant select, insert, update, delete on table public.draft_playbooks, public.draft_plan_restrictions, public.draft_audit_events
  to service_role;

drop policy if exists draft_playbooks_select on public.draft_playbooks;
create policy draft_playbooks_select on public.draft_playbooks
for select to authenticated using (
  public.user_belongs_to_tenant(tenant_id)
  and (
    status = 'published'
    or public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
  )
);

drop policy if exists draft_playbooks_insert_staff on public.draft_playbooks;
create policy draft_playbooks_insert_staff on public.draft_playbooks
for insert to authenticated with check (
  status = 'draft'
  and created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_playbooks_update_staff on public.draft_playbooks;
create policy draft_playbooks_update_staff on public.draft_playbooks
for update to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
) with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_playbooks_delete_staff on public.draft_playbooks;
create policy draft_playbooks_delete_staff on public.draft_playbooks
for delete to authenticated using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_restrictions_select on public.draft_plan_restrictions;
create policy draft_restrictions_select on public.draft_plan_restrictions
for select to authenticated using (
  public.user_belongs_to_tenant(tenant_id)
  and exists (
    select 1 from public.preparation_briefs brief
    where brief.id = draft_plan_restrictions.brief_id
      and brief.tenant_id = draft_plan_restrictions.tenant_id
      and (
        brief.status = 'published'
        or public.user_has_tenant_role(brief.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
      )
  )
);

drop policy if exists draft_restrictions_insert_staff on public.draft_plan_restrictions;
create policy draft_restrictions_insert_staff on public.draft_plan_restrictions
for insert to authenticated with check (
  created_by = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
  and exists (
    select 1 from public.preparation_briefs brief
    where brief.id = draft_plan_restrictions.brief_id
      and brief.tenant_id = draft_plan_restrictions.tenant_id
      and brief.status = 'draft'
  )
);

drop policy if exists draft_restrictions_update_staff on public.draft_plan_restrictions;
create policy draft_restrictions_update_staff on public.draft_plan_restrictions
for update to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
) with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_restrictions_delete_staff on public.draft_plan_restrictions;
create policy draft_restrictions_delete_staff on public.draft_plan_restrictions
for delete to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_audit_select on public.draft_audit_events;
create policy draft_audit_select on public.draft_audit_events
for select to authenticated using (
  public.user_belongs_to_tenant(tenant_id)
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_audit_insert_staff on public.draft_audit_events;
create policy draft_audit_insert_staff on public.draft_audit_events
for insert to authenticated with check (
  actor_id = (select auth.uid())
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

-- Extend scenario visibility to playbooks while retaining published-only roster access.
drop policy if exists "Tenant members read allowed draft scenarios" on public.draft_scenarios;
drop policy if exists "Staff create draft scenarios" on public.draft_scenarios;
drop policy if exists "Staff update draft scenarios" on public.draft_scenarios;
drop policy if exists "Staff delete draft scenarios" on public.draft_scenarios;
drop policy if exists draft_scenarios_select on public.draft_scenarios;
create policy draft_scenarios_select on public.draft_scenarios
for select to authenticated using (
  public.user_belongs_to_tenant(tenant_id)
  and (
    public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
    or exists (
      select 1 from public.preparation_briefs brief
      where brief.id = draft_scenarios.brief_id
        and brief.tenant_id = draft_scenarios.tenant_id
        and brief.status = 'published'
        and draft_scenarios.status = 'published'
    )
    or exists (
      select 1 from public.draft_playbooks playbook
      where playbook.id = draft_scenarios.playbook_id
        and playbook.tenant_id = draft_scenarios.tenant_id
        and playbook.status = 'published'
        and draft_scenarios.status = 'published'
    )
  )
);

drop policy if exists draft_scenarios_insert_staff on public.draft_scenarios;
create policy draft_scenarios_insert_staff on public.draft_scenarios
for insert to authenticated with check (
  created_by = (select auth.uid())
  and status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_scenarios_update_staff on public.draft_scenarios;
create policy draft_scenarios_update_staff on public.draft_scenarios
for update to authenticated using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
) with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists draft_scenarios_delete_staff on public.draft_scenarios;
create policy draft_scenarios_delete_staff on public.draft_scenarios
for delete to authenticated using (
  status = 'draft'
  and public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

drop policy if exists "Tenant members read allowed draft actions" on public.draft_scenario_actions;
drop policy if exists "Staff create draft actions" on public.draft_scenario_actions;
drop policy if exists "Staff update draft actions" on public.draft_scenario_actions;
drop policy if exists "Staff delete draft actions" on public.draft_scenario_actions;
drop policy if exists draft_actions_select on public.draft_scenario_actions;
create policy draft_actions_select on public.draft_scenario_actions
for select to authenticated using (
  public.user_belongs_to_tenant(tenant_id)
  and exists (
    select 1 from public.draft_scenarios scenario
    where scenario.id = draft_scenario_actions.scenario_id
      and scenario.tenant_id = draft_scenario_actions.tenant_id
      and (
        public.user_has_tenant_role(scenario.tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
        or scenario.status = 'published'
      )
  )
);

drop policy if exists draft_actions_insert_staff on public.draft_scenario_actions;
create policy draft_actions_insert_staff on public.draft_scenario_actions
for insert to authenticated with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
drop policy if exists draft_actions_update_staff on public.draft_scenario_actions;
create policy draft_actions_update_staff on public.draft_scenario_actions
for update to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
) with check (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);
drop policy if exists draft_actions_delete_staff on public.draft_scenario_actions;
create policy draft_actions_delete_staff on public.draft_scenario_actions
for delete to authenticated using (
  public.user_has_tenant_role(tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role])
);

create or replace function public.draft_sequence_slot(p_sequence smallint, p_our_side text)
returns jsonb language sql immutable set search_path = '' as $$
  select case when p_sequence between 1 and 20 and p_our_side in ('blue', 'red') then
    jsonb_build_object(
      'action_type', case when p_sequence between 1 and 6 or p_sequence between 13 and 16 then 'ban' else 'pick' end,
      'phase', case when p_sequence between 1 and 6 then 'ban_1' when p_sequence between 7 and 12 then 'pick_1' when p_sequence between 13 and 16 then 'ban_2' else 'pick_2' end,
      'colour', (array['blue','red','blue','red','blue','red','blue','red','red','blue','blue','red','red','blue','red','blue','red','blue','blue','red'])[p_sequence],
      'team_side', case when (array['blue','red','blue','red','blue','red','blue','red','red','blue','blue','red','red','blue','red','blue','red','blue','blue','red'])[p_sequence] = p_our_side then 'ours' else 'opponent' end
    )
  else null end;
$$;
revoke all on function public.draft_sequence_slot(smallint, text) from public, anon, authenticated;
grant execute on function public.draft_sequence_slot(smallint, text) to authenticated, service_role;

create or replace function public.create_draft_playbook(
  p_tenant_id uuid, p_title text, p_description text default '', p_patch_label text default null,
  p_preferred_side text default 'either', p_composition_identity text default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then
    raise exception 'Owner or admin access is required';
  end if;
  if nullif(trim(p_title), '') is null then raise exception 'A playbook title is required'; end if;
  if p_preferred_side not in ('blue','red','either') then raise exception 'Preferred side must be blue, red, or either'; end if;
  insert into public.draft_playbooks (tenant_id,title,description,patch_label,preferred_side,composition_identity,created_by)
  values (p_tenant_id,trim(p_title),trim(coalesce(p_description,'')),nullif(trim(coalesce(p_patch_label,'')),''),p_preferred_side,nullif(trim(coalesce(p_composition_identity,'')),''),(select auth.uid()))
  returning id into v_id;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id)
  values (p_tenant_id,'playbook',v_id,'created',(select auth.uid()));
  return v_id;
end; $$;

create or replace function public.create_draft_match_plan(
  p_tenant_id uuid, p_opponent_team_id uuid, p_title text, p_scrim_id uuid default null,
  p_scheduled_for timestamptz default null, p_patch_label text default null,
  p_preferred_side text default 'either', p_series_game_number smallint default 1,
  p_source_playbook_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_old uuid; v_new uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  if nullif(trim(p_title), '') is null then raise exception 'A match plan title is required'; end if;
  if not exists (select 1 from public.opponent_teams where id=p_opponent_team_id and tenant_id=p_tenant_id) then raise exception 'The opponent does not belong to this workspace'; end if;
  if p_scrim_id is not null and not exists (select 1 from public.scrims where id=p_scrim_id and tenant_id=p_tenant_id) then raise exception 'The fixture does not belong to this workspace'; end if;
  if p_source_playbook_id is not null and not exists (select 1 from public.draft_playbooks where id=p_source_playbook_id and tenant_id=p_tenant_id) then raise exception 'The playbook does not belong to this workspace'; end if;
  insert into public.preparation_briefs (tenant_id,opponent_team_id,scrim_id,title,scheduled_for,patch_label,preferred_side,series_game_number,draft_format,source_playbook_id,created_by)
  values (p_tenant_id,p_opponent_team_id,p_scrim_id,trim(p_title),p_scheduled_for,nullif(trim(coalesce(p_patch_label,'')),''),p_preferred_side,p_series_game_number,case when p_series_game_number>1 then 'series_restricted' else 'standard' end,p_source_playbook_id,(select auth.uid())) returning id into v_id;
  if p_source_playbook_id is not null then
    for v_old in select id from public.draft_scenarios where playbook_id=p_source_playbook_id and tenant_id=p_tenant_id and parent_scenario_id is null order by created_at loop
      insert into public.draft_scenarios (tenant_id,brief_id,name,side,rationale,contingency_notes,status,created_by)
      select p_tenant_id,v_id,name,case when side='either' then coalesce(nullif(p_preferred_side,'either'),'blue') else side end,rationale,contingency_notes,'draft',(select auth.uid()) from public.draft_scenarios where id=v_old returning id into v_new;
      insert into public.draft_scenario_actions (tenant_id,scenario_id,sequence_number,phase,team_side,action_type,champion_name,assigned_role,rationale)
      select p_tenant_id,v_new,sequence_number,phase,team_side,action_type,champion_name,assigned_role,rationale from public.draft_scenario_actions where scenario_id=v_old order by sequence_number;
    end loop;
  end if;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id,material_changes)
  values (p_tenant_id,'match_plan',v_id,'created',(select auth.uid()),jsonb_build_object('source_playbook_id',p_source_playbook_id));
  return v_id;
end; $$;

create or replace function public.create_draft_scenario(
  p_tenant_id uuid, p_brief_id uuid default null, p_playbook_id uuid default null,
  p_name text default 'Primary line', p_side text default 'blue', p_rationale text default '',
  p_parent_scenario_id uuid default null, p_branch_sequence smallint default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  if (p_brief_id is null) = (p_playbook_id is null) then raise exception 'Choose exactly one match plan or playbook'; end if;
  if p_side not in ('blue','red') then raise exception 'A scenario must use blue or red side'; end if;
  if p_parent_scenario_id is not null and (p_branch_sequence is null or p_branch_sequence not between 1 and 20) then raise exception 'A branch point from 1 to 20 is required'; end if;
  insert into public.draft_scenarios (tenant_id,brief_id,playbook_id,parent_scenario_id,branch_sequence,name,side,rationale,created_by)
  values (p_tenant_id,p_brief_id,p_playbook_id,p_parent_scenario_id,p_branch_sequence,trim(p_name),p_side,trim(coalesce(p_rationale,'')),(select auth.uid())) returning id into v_id;
  if p_parent_scenario_id is not null then
    insert into public.draft_scenario_actions (tenant_id,scenario_id,sequence_number,phase,team_side,action_type,champion_name,assigned_role,rationale)
    select p_tenant_id,v_id,sequence_number,phase,team_side,action_type,champion_name,assigned_role,rationale
    from public.draft_scenario_actions where scenario_id=p_parent_scenario_id and sequence_number < p_branch_sequence order by sequence_number;
  end if;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id,material_changes)
  values (p_tenant_id,'scenario',v_id,case when p_parent_scenario_id is null then 'created' else 'branched' end,(select auth.uid()),jsonb_build_object('parent_scenario_id',p_parent_scenario_id,'branch_sequence',p_branch_sequence));
  return v_id;
end; $$;

create or replace function public.save_draft_sequence_action(
  p_tenant_id uuid, p_scenario_id uuid, p_sequence smallint, p_champion_name text,
  p_assigned_role text default null, p_rationale text default ''
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_scenario public.draft_scenarios%rowtype; v_slot jsonb; v_id uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  select * into v_scenario from public.draft_scenarios where id=p_scenario_id and tenant_id=p_tenant_id and status='draft';
  if not found then raise exception 'An editable scenario is required'; end if;
  v_slot := public.draft_sequence_slot(p_sequence,v_scenario.side);
  if v_slot is null then raise exception 'Draft sequence must be between 1 and 20'; end if;
  if nullif(trim(p_champion_name),'') is null then raise exception 'A champion is required'; end if;
  if (v_slot->>'action_type')='ban' and p_assigned_role is not null then raise exception 'Bans cannot have a role assignment'; end if;
  if v_scenario.brief_id is not null and exists (
    select 1 from public.draft_plan_restrictions r where r.brief_id=v_scenario.brief_id and lower(trim(r.champion_name))=lower(trim(p_champion_name))
  ) then raise exception 'That champion is unavailable for this series game'; end if;
  insert into public.draft_scenario_actions (tenant_id,scenario_id,sequence_number,phase,team_side,action_type,champion_name,assigned_role,rationale)
  values (p_tenant_id,p_scenario_id,p_sequence,v_slot->>'phase',v_slot->>'team_side',v_slot->>'action_type',trim(p_champion_name),p_assigned_role,trim(coalesce(p_rationale,'')))
  on conflict (scenario_id,sequence_number) do update set phase=excluded.phase,team_side=excluded.team_side,action_type=excluded.action_type,champion_name=excluded.champion_name,assigned_role=excluded.assigned_role,rationale=excluded.rationale
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.set_draft_plan_restrictions(p_brief_id uuid, p_champions text[])
returns void language plpgsql security invoker set search_path = '' as $$
declare v_brief public.preparation_briefs%rowtype;
begin
  select * into v_brief from public.preparation_briefs where id=p_brief_id and status='draft';
  if not found then raise exception 'An editable match plan is required'; end if;
  if not public.user_has_tenant_role(v_brief.tenant_id,array['owner'::public.tenant_role,'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  delete from public.draft_plan_restrictions where brief_id=p_brief_id;
  insert into public.draft_plan_restrictions (tenant_id,brief_id,champion_name,source_game_number,reason,created_by)
  select v_brief.tenant_id,p_brief_id,trim(champion),greatest(1,v_brief.series_game_number-1),'Unavailable from an earlier series game',(select auth.uid())
  from unnest(coalesce(p_champions,'{}'::text[])) champion where nullif(trim(champion),'') is not null;
end; $$;

create or replace function public.set_draft_item_status(p_kind text, p_id uuid, p_status text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_tenant uuid; v_snapshot jsonb; v_missing text[];
begin
  if p_kind='playbook' then select tenant_id into v_tenant from public.draft_playbooks where id=p_id; else select tenant_id into v_tenant from public.preparation_briefs where id=p_id; end if;
  if v_tenant is null then raise exception 'Draft item was not found'; end if;
  if not public.user_has_tenant_role(v_tenant,array['owner'::public.tenant_role,'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  if p_status not in ('published','archived','draft') then raise exception 'Unsupported draft status'; end if;
  if p_status='published' then
    select array_agg(format('%s: %s actions, %s assigned roles',s.name,count(a.id),count(distinct a.assigned_role) filter (where a.team_side='ours' and a.action_type='pick')))
    into v_missing from public.draft_scenarios s left join public.draft_scenario_actions a on a.scenario_id=s.id
    where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id and s.status='draft'
    group by s.id,s.name having count(a.id)<>20 or count(distinct a.assigned_role) filter (where a.team_side='ours' and a.action_type='pick')<>5;
    if v_missing is not null then raise exception 'Complete every scenario before publishing: %',array_to_string(v_missing,'; '); end if;
    if not exists (select 1 from public.draft_scenarios s where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id) then raise exception 'At least one complete scenario is required'; end if;
    select jsonb_build_object('scenarios',coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'side',s.side,'parent_scenario_id',s.parent_scenario_id,'branch_sequence',s.branch_sequence,'rationale',s.rationale,'contingency_notes',s.contingency_notes,'actions',(select coalesce(jsonb_agg(to_jsonb(a) order by a.sequence_number),'[]'::jsonb) from public.draft_scenario_actions a where a.scenario_id=s.id)) order by s.created_at),'[]'::jsonb),'published_at',now())
    into v_snapshot from public.draft_scenarios s where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id;
    update public.draft_scenarios set status='published',updated_at=now() where (case when p_kind='playbook' then playbook_id else brief_id end)=p_id;
  end if;
  if p_kind='playbook' then
    update public.draft_playbooks set status=p_status,snapshot=case when p_status='published' then v_snapshot else snapshot end,published_at=case when p_status='published' then now() else published_at end,published_by=case when p_status='published' then (select auth.uid()) else published_by end,archived_at=case when p_status='archived' then now() when p_status='draft' then null else archived_at end,updated_at=now() where id=p_id;
  elsif p_kind='match_plan' then
    update public.preparation_briefs set status=p_status,snapshot=case when p_status='published' then coalesce(snapshot,'{}'::jsonb)||v_snapshot else snapshot end,published_at=case when p_status='published' then now() else published_at end,published_by=case when p_status='published' then (select auth.uid()) else published_by end,archived_at=case when p_status='archived' then now() when p_status='draft' then null else archived_at end,updated_at=now() where id=p_id;
  else raise exception 'Draft item type must be match_plan or playbook'; end if;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id)
  values (v_tenant,p_kind,p_id,case p_status when 'published' then 'published' when 'archived' then 'archived' else 'restored' end,(select auth.uid()));
  return p_id;
end; $$;

create or replace function public.get_draft_workspace(p_tenant_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select case when not public.user_belongs_to_tenant(p_tenant_id) then null else jsonb_build_object(
    'contract_version','draft-workspace-v1',
    'playbooks',coalesce((select jsonb_agg(to_jsonb(p) order by p.updated_at desc) from public.draft_playbooks p where p.tenant_id=p_tenant_id),'[]'::jsonb),
    'plans',coalesce((select jsonb_agg(to_jsonb(b) order by b.updated_at desc) from public.preparation_briefs b where b.tenant_id=p_tenant_id),'[]'::jsonb),
    'scenarios',coalesce((select jsonb_agg(to_jsonb(s) order by s.updated_at desc) from public.draft_scenarios s where s.tenant_id=p_tenant_id),'[]'::jsonb),
    'actions',coalesce((select jsonb_agg(to_jsonb(a) order by a.sequence_number) from public.draft_scenario_actions a where a.tenant_id=p_tenant_id),'[]'::jsonb),
    'restrictions',coalesce((select jsonb_agg(to_jsonb(r) order by r.champion_name) from public.draft_plan_restrictions r where r.tenant_id=p_tenant_id),'[]'::jsonb),
    'opponents',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) order by o.name) from public.opponent_teams o where o.tenant_id=p_tenant_id),'[]'::jsonb),
    'fixtures',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'opponent_name',s.opponent_name,'opponent_team_id',s.opponent_team_id,'starts_at',s.starts_at,'format',s.format) order by s.starts_at) from public.scrims s where s.tenant_id=p_tenant_id and s.starts_at>=now() and coalesce(s.status,'scheduled') not in ('cancelled','completed') limit 20),'[]'::jsonb),
    'external_drafts',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'opponent_team_id',d.opponent_team_id,'blue_team',d.blue_team,'red_team',d.red_team,'blue_picks',d.blue_picks,'red_picks',d.red_picks,'blue_bans',d.blue_bans,'red_bans',d.red_bans,'patch',d.patch,'played_at',d.played_at,'source_url',d.source_url) order by d.played_at desc nulls last) from (select * from public.opponent_external_draft_games x where x.tenant_id=p_tenant_id order by x.played_at desc nulls last limit 100) d),'[]'::jsonb),
    'team_drafts',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'scrim_game_id',d.scrim_game_id,'draft_data',d.draft_data,'completed_at',d.completed_at,'opponent_name',s.opponent_name,'played_at',coalesce(g.game_start_time,s.starts_at)) order by coalesce(g.game_start_time,s.starts_at) desc nulls last) from public.game_drafts d join public.scrim_games g on g.id=d.scrim_game_id join public.scrims s on s.id=g.scrim_id where s.tenant_id=p_tenant_id limit 100),'[]'::jsonb),
    'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.summoner_name,'role',p.role,'linked_user_id',p.linked_user_id,'main_champions',p.main_champions) order by p.role,p.summoner_name) from public.players p where p.tenant_id=p_tenant_id and coalesce(p.is_active,true) and p.archived_at is null),'[]'::jsonb),
    'champion_pools',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'player_id',c.player_id,'champion_name',c.champion_name,'role',c.role,'comfort_level',c.comfort_level,'priority',c.priority,'games_played',c.games_played,'win_rate',c.win_rate)) from public.champion_pools c join public.players p on p.id=c.player_id where p.tenant_id=p_tenant_id),'[]'::jsonb),
    'scouting_evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'opponent_team_id',e.opponent_team_id,'title',e.title,'observation',e.observation,'evidence_type',e.evidence_type,'confidence',e.confidence,'observed_at',e.observed_at) order by e.observed_at desc) from (select * from public.scouting_evidence x where x.tenant_id=p_tenant_id and x.lifecycle_state='active' order by x.observed_at desc limit 100) e),'[]'::jsonb),
    'linked_player_id',(select p.id from public.players p where p.tenant_id=p_tenant_id and p.linked_user_id=(select auth.uid()) limit 1)
  ) end;
$$;

do $$
declare fn text;
begin
  foreach fn in array array[
    'create_draft_playbook(uuid,text,text,text,text,text)',
    'create_draft_match_plan(uuid,uuid,text,uuid,timestamptz,text,text,smallint,uuid)',
    'create_draft_scenario(uuid,uuid,uuid,text,text,text,uuid,smallint)',
    'save_draft_sequence_action(uuid,uuid,smallint,text,text,text)',
    'set_draft_plan_restrictions(uuid,text[])',
    'set_draft_item_status(text,uuid,text)',
    'get_draft_workspace(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated',fn);
    execute format('grant execute on function public.%s to authenticated',fn);
  end loop;
end $$;

-- Seed canonical pool rows from existing roster declarations without assigning
-- artificial comfort, priority, results, or last-played values.
insert into public.champion_pools (player_id,champion_name,role,comfort_level,priority,notes,games_played)
select p.id,trim(champion),p.role::public.champion_role,5,3,'Imported from roster declaration; staff confirmation required.',0
from public.players p
cross join lateral jsonb_array_elements_text(case when jsonb_typeof(p.main_champions)='array' then p.main_champions else '[]'::jsonb end) champion
where p.role in ('top','jungle','mid','adc','support') and nullif(trim(champion),'') is not null
on conflict (player_id,champion_name,role) do nothing;

notify pgrst, 'reload schema';
