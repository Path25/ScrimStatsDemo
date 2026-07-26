-- Complete immutable Draft revisions and structured metadata editing.

alter table public.draft_playbooks
  add column if not exists archived_from_status text
  check (archived_from_status is null or archived_from_status in ('draft', 'published'));

alter table public.preparation_briefs
  add column if not exists archived_from_status text
  check (archived_from_status is null or archived_from_status in ('draft', 'published'));

create or replace function public.clone_draft_scenarios(
  p_tenant_id uuid,
  p_source_brief_id uuid default null,
  p_source_playbook_id uuid default null,
  p_target_brief_id uuid default null,
  p_target_playbook_id uuid default null,
  p_preferred_side text default 'either'
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source record;
  v_new_id uuid;
  v_parent_id uuid;
  v_map jsonb := '{}'::jsonb;
begin
  if (p_source_brief_id is null) = (p_source_playbook_id is null) then
    raise exception 'Choose exactly one source owner';
  end if;
  if (p_target_brief_id is null) = (p_target_playbook_id is null) then
    raise exception 'Choose exactly one target owner';
  end if;

  for v_source in
    with recursive scenario_tree as (
      select s.*, 0 as depth
      from public.draft_scenarios s
      where s.tenant_id = p_tenant_id
        and s.parent_scenario_id is null
        and (s.brief_id = p_source_brief_id or s.playbook_id = p_source_playbook_id)
      union all
      select child.*, parent.depth + 1
      from public.draft_scenarios child
      join scenario_tree parent on parent.id = child.parent_scenario_id
      where child.tenant_id = p_tenant_id
    )
    select * from scenario_tree order by depth, created_at, id
  loop
    v_parent_id := case
      when v_source.parent_scenario_id is null then null
      else nullif(v_map ->> v_source.parent_scenario_id::text, '')::uuid
    end;

    insert into public.draft_scenarios (
      tenant_id, brief_id, playbook_id, parent_scenario_id, branch_sequence,
      name, side, rationale, contingency_notes, status, created_by
    ) values (
      p_tenant_id, p_target_brief_id, p_target_playbook_id, v_parent_id,
      v_source.branch_sequence, v_source.name,
      case when v_source.side = 'either' then coalesce(nullif(p_preferred_side, 'either'), 'blue') else v_source.side end,
      v_source.rationale, v_source.contingency_notes, 'draft', (select auth.uid())
    ) returning id into v_new_id;

    v_map := v_map || jsonb_build_object(v_source.id::text, v_new_id::text);

    insert into public.draft_scenario_actions (
      tenant_id, scenario_id, sequence_number, phase, team_side, action_type,
      champion_name, assigned_role, rationale
    )
    select p_tenant_id, v_new_id, sequence_number, phase, team_side, action_type,
      champion_name, assigned_role, rationale
    from public.draft_scenario_actions
    where scenario_id = v_source.id
    order by sequence_number;
  end loop;
end;
$$;

create or replace function public.update_draft_item_details(
  p_kind text,
  p_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant uuid;
  v_title text := nullif(trim(coalesce(p_payload ->> 'title', '')), '');
  v_side text := coalesce(nullif(p_payload ->> 'preferred_side', ''), 'either');
begin
  if v_title is null then raise exception 'A title is required'; end if;
  if v_side not in ('blue', 'red', 'either') then raise exception 'Preferred side must be blue, red, or either'; end if;

  if p_kind = 'playbook' then
    select tenant_id into v_tenant from public.draft_playbooks where id = p_id and status = 'draft';
  elsif p_kind = 'match_plan' then
    select tenant_id into v_tenant from public.preparation_briefs where id = p_id and status = 'draft';
  else
    raise exception 'Draft item type must be match_plan or playbook';
  end if;
  if v_tenant is null then raise exception 'Only a draft revision can be edited'; end if;
  if not public.user_has_tenant_role(v_tenant, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then
    raise exception 'Owner or admin access is required';
  end if;

  if p_kind = 'playbook' then
    update public.draft_playbooks set
      title = v_title,
      description = trim(coalesce(p_payload ->> 'description', '')),
      patch_label = nullif(trim(coalesce(p_payload ->> 'patch_label', '')), ''),
      preferred_side = v_side,
      composition_identity = nullif(trim(coalesce(p_payload ->> 'composition_identity', '')), ''),
      priorities = coalesce(p_payload -> 'priorities', '[]'::jsonb),
      flex_picks = coalesce(p_payload -> 'flex_picks', '[]'::jsonb),
      execution_goals = coalesce(p_payload -> 'execution_goals', '[]'::jsonb),
      vulnerabilities = coalesce(p_payload -> 'vulnerabilities', '[]'::jsonb),
      contingency_notes = trim(coalesce(p_payload ->> 'contingency_notes', '')),
      tags = coalesce(p_payload -> 'tags', '[]'::jsonb),
      updated_at = now()
    where id = p_id;
  else
    if coalesce((p_payload ->> 'series_game_number')::integer, 1) not between 1 and 5 then
      raise exception 'Series game number must be between 1 and 5';
    end if;
    update public.preparation_briefs set
      title = v_title,
      executive_summary = trim(coalesce(p_payload ->> 'executive_summary', '')),
      patch_label = nullif(trim(coalesce(p_payload ->> 'patch_label', '')), ''),
      preferred_side = v_side,
      priorities = coalesce(p_payload -> 'priorities', '[]'::jsonb),
      series_game_number = coalesce((p_payload ->> 'series_game_number')::smallint, 1),
      draft_format = case when coalesce((p_payload ->> 'series_game_number')::integer, 1) > 1 then 'series_restricted' else 'standard' end,
      updated_at = now()
    where id = p_id;
  end if;

  insert into public.draft_audit_events (tenant_id, entity_type, entity_id, action, actor_id, material_changes)
  values (v_tenant, p_kind, p_id, 'updated', (select auth.uid()), p_payload);
  return p_id;
end;
$$;

create or replace function public.revise_draft_item(p_kind text, p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant uuid;
  v_new_id uuid;
  v_plan public.preparation_briefs%rowtype;
  v_playbook public.draft_playbooks%rowtype;
begin
  if p_kind = 'playbook' then
    select * into v_playbook from public.draft_playbooks where id = p_id and snapshot is not null;
    if not found then raise exception 'Only a published playbook can be revised'; end if;
    v_tenant := v_playbook.tenant_id;
  elsif p_kind = 'match_plan' then
    select * into v_plan from public.preparation_briefs where id = p_id and snapshot is not null;
    if not found then raise exception 'Only a published match plan can be revised'; end if;
    v_tenant := v_plan.tenant_id;
  else
    raise exception 'Draft item type must be match_plan or playbook';
  end if;

  if not public.user_has_tenant_role(v_tenant, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then
    raise exception 'Owner or admin access is required';
  end if;

  if p_kind = 'playbook' then
    insert into public.draft_playbooks (
      tenant_id, title, description, patch_label, preferred_side, composition_identity,
      priorities, role_assignments, flex_picks, execution_goals, vulnerabilities,
      contingency_notes, tags, revision, parent_playbook_id, created_by
    ) values (
      v_tenant, v_playbook.title, v_playbook.description, v_playbook.patch_label,
      v_playbook.preferred_side, v_playbook.composition_identity, v_playbook.priorities,
      v_playbook.role_assignments, v_playbook.flex_picks, v_playbook.execution_goals,
      v_playbook.vulnerabilities, v_playbook.contingency_notes, v_playbook.tags,
      v_playbook.revision + 1, v_playbook.id, (select auth.uid())
    ) returning id into v_new_id;
    perform public.clone_draft_scenarios(v_tenant, null, v_playbook.id, null, v_new_id, v_playbook.preferred_side);
  else
    insert into public.preparation_briefs (
      tenant_id, opponent_team_id, scrim_id, title, scheduled_for, patch_label,
      revision, parent_brief_id, executive_summary, priorities, created_by,
      draft_format, series_game_number, preferred_side, source_playbook_id
    ) values (
      v_tenant, v_plan.opponent_team_id, v_plan.scrim_id, v_plan.title,
      v_plan.scheduled_for, v_plan.patch_label, v_plan.revision + 1, v_plan.id,
      v_plan.executive_summary, v_plan.priorities, (select auth.uid()),
      v_plan.draft_format, v_plan.series_game_number, v_plan.preferred_side,
      v_plan.source_playbook_id
    ) returning id into v_new_id;

    insert into public.preparation_brief_evidence (tenant_id, brief_id, evidence_id)
    select tenant_id, v_new_id, evidence_id from public.preparation_brief_evidence where brief_id = p_id;
    insert into public.preparation_brief_external_drafts (tenant_id, brief_id, external_draft_game_id, display_order)
    select tenant_id, v_new_id, external_draft_game_id, display_order from public.preparation_brief_external_drafts where brief_id = p_id;
    insert into public.draft_plan_restrictions (tenant_id, brief_id, champion_name, source_game_number, reason, created_by)
    select tenant_id, v_new_id, champion_name, source_game_number, reason, (select auth.uid())
    from public.draft_plan_restrictions where brief_id = p_id;
    perform public.clone_draft_scenarios(v_tenant, v_plan.id, null, v_new_id, null, v_plan.preferred_side);
  end if;

  insert into public.draft_audit_events (tenant_id, entity_type, entity_id, action, actor_id, material_changes)
  values (v_tenant, p_kind, v_new_id, 'revised', (select auth.uid()), jsonb_build_object('source_id', p_id));
  return v_new_id;
end;
$$;

create or replace function public.upsert_draft_champion_pool(
  p_tenant_id uuid,
  p_player_id uuid,
  p_champion_name text,
  p_role public.champion_role,
  p_comfort_level integer default 5,
  p_priority integer default 3
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then
    raise exception 'Owner or admin access is required';
  end if;
  if not exists (select 1 from public.players where id = p_player_id and tenant_id = p_tenant_id and archived_at is null) then
    raise exception 'The player does not belong to this active roster';
  end if;
  if nullif(trim(p_champion_name), '') is null then raise exception 'A champion is required'; end if;
  if p_comfort_level not between 1 and 10 then raise exception 'Comfort must be between 1 and 10'; end if;
  if p_priority not between 1 and 5 then raise exception 'Priority must be between 1 and 5'; end if;
  insert into public.champion_pools (player_id, champion_name, role, comfort_level, priority, games_played)
  values (p_player_id, trim(p_champion_name), p_role, p_comfort_level, p_priority, 0)
  on conflict (player_id, champion_name, role) do update set
    comfort_level = excluded.comfort_level,
    priority = excluded.priority,
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.set_draft_item_status(p_kind text, p_id uuid, p_status text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_tenant uuid; v_snapshot jsonb; v_missing text[]; v_current text; v_restore text;
begin
  if p_kind='playbook' then
    select tenant_id,status,archived_from_status into v_tenant,v_current,v_restore from public.draft_playbooks where id=p_id;
  elsif p_kind='match_plan' then
    select tenant_id,status,archived_from_status into v_tenant,v_current,v_restore from public.preparation_briefs where id=p_id;
  else raise exception 'Draft item type must be match_plan or playbook'; end if;
  if v_tenant is null then raise exception 'Draft item was not found'; end if;
  if not public.user_has_tenant_role(v_tenant,array['owner'::public.tenant_role,'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  if p_status not in ('published','archived','draft') then raise exception 'Unsupported draft status'; end if;

  if p_status='published' and v_current<>'draft' then raise exception 'Create a new revision to change a published item'; end if;
  if p_status='archived' and v_current='archived' then raise exception 'This item is already archived'; end if;
  if p_status='draft' and v_current<>'archived' then raise exception 'Only an archived item can be restored'; end if;
  if p_status='draft' then p_status := coalesce(v_restore,'draft'); end if;

  if p_status='published' then
    select array_agg(format('%s: %s actions, %s assigned roles',s.name,count(a.id),count(distinct a.assigned_role) filter (where a.team_side='ours' and a.action_type='pick')))
    into v_missing from public.draft_scenarios s left join public.draft_scenario_actions a on a.scenario_id=s.id
    where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id and s.status='draft'
    group by s.id,s.name having count(a.id)<>20 or count(distinct a.assigned_role) filter (where a.team_side='ours' and a.action_type='pick')<>5;
    if v_missing is not null then raise exception 'Complete every scenario before publishing: %',array_to_string(v_missing,'; '); end if;
    if not exists (select 1 from public.draft_scenarios s where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id) then raise exception 'At least one complete scenario is required'; end if;
    select jsonb_build_object('scenarios',coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'side',s.side,'parent_scenario_id',s.parent_scenario_id,'branch_sequence',s.branch_sequence,'rationale',s.rationale,'contingency_notes',s.contingency_notes,'actions',(select coalesce(jsonb_agg(to_jsonb(a) order by a.sequence_number),'[]'::jsonb) from public.draft_scenario_actions a where a.scenario_id=s.id)) order by s.created_at),'[]'::jsonb),'published_at',now())
    into v_snapshot from public.draft_scenarios s where (case when p_kind='playbook' then s.playbook_id else s.brief_id end)=p_id;
  end if;

  if p_kind='playbook' then
    update public.draft_playbooks set status=p_status,
      snapshot=case when p_status='published' and v_current='draft' then v_snapshot else snapshot end,
      published_at=case when p_status='published' and v_current='draft' then now() else published_at end,
      published_by=case when p_status='published' and v_current='draft' then (select auth.uid()) else published_by end,
      archived_from_status=case when p_status='archived' then v_current when v_current='archived' then null else archived_from_status end,
      archived_at=case when p_status='archived' then now() when v_current='archived' then null else archived_at end,updated_at=now() where id=p_id;
    update public.draft_scenarios set status=p_status,updated_at=now() where playbook_id=p_id;
  else
    update public.preparation_briefs set status=p_status,
      snapshot=case when p_status='published' and v_current='draft' then coalesce(snapshot,'{}'::jsonb)||v_snapshot else snapshot end,
      published_at=case when p_status='published' and v_current='draft' then now() else published_at end,
      published_by=case when p_status='published' and v_current='draft' then (select auth.uid()) else published_by end,
      archived_from_status=case when p_status='archived' then v_current when v_current='archived' then null else archived_from_status end,
      archived_at=case when p_status='archived' then now() when v_current='archived' then null else archived_at end,updated_at=now() where id=p_id;
    update public.draft_scenarios set status=p_status,updated_at=now() where brief_id=p_id;
  end if;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id)
  values (v_tenant,p_kind,p_id,case when v_current='archived' then 'restored' when p_status='published' then 'published' else 'archived' end,(select auth.uid()));
  return p_id;
end; $$;

revoke all on function public.clone_draft_scenarios(uuid,uuid,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.clone_draft_scenarios(uuid,uuid,uuid,uuid,uuid,text) to authenticated;
revoke all on function public.update_draft_item_details(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.update_draft_item_details(text,uuid,jsonb) to authenticated;
revoke all on function public.revise_draft_item(text,uuid) from public, anon, authenticated;
grant execute on function public.revise_draft_item(text,uuid) to authenticated;
revoke all on function public.upsert_draft_champion_pool(uuid,uuid,text,public.champion_role,integer,integer) from public, anon, authenticated;
grant execute on function public.upsert_draft_champion_pool(uuid,uuid,text,public.champion_role,integer,integer) to authenticated;
revoke all on function public.set_draft_item_status(text,uuid,text) from public, anon, authenticated;
grant execute on function public.set_draft_item_status(text,uuid,text) to authenticated;

notify pgrst, 'reload schema';
