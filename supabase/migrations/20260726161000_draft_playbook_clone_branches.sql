-- Clone an entire playbook scenario tree, including contingencies, into a match plan.
create or replace function public.create_draft_match_plan(
  p_tenant_id uuid, p_opponent_team_id uuid, p_title text, p_scrim_id uuid default null,
  p_scheduled_for timestamptz default null, p_patch_label text default null,
  p_preferred_side text default 'either', p_series_game_number smallint default 1,
  p_source_playbook_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not public.user_has_tenant_role(p_tenant_id, array['owner'::public.tenant_role, 'admin'::public.tenant_role]) then raise exception 'Owner or admin access is required'; end if;
  if nullif(trim(p_title), '') is null then raise exception 'A match plan title is required'; end if;
  if p_preferred_side not in ('blue','red','either') then raise exception 'Preferred side must be blue, red, or either'; end if;
  if p_series_game_number not between 1 and 5 then raise exception 'Series game number must be between 1 and 5'; end if;
  if not exists (select 1 from public.opponent_teams where id=p_opponent_team_id and tenant_id=p_tenant_id) then raise exception 'The opponent does not belong to this workspace'; end if;
  if p_scrim_id is not null and not exists (select 1 from public.scrims where id=p_scrim_id and tenant_id=p_tenant_id) then raise exception 'The fixture does not belong to this workspace'; end if;
  if p_source_playbook_id is not null and not exists (select 1 from public.draft_playbooks where id=p_source_playbook_id and tenant_id=p_tenant_id and status <> 'archived') then raise exception 'An active playbook from this workspace is required'; end if;
  insert into public.preparation_briefs (tenant_id,opponent_team_id,scrim_id,title,scheduled_for,patch_label,preferred_side,series_game_number,draft_format,source_playbook_id,created_by)
  values (p_tenant_id,p_opponent_team_id,p_scrim_id,trim(p_title),p_scheduled_for,nullif(trim(coalesce(p_patch_label,'')),''),p_preferred_side,p_series_game_number,case when p_series_game_number>1 then 'series_restricted' else 'standard' end,p_source_playbook_id,(select auth.uid())) returning id into v_id;
  if p_source_playbook_id is not null then
    perform public.clone_draft_scenarios(p_tenant_id,null,p_source_playbook_id,v_id,null,p_preferred_side);
  end if;
  insert into public.draft_audit_events (tenant_id,entity_type,entity_id,action,actor_id,material_changes)
  values (p_tenant_id,'match_plan',v_id,'created',(select auth.uid()),jsonb_build_object('source_playbook_id',p_source_playbook_id));
  return v_id;
end; $$;

revoke all on function public.create_draft_match_plan(uuid,uuid,text,uuid,timestamptz,text,text,smallint,uuid) from public, anon, authenticated;
grant execute on function public.create_draft_match_plan(uuid,uuid,text,uuid,timestamptz,text,text,smallint,uuid) to authenticated;
notify pgrst, 'reload schema';
