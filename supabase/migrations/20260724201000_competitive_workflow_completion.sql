create or replace function public.create_preparation_brief(
  p_tenant_id uuid,
  p_opponent_team_id uuid,
  p_title text,
  p_scheduled_for timestamptz default null,
  p_summary text default '',
  p_evidence_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_id_value uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner'::public.tenant_role, 'admin'::public.tenant_role]
  ) then
    raise exception 'Owner or admin access is required';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'A brief title is required';
  end if;

  if not exists (
    select 1
    from public.opponent_teams opponent
    where opponent.id = p_opponent_team_id
      and opponent.tenant_id = p_tenant_id
  ) then
    raise exception 'The opponent does not belong to this workspace';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id
    left join public.scouting_evidence evidence
      on evidence.id = evidence_id
     and evidence.tenant_id = p_tenant_id
     and evidence.opponent_team_id = p_opponent_team_id
    where evidence.id is null
  ) then
    raise exception 'All selected evidence must belong to this opponent and workspace';
  end if;

  insert into public.preparation_briefs (
    tenant_id,
    opponent_team_id,
    title,
    scheduled_for,
    executive_summary,
    created_by
  )
  values (
    p_tenant_id,
    p_opponent_team_id,
    trim(p_title),
    p_scheduled_for,
    trim(coalesce(p_summary, '')),
    (select auth.uid())
  )
  returning id into brief_id_value;

  insert into public.preparation_brief_evidence (
    tenant_id,
    brief_id,
    evidence_id
  )
  select p_tenant_id, brief_id_value, evidence_id
  from unnest(coalesce(p_evidence_ids, '{}'::uuid[])) evidence_id;

  return brief_id_value;
end;
$$;

revoke all on function public.create_preparation_brief(
  uuid, uuid, text, timestamptz, text, uuid[]
) from public, anon;
grant execute on function public.create_preparation_brief(
  uuid, uuid, text, timestamptz, text, uuid[]
) to authenticated;
