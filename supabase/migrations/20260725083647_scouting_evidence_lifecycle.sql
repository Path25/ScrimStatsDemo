-- Preserve scouting corrections as an auditable evidence chain.
-- Existing evidence remains active and no historical rows are removed.

alter table public.scouting_evidence
  add column if not exists lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'superseded')),
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by uuid references auth.users(id),
  add column if not exists superseded_by_evidence_id uuid,
  add column if not exists superseded_reason text;

create unique index if not exists scouting_evidence_id_tenant_unique
  on public.scouting_evidence (id, tenant_id);

alter table public.scouting_evidence
  drop constraint if exists scouting_evidence_superseded_by_tenant_fkey;

alter table public.scouting_evidence
  add constraint scouting_evidence_superseded_by_tenant_fkey
  foreign key (superseded_by_evidence_id, tenant_id)
  references public.scouting_evidence(id, tenant_id);

create index if not exists scouting_evidence_active_timeline_idx
  on public.scouting_evidence (tenant_id, opponent_team_id, observed_at desc)
  where lifecycle_state = 'active';

create or replace function public.supersede_scouting_evidence(
  p_tenant_id uuid,
  p_evidence_id uuid,
  p_title text,
  p_observation text,
  p_evidence_type text,
  p_confidence integer,
  p_sample_context text default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous public.scouting_evidence;
  v_replacement_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise exception 'Only team staff can revise scouting evidence'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_title), '') is null
     or nullif(btrim(p_observation), '') is null then
    raise exception 'A title and observation are required'
      using errcode = '22023';
  end if;

  if p_confidence < 1 or p_confidence > 5 then
    raise exception 'Confidence must be between 1 and 5'
      using errcode = '22023';
  end if;

  select evidence.*
  into v_previous
  from public.scouting_evidence evidence
  where evidence.id = p_evidence_id
    and evidence.tenant_id = p_tenant_id
    and evidence.lifecycle_state = 'active'
  for update;

  if not found then
    raise exception 'Active scouting evidence was not found in this workspace'
      using errcode = 'P0002';
  end if;

  insert into public.scouting_evidence (
    tenant_id,
    opponent_team_id,
    created_by,
    source_kind,
    evidence_type,
    title,
    observation,
    confidence,
    sample_context,
    scrim_id,
    scrim_game_id,
    game_time_seconds,
    observed_at
  )
  values (
    v_previous.tenant_id,
    v_previous.opponent_team_id,
    auth.uid(),
    v_previous.source_kind,
    btrim(p_evidence_type),
    btrim(p_title),
    btrim(p_observation),
    p_confidence,
    nullif(btrim(p_sample_context), ''),
    v_previous.scrim_id,
    v_previous.scrim_game_id,
    v_previous.game_time_seconds,
    v_previous.observed_at
  )
  returning id into v_replacement_id;

  update public.scouting_evidence
  set
    lifecycle_state = 'superseded',
    superseded_at = now(),
    superseded_by = auth.uid(),
    superseded_by_evidence_id = v_replacement_id,
    superseded_reason = nullif(btrim(p_reason), ''),
    updated_at = now()
  where id = v_previous.id
    and tenant_id = v_previous.tenant_id;

  return v_replacement_id;
end;
$$;

revoke all on function public.supersede_scouting_evidence(
  uuid, uuid, text, text, text, integer, text, text
) from public, anon;
grant execute on function public.supersede_scouting_evidence(
  uuid, uuid, text, text, text, integer, text, text
) to authenticated;
