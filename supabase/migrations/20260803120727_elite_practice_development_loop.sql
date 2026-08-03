-- WO-2026-033 Phase 2: Elite practice-development loop.
--
-- This migration is additive. Applying it alone does not expose the feature:
-- every existing and future workspace receives practice_development as
-- planned/false, and every customer RPC requires Elite + live + enabled.

-- Register the module without changing any current plan entitlement.
alter table public.tenant_feature_access
  drop constraint if exists tenant_feature_access_module_key_check;

alter table public.tenant_feature_access
  add constraint tenant_feature_access_module_key_check check (module_key in (
    'operations', 'soloq', 'analytics', 'scouting', 'draft_preparation',
    'collector', 'discord', 'practice_development'
  ));

-- Keep the current entitlement synchronizer contract from
-- 20260801111044_enable_free_soloq_entitlement.sql. The practice-development
-- row is inserted separately with DO NOTHING so an explicitly activated QA
-- row is never reset by an ordinary tier update.
create or replace function public.sync_tenant_plan_entitlements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tenant_feature_access (
    tenant_id, module_key, release_state, is_enabled, updated_at
  )
  values
    (new.id, 'operations', 'live', true, now()),
    (new.id, 'soloq', 'live', true, now()),
    (new.id, 'analytics', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'scouting', 'beta', new.subscription_tier::text in ('pro', 'elite'), now()),
    (new.id, 'draft_preparation', 'planned', new.subscription_tier::text in ('pro', 'elite'), now()),
    (
      new.id,
      'collector',
      'live',
      public.collector_entitlement_active(
        new.subscription_tier,
        new.subscription_status,
        new.subscription_period_end,
        new.subscription_past_due_started_at
      ),
      now()
    ),
    (new.id, 'discord', 'planned', new.subscription_tier::text = 'elite', now())
  on conflict (tenant_id, module_key) do update set
    is_enabled = excluded.is_enabled,
    updated_at = excluded.updated_at,
    updated_by = null;

  insert into public.tenant_feature_access (
    tenant_id, module_key, release_state, is_enabled, updated_at
  ) values (
    new.id, 'practice_development', 'planned', false, now()
  ) on conflict (tenant_id, module_key) do nothing;

  -- Downgrades fail closed. A later upgrade still does not auto-enable the
  -- module: Elite updates preserve the current explicit row unchanged.
  if new.subscription_tier::text <> 'elite' then
    update public.tenant_feature_access
    set is_enabled = false,
        updated_at = now(),
        updated_by = null
    where tenant_id = new.id
      and module_key = 'practice_development'
      and is_enabled is true;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_tenant_plan_entitlements()
  from public, anon, authenticated;
grant execute on function public.sync_tenant_plan_entitlements()
  to service_role;

comment on function public.sync_tenant_plan_entitlements() is
  'Synchronizes existing plan modules, seeds practice_development planned/disabled, disables it on downgrade, and never auto-enables it on Elite upgrade.';

insert into public.tenant_feature_access (
  tenant_id, module_key, release_state, is_enabled, updated_at
)
select tenant.id, 'practice_development', 'planned', false, now()
from public.tenants tenant
on conflict (tenant_id, module_key) do nothing;

-- Exact server-side customer access predicate. Browser gates are not trusted.
create or replace function public.has_practice_development_access(
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.tenant_users membership
      join public.tenants tenant
        on tenant.id = membership.tenant_id
      join public.tenant_feature_access access
        on access.tenant_id = tenant.id
       and access.module_key = 'practice_development'
      where membership.tenant_id = p_tenant_id
        and membership.user_id = (select auth.uid())
        and tenant.subscription_tier::text = 'elite'
        and access.release_state = 'live'
        and access.is_enabled is true
    );
$$;

revoke all on function public.has_practice_development_access(uuid)
  from public, anon, authenticated;
grant execute on function public.has_practice_development_access(uuid)
  to authenticated;

comment on function public.has_practice_development_access(uuid) is
  'Returns true only for authenticated members of an Elite workspace whose practice_development module is live and enabled.';

-- The objective is the single operational loop for one practice block.
create table public.practice_development_objectives (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  scrim_id uuid not null,
  title text not null,
  evidence_standard text not null,
  status text not null default 'planned',
  team_status_summary text,
  staff_note text,
  version integer not null default 1,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  completed_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  constraint practice_development_objectives_id_tenant_unique
    unique (id, tenant_id),
  constraint practice_development_objectives_scrim_tenant_fkey
    foreign key (scrim_id, tenant_id)
    references public.scrims(id, tenant_id)
    on delete restrict,
  constraint practice_development_objectives_title_check
    check (char_length(btrim(title)) between 1 and 160),
  constraint practice_development_objectives_evidence_standard_check
    check (char_length(btrim(evidence_standard)) between 1 and 1000),
  constraint practice_development_objectives_status_check
    check (status in ('planned', 'evidenced', 'completed', 'blocked')),
  constraint practice_development_objectives_team_summary_check
    check (
      team_status_summary is null
      or char_length(btrim(team_status_summary)) between 1 and 2000
    ),
  constraint practice_development_objectives_staff_note_check
    check (staff_note is null or char_length(btrim(staff_note)) <= 4000),
  constraint practice_development_objectives_version_check
    check (version >= 1),
  constraint practice_development_objectives_completion_check
    check (
      (
        status = 'completed'
        and completed_at is not null
        and completed_by is not null
        and nullif(btrim(team_status_summary), '') is not null
      )
      or (
        status <> 'completed'
        and completed_at is null
        and completed_by is null
      )
    ),
  constraint practice_development_objectives_blocked_summary_check
    check (
      status <> 'blocked'
      or nullif(btrim(team_status_summary), '') is not null
    ),
  constraint practice_development_objectives_archive_check
    check ((archived_at is null) = (archived_by is null))
);

create unique index practice_development_objectives_active_scrim_key
  on public.practice_development_objectives (tenant_id, scrim_id)
  where archived_at is null;

create index practice_development_objectives_tenant_status_updated_idx
  on public.practice_development_objectives (
    tenant_id, status, updated_at desc
  );

-- Evidence stores only a bounded factual link and approved summaries. It does
-- not copy raw game/provider payloads or coach-feedback bodies.
create table public.practice_development_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  objective_id uuid not null,
  source_type text not null,
  source_id uuid,
  source_label text not null,
  source_recorded_at timestamptz not null,
  state text not null default 'linked',
  team_summary text,
  staff_note text,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  constraint practice_development_evidence_id_tenant_unique
    unique (id, tenant_id),
  constraint practice_development_evidence_objective_tenant_fkey
    foreign key (objective_id, tenant_id)
    references public.practice_development_objectives(id, tenant_id)
    on delete restrict,
  constraint practice_development_evidence_source_type_check
    check (source_type in ('scrim_game', 'block_review', 'declared_unavailable')),
  constraint practice_development_evidence_source_shape_check
    check (
      (
        source_type in ('scrim_game', 'block_review')
        and source_id is not null
      )
      or (
        source_type = 'declared_unavailable'
        and source_id is null
        and state = 'unavailable'
        and nullif(btrim(team_summary), '') is not null
      )
    ),
  constraint practice_development_evidence_source_label_check
    check (char_length(btrim(source_label)) between 1 and 160),
  constraint practice_development_evidence_state_check
    check (state in ('linked', 'reviewed', 'unavailable')),
  constraint practice_development_evidence_team_summary_check
    check (
      team_summary is null
      or char_length(btrim(team_summary)) between 1 and 2000
    ),
  constraint practice_development_evidence_staff_note_check
    check (staff_note is null or char_length(btrim(staff_note)) <= 4000),
  constraint practice_development_evidence_review_check
    check (
      (
        state = 'reviewed'
        and reviewed_by is not null
        and reviewed_at is not null
        and nullif(btrim(team_summary), '') is not null
      )
      or (
        state <> 'reviewed'
        and reviewed_by is null
        and reviewed_at is null
      )
    ),
  constraint practice_development_evidence_archive_check
    check ((archived_at is null) = (archived_by is null))
);

create unique index practice_development_evidence_active_source_key
  on public.practice_development_evidence (
    tenant_id, objective_id, source_type, source_id
  )
  where archived_at is null and source_id is not null;

create unique index practice_development_evidence_active_unavailable_key
  on public.practice_development_evidence (tenant_id, objective_id, source_type)
  where archived_at is null and source_type = 'declared_unavailable';

create index practice_development_evidence_objective_state_idx
  on public.practice_development_evidence (objective_id, state, linked_at);

-- Existing Coaching Actions remain canonical. This bridge avoids changing the
-- shared action lifecycle or adding another action-creation implementation.
create unique index if not exists coaching_actions_id_tenant_unique
  on public.coaching_actions (id, tenant_id);

create table public.practice_development_action_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  objective_id uuid not null,
  action_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  constraint practice_development_action_links_id_tenant_unique
    unique (id, tenant_id),
  constraint practice_development_action_links_objective_tenant_fkey
    foreign key (objective_id, tenant_id)
    references public.practice_development_objectives(id, tenant_id)
    on delete restrict,
  constraint practice_development_action_links_action_tenant_fkey
    foreign key (action_id, tenant_id)
    references public.coaching_actions(id, tenant_id)
    on delete restrict,
  constraint practice_development_action_links_archive_check
    check ((archived_at is null) = (archived_by is null))
);

create unique index practice_development_action_links_active_objective_key
  on public.practice_development_action_links (tenant_id, objective_id)
  where archived_at is null;

create unique index practice_development_action_links_active_action_key
  on public.practice_development_action_links (tenant_id, action_id)
  where archived_at is null;

-- Append-only audit ledger. There is deliberately no update/delete RPC.
create table public.practice_development_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  objective_id uuid not null,
  actor_id uuid references auth.users(id) on delete restrict,
  event_type text not null,
  previous_status text,
  next_status text,
  team_summary text,
  staff_note text,
  version integer not null,
  created_at timestamptz not null default now(),
  constraint practice_development_events_objective_tenant_fkey
    foreign key (objective_id, tenant_id)
    references public.practice_development_objectives(id, tenant_id)
    on delete restrict,
  constraint practice_development_events_type_check
    check (event_type in (
      'created', 'planning_updated', 'evidence_linked', 'evidence_reviewed',
      'evidence_unavailable', 'action_linked', 'action_unlinked', 'blocked',
      'completed', 'reopened', 'archived', 'restored'
    )),
  constraint practice_development_events_previous_status_check
    check (
      previous_status is null
      or previous_status in ('planned', 'evidenced', 'completed', 'blocked')
    ),
  constraint practice_development_events_next_status_check
    check (
      next_status is null
      or next_status in ('planned', 'evidenced', 'completed', 'blocked')
    ),
  constraint practice_development_events_team_summary_check
    check (team_summary is null or char_length(btrim(team_summary)) <= 2000),
  constraint practice_development_events_staff_note_check
    check (staff_note is null or char_length(btrim(staff_note)) <= 4000),
  constraint practice_development_events_version_check
    check (version >= 1)
);

create index practice_development_events_objective_created_idx
  on public.practice_development_events (objective_id, created_at, id);

create index practice_development_events_tenant_created_idx
  on public.practice_development_events (tenant_id, created_at desc);

-- RLS and privileges are both default-deny. Authenticated clients can use only
-- the shaped RPCs defined below; they cannot select staff-only base columns.
alter table public.practice_development_objectives enable row level security;
alter table public.practice_development_evidence enable row level security;
alter table public.practice_development_action_links enable row level security;
alter table public.practice_development_events enable row level security;

revoke all on table
  public.practice_development_objectives,
  public.practice_development_evidence,
  public.practice_development_action_links,
  public.practice_development_events
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.practice_development_objectives,
  public.practice_development_evidence,
  public.practice_development_action_links
to service_role;

revoke all on table public.practice_development_events from service_role;
grant select, insert on table public.practice_development_events
  to service_role;

comment on table public.practice_development_objectives is
  'Elite-only practice objective for one tenant-owned scrim block. Customer access is RPC-only.';
comment on table public.practice_development_evidence is
  'Bounded factual evidence links for a practice objective; no raw provider payloads or inferred improvement.';
comment on table public.practice_development_action_links is
  'Tenant-safe bridge from a practice objective to the canonical Coaching Action lifecycle.';
comment on table public.practice_development_events is
  'Append-only audit ledger for practice-development changes; not exposed directly to authenticated clients.';

-- Internal helpers are deliberately outside the exposed public API. They are
-- callable only by the locked public RPCs owned by the migration role.
create or replace function security.require_practice_development_staff(
  p_tenant_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null
    or not public.has_practice_development_access(p_tenant_id)
  then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  if not public.user_has_tenant_role(
    p_tenant_id,
    array['owner', 'admin']::public.tenant_role[]
  ) then
    raise sqlstate '42501'
      using message = 'Practice-development staff access is required';
  end if;

  return v_actor_id;
end;
$$;

revoke all on function security.require_practice_development_staff(uuid)
  from public, anon, authenticated, service_role;

comment on function security.require_practice_development_staff(uuid) is
  'Internal guard returning the authenticated actor only after exact practice-development entitlement and Owner/Admin membership checks.';

create or replace function security.practice_development_source_available(
  p_objective_id uuid,
  p_source_type text,
  p_source_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_source_type = 'scrim_game' then exists (
      select 1
      from public.practice_development_objectives objective
      join public.scrims scrim
        on scrim.id = objective.scrim_id
       and scrim.tenant_id = objective.tenant_id
      join public.scrim_games game
        on game.id = p_source_id
       and game.scrim_id = scrim.id
      where objective.id = p_objective_id
        and scrim.archived_at is null
        and scrim.status is distinct from 'cancelled'
        and game.status = 'completed'
        and game.status <> 'cancelled'
    )
    when p_source_type = 'block_review' then exists (
      select 1
      from public.practice_development_objectives objective
      join public.scrims scrim
        on scrim.id = objective.scrim_id
       and scrim.tenant_id = objective.tenant_id
      where objective.id = p_objective_id
        and p_source_id = scrim.id
        and scrim.archived_at is null
        and scrim.status is distinct from 'cancelled'
        and scrim.review_status = 'complete'
        and scrim.review_completed_at is not null
    )
    else false
  end;
$$;

revoke all on function security.practice_development_source_available(uuid, text, uuid)
  from public, anon, authenticated, service_role;

comment on function security.practice_development_source_available(uuid, text, uuid) is
  'Internal current-availability check for completed same-block game or completed block-review evidence.';

create or replace function security.validate_practice_development_evidence_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_objective public.practice_development_objectives;
  v_scrim public.scrims;
  v_game public.scrim_games;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = new.objective_id
    and objective.tenant_id = new.tenant_id;

  if not found then
    raise exception 'Practice objective does not belong to this workspace';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives cannot receive evidence';
  end if;

  select *
  into v_scrim
  from public.scrims scrim
  where scrim.id = v_objective.scrim_id
    and scrim.tenant_id = v_objective.tenant_id
    and scrim.archived_at is null
    and scrim.status is distinct from 'cancelled';

  if not found then
    raise exception 'Practice block is unavailable';
  end if;
  if now() < v_scrim.starts_at then
    raise exception 'Evidence can be linked after practice starts';
  end if;

  if new.source_type = 'scrim_game' then
    select game.*
    into v_game
    from public.scrim_games game
    join public.scrims scrim
      on scrim.id = game.scrim_id
    where game.id = new.source_id
      and game.scrim_id = v_objective.scrim_id
      and scrim.tenant_id = v_objective.tenant_id
      and scrim.archived_at is null
      and scrim.status is distinct from 'cancelled'
      and game.status = 'completed'
      and game.status <> 'cancelled';

    if not found then
      raise exception 'Evidence game does not belong to this practice block';
    end if;

    new.source_label := 'Game ' || v_game.game_number::text;
    new.source_recorded_at := coalesce(
      v_game.game_start_time,
      v_game.created_at
    );
  elsif new.source_type = 'block_review' then
    select scrim.*
    into v_scrim
    from public.scrims scrim
    where scrim.id = new.source_id
      and scrim.id = v_objective.scrim_id
      and scrim.tenant_id = v_objective.tenant_id
      and scrim.archived_at is null
      and scrim.status is distinct from 'cancelled'
      and scrim.review_status = 'complete'
      and scrim.review_completed_at is not null;

    if not found then
      raise exception 'A completed review for this practice block is required';
    end if;

    new.source_label := 'Completed block review';
    new.source_recorded_at := v_scrim.review_completed_at;
  elsif new.source_type = 'declared_unavailable' then
    new.source_id := null;
    new.source_label := 'Evidence unavailable';
    new.source_recorded_at := now();
    new.state := 'unavailable';
  else
    raise exception 'Unsupported practice evidence source';
  end if;

  return new;
end;
$$;

revoke all on function security.validate_practice_development_evidence_source()
  from public, anon, authenticated, service_role;

comment on function security.validate_practice_development_evidence_source() is
  'Internal insert trigger that validates same-block evidence and derives immutable factual source provenance.';

create trigger validate_practice_development_evidence_source_trigger
before insert
on public.practice_development_evidence
for each row
execute function security.validate_practice_development_evidence_source();

create or replace function security.prevent_practice_development_evidence_relink()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
    or new.objective_id is distinct from old.objective_id
    or new.source_type is distinct from old.source_type
    or new.source_id is distinct from old.source_id
    or new.source_label is distinct from old.source_label
    or new.source_recorded_at is distinct from old.source_recorded_at
    or new.linked_by is distinct from old.linked_by
    or new.linked_at is distinct from old.linked_at
  then
    raise exception 'Practice evidence provenance is immutable';
  end if;
  return new;
end;
$$;

revoke all on function security.prevent_practice_development_evidence_relink()
  from public, anon, authenticated, service_role;

comment on function security.prevent_practice_development_evidence_relink() is
  'Internal trigger preventing changes to linked evidence source and link provenance.';

create trigger prevent_practice_development_evidence_relink_trigger
before update of tenant_id, objective_id, source_type, source_id,
  source_label, source_recorded_at, linked_by, linked_at
on public.practice_development_evidence
for each row
execute function security.prevent_practice_development_evidence_relink();

create or replace function security.prevent_practice_development_objective_reparent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
    or new.scrim_id is distinct from old.scrim_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Practice objective provenance is immutable';
  end if;
  return new;
end;
$$;

revoke all on function security.prevent_practice_development_objective_reparent()
  from public, anon, authenticated, service_role;

comment on function security.prevent_practice_development_objective_reparent() is
  'Internal trigger preventing an objective from moving tenant, source block, or creation provenance.';

create trigger prevent_practice_development_objective_reparent_trigger
before update of tenant_id, scrim_id, created_by, created_at
on public.practice_development_objectives
for each row
execute function security.prevent_practice_development_objective_reparent();

create or replace function security.prevent_practice_development_action_relink()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
    or new.objective_id is distinct from old.objective_id
    or new.action_id is distinct from old.action_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Practice follow-up provenance is immutable';
  end if;
  return new;
end;
$$;

revoke all on function security.prevent_practice_development_action_relink()
  from public, anon, authenticated, service_role;

comment on function security.prevent_practice_development_action_relink() is
  'Internal trigger preventing a follow-up link from moving tenant, objective, action, or creation provenance.';

create trigger prevent_practice_development_action_relink_trigger
before update of tenant_id, objective_id, action_id, created_by, created_at
on public.practice_development_action_links
for each row
execute function security.prevent_practice_development_action_relink();

create or replace function public.create_practice_development_objective(
  p_tenant_id uuid,
  p_scrim_id uuid,
  p_title text,
  p_evidence_standard text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_scrim public.scrims;
  v_objective public.practice_development_objectives;
begin
  v_actor_id := security.require_practice_development_staff(p_tenant_id);

  select *
  into v_scrim
  from public.scrims scrim
  where scrim.id = p_scrim_id
    and scrim.tenant_id = p_tenant_id
  for update;

  if not found
    or v_scrim.archived_at is not null
    or v_scrim.status is not distinct from 'cancelled'
  then
    raise exception 'Practice block is unavailable';
  end if;
  if now() >= v_scrim.starts_at then
    raise exception 'The objective must be recorded before practice starts';
  end if;
  if exists (
    select 1
    from public.practice_development_objectives objective
    where objective.tenant_id = p_tenant_id
      and objective.scrim_id = p_scrim_id
  ) then
    raise exception 'This practice block already has an objective';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 160 then
    raise exception 'Objective title must contain between 1 and 160 characters';
  end if;
  if char_length(btrim(coalesce(p_evidence_standard, ''))) not between 1 and 1000 then
    raise exception 'Evidence standard must contain between 1 and 1000 characters';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  insert into public.practice_development_objectives (
    tenant_id,
    scrim_id,
    title,
    evidence_standard,
    staff_note,
    created_by,
    updated_by
  ) values (
    p_tenant_id,
    p_scrim_id,
    btrim(p_title),
    btrim(p_evidence_standard),
    nullif(btrim(coalesce(p_staff_note, '')), ''),
    v_actor_id,
    v_actor_id
  )
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    next_status,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'created',
    v_objective.status,
    v_objective.staff_note,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_objective.id,
    'status', v_objective.status,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.update_practice_development_objective(
  p_objective_id uuid,
  p_expected_version integer,
  p_title text,
  p_evidence_standard text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_scrim public.scrims;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before editing';
  end if;

  select *
  into v_scrim
  from public.scrims scrim
  where scrim.id = v_objective.scrim_id
    and scrim.tenant_id = v_objective.tenant_id;

  if not found
    or v_scrim.archived_at is not null
    or v_scrim.status is not distinct from 'cancelled'
  then
    raise exception 'Practice block is unavailable';
  end if;
  if now() >= v_scrim.starts_at then
    raise exception 'Planning fields cannot change after practice starts';
  end if;
  if exists (
    select 1
    from public.practice_development_evidence evidence
    where evidence.objective_id = v_objective.id
      and evidence.tenant_id = v_objective.tenant_id
      and evidence.archived_at is null
  ) then
    raise exception 'Planning fields cannot change after evidence is linked';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 160 then
    raise exception 'Objective title must contain between 1 and 160 characters';
  end if;
  if char_length(btrim(coalesce(p_evidence_standard, ''))) not between 1 and 1000 then
    raise exception 'Evidence standard must contain between 1 and 1000 characters';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  update public.practice_development_objectives
  set title = btrim(p_title),
      evidence_standard = btrim(p_evidence_standard),
      staff_note = nullif(btrim(coalesce(p_staff_note, '')), ''),
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'planning_updated',
    v_objective.status,
    v_objective.status,
    v_objective.staff_note,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_objective.id,
    'status', v_objective.status,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.link_practice_development_evidence(
  p_objective_id uuid,
  p_expected_version integer,
  p_source_type text,
  p_source_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_evidence public.practice_development_evidence;
  v_scrim public.scrims;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before linking evidence';
  end if;
  if v_objective.status not in ('planned', 'evidenced') then
    raise exception 'Reopen this objective before linking evidence';
  end if;
  if p_source_type not in ('scrim_game', 'block_review') or p_source_id is null then
    raise exception 'A supported evidence source is required';
  end if;

  select *
  into v_scrim
  from public.scrims scrim
  where scrim.id = v_objective.scrim_id
    and scrim.tenant_id = v_objective.tenant_id;

  if not found
    or v_scrim.archived_at is not null
    or v_scrim.status is not distinct from 'cancelled'
  then
    raise exception 'Practice block is unavailable';
  end if;
  if now() < v_scrim.starts_at then
    raise exception 'Evidence can be linked after practice starts';
  end if;

  insert into public.practice_development_evidence (
    tenant_id,
    objective_id,
    source_type,
    source_id,
    linked_by
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    p_source_type,
    p_source_id,
    v_actor_id
  )
  returning * into v_evidence;

  update public.practice_development_objectives
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'evidence_linked',
    v_objective.status,
    v_objective.status,
    v_evidence.source_label,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_evidence.id,
    'state', v_evidence.state,
    'objective_id', v_objective.id,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.review_practice_development_evidence(
  p_evidence_id uuid,
  p_expected_version integer,
  p_team_summary text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_evidence public.practice_development_evidence;
  v_objective public.practice_development_objectives;
  v_previous_status text;
begin
  select *
  into v_evidence
  from public.practice_development_evidence evidence
  where evidence.id = p_evidence_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;

  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = v_evidence.objective_id
    and objective.tenant_id = v_evidence.tenant_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null
    or v_evidence.archived_at is not null
  then
    raise exception 'Archived practice records must be restored before review';
  end if;
  if v_objective.status not in ('planned', 'evidenced') then
    raise exception 'Reopen this objective before reviewing evidence';
  end if;
  if v_evidence.state <> 'linked' then
    raise exception 'Only linked evidence can be reviewed';
  end if;
  if not security.practice_development_source_available(
    v_objective.id,
    v_evidence.source_type,
    v_evidence.source_id
  ) then
    raise exception 'The evidence source is unavailable';
  end if;
  if char_length(btrim(coalesce(p_team_summary, ''))) not between 1 and 2000 then
    raise exception 'Team evidence summary must contain between 1 and 2000 characters';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  update public.practice_development_evidence
  set state = 'reviewed',
      team_summary = btrim(p_team_summary),
      staff_note = nullif(btrim(coalesce(p_staff_note, '')), ''),
      reviewed_by = v_actor_id,
      reviewed_at = now()
  where id = v_evidence.id
  returning * into v_evidence;

  v_previous_status := v_objective.status;
  update public.practice_development_objectives
  set status = 'evidenced',
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'evidence_reviewed',
    v_previous_status,
    v_objective.status,
    v_evidence.team_summary,
    v_evidence.staff_note,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_evidence.id,
    'state', v_evidence.state,
    'objective_id', v_objective.id,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.record_practice_development_unavailable(
  p_objective_id uuid,
  p_expected_version integer,
  p_team_summary text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_evidence public.practice_development_evidence;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before recording evidence status';
  end if;
  if v_objective.status not in ('planned', 'evidenced') then
    raise exception 'Reopen this objective before recording evidence status';
  end if;
  if not exists (
    select 1
    from public.scrims source_scrim
    where source_scrim.id = v_objective.scrim_id
      and source_scrim.tenant_id = v_objective.tenant_id
      and source_scrim.archived_at is null
      and source_scrim.status is distinct from 'cancelled'
  ) then
    raise exception 'Practice block is unavailable';
  end if;
  if char_length(btrim(coalesce(p_team_summary, ''))) not between 1 and 2000 then
    raise exception 'An evidence-unavailable explanation is required';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  insert into public.practice_development_evidence (
    tenant_id,
    objective_id,
    source_type,
    source_id,
    state,
    team_summary,
    staff_note,
    linked_by
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    'declared_unavailable',
    null,
    'unavailable',
    btrim(p_team_summary),
    nullif(btrim(coalesce(p_staff_note, '')), ''),
    v_actor_id
  )
  returning * into v_evidence;

  update public.practice_development_objectives
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'evidence_unavailable',
    v_objective.status,
    v_objective.status,
    v_evidence.team_summary,
    v_evidence.staff_note,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_evidence.id,
    'state', v_evidence.state,
    'objective_id', v_objective.id,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.attach_practice_development_follow_up(
  p_objective_id uuid,
  p_expected_version integer,
  p_action_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_action public.coaching_actions;
  v_link public.practice_development_action_links;
  v_source_scrim public.scrims;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before assigning a follow-up';
  end if;
  if v_objective.status <> 'evidenced' then
    raise exception 'Reviewed evidence is required before assigning a follow-up';
  end if;
  select *
  into v_source_scrim
  from public.scrims source_scrim
  where source_scrim.id = v_objective.scrim_id
    and source_scrim.tenant_id = v_objective.tenant_id
    and source_scrim.archived_at is null
    and source_scrim.status is distinct from 'cancelled'
  for share;

  if not found then
    raise exception 'Practice block is unavailable';
  end if;

  select *
  into v_action
  from public.coaching_actions action
  where action.id = p_action_id
    and action.tenant_id = v_objective.tenant_id
  for update;

  if not found or v_action.archived_at is not null then
    raise exception 'Coaching action is unavailable in this workspace';
  end if;
  if v_action.status = 'dismissed' then
    raise exception 'A dismissed action cannot be used as the follow-up';
  end if;
  if v_action.scrim_id is distinct from v_objective.scrim_id then
    raise exception 'The action must use this practice block as its source';
  end if;
  if v_action.due_at is null then
    raise exception 'The follow-up action requires a due date';
  end if;
  if not exists (
    select 1
    from public.tenant_users owner_membership
    where owner_membership.tenant_id = v_objective.tenant_id
      and owner_membership.user_id = v_action.owner_user_id
      and owner_membership.role = any(
        array['owner', 'admin']::public.tenant_role[]
      )
  ) then
    raise exception 'The follow-up owner must be current workspace staff';
  end if;
  if v_action.assignee_user_id is not null and not exists (
    select 1
    from public.tenant_users member
    where member.tenant_id = v_objective.tenant_id
      and member.user_id = v_action.assignee_user_id
  ) then
    raise exception 'The follow-up assignee is not a workspace member';
  end if;
  if v_action.scope_type = 'player' then
    if v_action.assignee_player_id is null
      or not (v_action.assignee_player_id = any(v_action.participant_player_ids))
      or not exists (
        select 1
        from public.players primary_player
        where primary_player.id = v_action.assignee_player_id
          and primary_player.tenant_id = v_objective.tenant_id
          and primary_player.archived_at is null
      )
    then
      raise exception 'Player follow-ups require an active same-tenant primary player';
    end if;
  elsif v_action.scope_type = 'unit' then
    if nullif(btrim(v_action.unit_label), '') is null
      or (
        select count(distinct participant_id)
        from unnest(
          coalesce(v_action.participant_player_ids, '{}'::uuid[])
        ) participant_id
        where participant_id is not null
      ) < 2
    then
      raise exception 'Unit follow-ups require a label and at least two players';
    end if;
  elsif v_action.scope_type <> 'team' then
    raise exception 'Unsupported follow-up scope';
  end if;
  if exists (
    select 1
    from unnest(v_action.participant_player_ids) participant_id
    where not exists (
      select 1
      from public.players player
      where player.id = participant_id
        and player.tenant_id = v_objective.tenant_id
        and player.archived_at is null
    )
  ) then
    raise exception 'Every follow-up participant must be an active workspace player';
  end if;
  if exists (
    select 1
    from unnest(v_action.checkpoint_scrim_ids) checkpoint_id
    where not exists (
      select 1
      from public.scrims checkpoint
      where checkpoint.id = checkpoint_id
        and checkpoint.tenant_id = v_objective.tenant_id
        and checkpoint.archived_at is null
        and checkpoint.status is distinct from 'cancelled'
        and checkpoint.starts_at > v_source_scrim.starts_at
    )
  ) then
    raise exception 'Every follow-up checkpoint must belong to this workspace';
  end if;
  if v_action.follow_up_scrim_id is not null and not exists (
    select 1
    from public.scrims checkpoint
    where checkpoint.id = v_action.follow_up_scrim_id
      and checkpoint.tenant_id = v_objective.tenant_id
      and checkpoint.archived_at is null
      and checkpoint.status is distinct from 'cancelled'
      and checkpoint.starts_at > v_source_scrim.starts_at
  ) then
    raise exception 'The follow-up practice block does not belong to this workspace';
  end if;
  if v_action.follow_up_scrim_id is not null
    and not (v_action.follow_up_scrim_id = any(v_action.checkpoint_scrim_ids))
  then
    raise exception 'The follow-up practice block must be a declared action checkpoint';
  end if;

  insert into public.practice_development_action_links (
    tenant_id,
    objective_id,
    action_id,
    created_by
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_action.id,
    v_actor_id
  )
  returning * into v_link;

  update public.practice_development_objectives
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'action_linked',
    v_objective.status,
    v_objective.status,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_link.id,
    'action_id', v_action.id,
    'objective_id', v_objective.id,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.detach_practice_development_follow_up(
  p_objective_id uuid,
  p_expected_version integer,
  p_team_status_summary text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_link public.practice_development_action_links;
begin
  -- Recovery exception: detaching preserves the canonical Coaching Action and
  -- appends an audit event, so staff may remove a stale link after cancellation.
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before changing a follow-up';
  end if;
  if v_objective.status = 'completed' then
    raise exception 'Reopen the objective before changing its follow-up';
  end if;
  if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
    raise exception 'A team-facing unlink reason is required';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  select *
  into v_link
  from public.practice_development_action_links link
  where link.objective_id = v_objective.id
    and link.tenant_id = v_objective.tenant_id
    and link.archived_at is null
  for update;

  if not found then
    raise exception 'No active follow-up is linked';
  end if;

  update public.practice_development_action_links
  set archived_by = v_actor_id,
      archived_at = now()
  where id = v_link.id;

  update public.practice_development_objectives
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'action_unlinked',
    v_objective.status,
    v_objective.status,
    btrim(p_team_status_summary),
    nullif(btrim(coalesce(p_staff_note, '')), ''),
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_link.id,
    'action_id', v_link.action_id,
    'objective_id', v_objective.id,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.transition_practice_development_objective(
  p_objective_id uuid,
  p_expected_version integer,
  p_next_status text,
  p_team_status_summary text default null,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
  v_previous_status text;
  v_next_status text;
  v_event_type text;
  v_has_current_reviewed_evidence boolean;
  v_has_complete_action boolean;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Archived objectives must be restored before transition';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;
  if not exists (
    select 1
    from public.scrims source_scrim
    where source_scrim.id = v_objective.scrim_id
      and source_scrim.tenant_id = v_objective.tenant_id
      and source_scrim.archived_at is null
      and source_scrim.status is distinct from 'cancelled'
  ) then
    raise exception 'Practice block is unavailable';
  end if;

  select exists (
    select 1
    from public.practice_development_evidence evidence
    where evidence.objective_id = v_objective.id
      and evidence.tenant_id = v_objective.tenant_id
      and evidence.archived_at is null
      and evidence.state = 'reviewed'
      and security.practice_development_source_available(
        evidence.objective_id,
        evidence.source_type,
        evidence.source_id
      )
  ) into v_has_current_reviewed_evidence;

  select exists (
    select 1
    from public.practice_development_action_links link
    join public.coaching_actions action
      on action.id = link.action_id
     and action.tenant_id = link.tenant_id
    where link.objective_id = v_objective.id
      and link.tenant_id = v_objective.tenant_id
      and link.archived_at is null
      and action.archived_at is null
      and action.status = 'complete'
      and exists (
        select 1
        from public.tenant_users owner_membership
        where owner_membership.tenant_id = action.tenant_id
          and owner_membership.user_id = action.owner_user_id
          and owner_membership.role = any(
            array['owner', 'admin']::public.tenant_role[]
          )
      )
  ) into v_has_complete_action;

  v_previous_status := v_objective.status;

  if p_next_status = 'blocked'
    and v_previous_status in ('planned', 'evidenced')
  then
    if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
      raise exception 'A team-facing blocked reason is required';
    end if;
    v_next_status := 'blocked';
    v_event_type := 'blocked';
  elsif p_next_status = 'completed'
    and v_previous_status = 'evidenced'
  then
    if not v_has_current_reviewed_evidence then
      raise exception 'Current reviewed evidence is required before completion';
    end if;
    if not v_has_complete_action then
      raise exception 'A completed linked Coaching Action is required before completion';
    end if;
    if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
      raise exception 'A team-facing completion summary is required';
    end if;
    v_next_status := 'completed';
    v_event_type := 'completed';
  elsif p_next_status in ('planned', 'evidenced')
    and v_previous_status in ('blocked', 'completed')
  then
    if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
      raise exception 'A team-facing reopen reason is required';
    end if;
    v_next_status := case
      when v_has_current_reviewed_evidence then 'evidenced'
      else 'planned'
    end;
    v_event_type := 'reopened';
  else
    raise exception 'Unsupported practice-objective transition';
  end if;

  update public.practice_development_objectives
  set status = v_next_status,
      team_status_summary = btrim(p_team_status_summary),
      staff_note = nullif(btrim(coalesce(p_staff_note, '')), ''),
      completed_by = case
        when v_next_status = 'completed' then v_actor_id
        else null
      end,
      completed_at = case
        when v_next_status = 'completed' then now()
        else null
      end,
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    v_event_type,
    v_previous_status,
    v_objective.status,
    v_objective.team_status_summary,
    v_objective.staff_note,
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_objective.id,
    'status', v_objective.status,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.archive_practice_development_objective(
  p_objective_id uuid,
  p_expected_version integer,
  p_team_status_summary text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
begin
  -- Recovery exception: cancellation must not strand an active objective.
  -- Archiving closes the loop without deleting its evidence or event history.
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is not null then
    raise exception 'Practice objective is already archived';
  end if;
  if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
    raise exception 'A team-facing archive reason is required';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  update public.practice_development_objectives
  set archived_by = v_actor_id,
      archived_at = now(),
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'archived',
    v_objective.status,
    v_objective.status,
    btrim(p_team_status_summary),
    nullif(btrim(coalesce(p_staff_note, '')), ''),
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_objective.id,
    'status', v_objective.status,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.restore_practice_development_objective(
  p_objective_id uuid,
  p_expected_version integer,
  p_team_status_summary text,
  p_staff_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_objective public.practice_development_objectives;
begin
  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.id = p_objective_id
  for update;

  if not found then
    raise sqlstate '42501' using message = 'Practice development is unavailable';
  end if;
  v_actor_id := security.require_practice_development_staff(v_objective.tenant_id);

  if p_expected_version is null
    or v_objective.version <> p_expected_version
  then
    raise sqlstate '40001'
      using message = 'Practice objective changed; reload and retry';
  end if;
  if v_objective.archived_at is null then
    raise exception 'Practice objective is not archived';
  end if;
  if exists (
    select 1
    from public.practice_development_objectives active_objective
    where active_objective.tenant_id = v_objective.tenant_id
      and active_objective.scrim_id = v_objective.scrim_id
      and active_objective.archived_at is null
      and active_objective.id <> v_objective.id
  ) then
    raise exception 'This practice block already has an active objective';
  end if;
  if not exists (
    select 1
    from public.scrims scrim
    where scrim.id = v_objective.scrim_id
      and scrim.tenant_id = v_objective.tenant_id
      and scrim.archived_at is null
      and scrim.status is distinct from 'cancelled'
  ) then
    raise exception 'The source practice block is unavailable';
  end if;
  if char_length(btrim(coalesce(p_team_status_summary, ''))) not between 1 and 2000 then
    raise exception 'A team-facing restore reason is required';
  end if;
  if char_length(btrim(coalesce(p_staff_note, ''))) > 4000 then
    raise exception 'Staff note cannot exceed 4000 characters';
  end if;

  update public.practice_development_objectives
  set archived_by = null,
      archived_at = null,
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_objective.id
  returning * into v_objective;

  insert into public.practice_development_events (
    tenant_id,
    objective_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    team_summary,
    staff_note,
    version
  ) values (
    v_objective.tenant_id,
    v_objective.id,
    v_actor_id,
    'restored',
    v_objective.status,
    v_objective.status,
    btrim(p_team_status_summary),
    nullif(btrim(coalesce(p_staff_note, '')), ''),
    v_objective.version
  );

  return jsonb_build_object(
    'id', v_objective.id,
    'status', v_objective.status,
    'version', v_objective.version
  );
end;
$$;

create or replace function public.get_practice_development_loop(
  p_tenant_id uuid,
  p_scrim_id uuid,
  p_context_game_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_role public.tenant_role;
  v_is_staff boolean;
  v_projection text;
  v_scrim public.scrims;
  v_objective public.practice_development_objectives;
  v_evidence_json jsonb := '[]'::jsonb;
  v_link public.practice_development_action_links;
  v_action public.coaching_actions;
  v_action_json jsonb := null;
  v_next_session_json jsonb := jsonb_build_object('status', 'pending');
  v_objective_json jsonb;
  v_checkpoint public.scrims;
  v_checkpoint_id uuid;
  v_checkpoint_exists boolean := false;
  v_checkpoint_available boolean := false;
  v_has_declared_checkpoints boolean := false;
  v_action_available boolean := false;
  v_checkpoint_label text;
  v_owner_label text;
  v_scope_label text;
  v_planning_reason text;
begin
  if v_actor_id is null
    or not public.has_practice_development_access(p_tenant_id)
  then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  select membership.role
  into v_role
  from public.tenant_users membership
  where membership.tenant_id = p_tenant_id
    and membership.user_id = v_actor_id;

  if not found then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  if p_context_game_id is not null and not exists (
    select 1
    from public.scrim_games context_game
    join public.scrims context_scrim
      on context_scrim.id = context_game.scrim_id
    where context_game.id = p_context_game_id
      and context_game.scrim_id = p_scrim_id
      and context_scrim.tenant_id = p_tenant_id
      and context_scrim.archived_at is null
      and context_scrim.status is distinct from 'cancelled'
      and context_game.status <> 'cancelled'
  ) then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  v_is_staff := v_role = any(
    array['owner', 'admin']::public.tenant_role[]
  );
  v_projection := case when v_is_staff then 'staff-v1' else 'team-v1' end;

  select *
  into v_scrim
  from public.scrims scrim
  where scrim.id = p_scrim_id
    and scrim.tenant_id = p_tenant_id;

  if not found then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  select *
  into v_objective
  from public.practice_development_objectives objective
  where objective.tenant_id = p_tenant_id
    and objective.scrim_id = p_scrim_id
  order by (objective.archived_at is null) desc, objective.updated_at desc
  limit 1;

  if not found then
    v_planning_reason := case
      when v_scrim.status is not distinct from 'cancelled'
        then 'practice_block_cancelled'
      when v_scrim.archived_at is not null then 'practice_block_archived'
      when now() >= v_scrim.starts_at then 'planning_window_closed'
      else null
    end;

    return jsonb_build_object(
      'contract_version', 'practice-development-v1',
      'projection', v_projection,
      'scrim_id', p_scrim_id,
      'planning', jsonb_build_object(
        'can_create', v_planning_reason is null,
        'unavailable_reason', v_planning_reason
      ),
      'objective', null
    );
  end if;

  v_planning_reason := case
    when v_scrim.status is not distinct from 'cancelled'
      then 'practice_block_cancelled'
    when v_objective.archived_at is not null then 'objective_archived'
    else 'objective_exists'
  end;

  select coalesce(
    jsonb_agg(
      (
        jsonb_build_object(
          'id', evidence.id,
          'source_type', evidence.source_type,
          'source_label', evidence.source_label,
          'source_recorded_at', evidence.source_recorded_at,
          'state', case
            when security.practice_development_source_available(
              evidence.objective_id,
              evidence.source_type,
              evidence.source_id
            ) then evidence.state
            else 'unavailable'
          end,
          'availability', case
            when security.practice_development_source_available(
              evidence.objective_id,
              evidence.source_type,
              evidence.source_id
            ) then 'available'
            else 'unavailable'
          end,
          'team_summary', evidence.team_summary,
          'linked_at', evidence.linked_at,
          'reviewed_at', evidence.reviewed_at
        )
        || case
          when evidence.source_type = 'scrim_game'
            and evidence.source_id = p_context_game_id
            and security.practice_development_source_available(
              evidence.objective_id,
              evidence.source_type,
              evidence.source_id
            )
          then jsonb_build_object(
            'source_match_key', 'context_game'
          )
          when evidence.source_type = 'block_review'
            and security.practice_development_source_available(
              evidence.objective_id,
              evidence.source_type,
              evidence.source_id
            )
          then jsonb_build_object('source_match_key', 'block_review')
          else '{}'::jsonb
        end
        || case
          when v_is_staff then jsonb_build_object(
            'source_id', evidence.source_id,
            'staff_note', evidence.staff_note
          )
          else '{}'::jsonb
        end
      ) order by evidence.linked_at, evidence.id
    ),
    '[]'::jsonb
  )
  into v_evidence_json
  from public.practice_development_evidence evidence
  where evidence.objective_id = v_objective.id
    and evidence.tenant_id = v_objective.tenant_id
    and evidence.archived_at is null;

  select *
  into v_link
  from public.practice_development_action_links link
  where link.objective_id = v_objective.id
    and link.tenant_id = v_objective.tenant_id
    and link.archived_at is null
  order by link.created_at desc
  limit 1;

  if found then
    select *
    into v_action
    from public.coaching_actions action
    where action.id = v_link.action_id
      and action.tenant_id = v_link.tenant_id;

    if found then
      select v_scrim.archived_at is null
        and v_scrim.status is distinct from 'cancelled'
        and v_action.archived_at is null
        and exists (
          select 1
          from public.tenant_users owner_membership
          where owner_membership.tenant_id = v_action.tenant_id
            and owner_membership.user_id = v_action.owner_user_id
            and owner_membership.role = any(
              array['owner', 'admin']::public.tenant_role[]
            )
        ) into v_action_available;

      select nullif(btrim(profile.display_name), '')
      into v_owner_label
      from public.profiles profile
      where profile.id = v_action.owner_user_id;
      v_owner_label := coalesce(v_owner_label, 'Staff owner');

      v_scope_label := case v_action.scope_type
        when 'team' then 'Team'
        when 'unit' then coalesce(
          nullif(btrim(v_action.unit_label), ''),
          'Player unit'
        )
        when 'player' then coalesce(
          (
            select nullif(btrim(player.summoner_name), '')
            from public.players player
            where player.id = v_action.assignee_player_id
              and player.tenant_id = v_action.tenant_id
          ),
          'Player'
        )
        else 'Workspace'
      end;

      v_has_declared_checkpoints := v_action.follow_up_scrim_id is not null
        or cardinality(
          coalesce(v_action.checkpoint_scrim_ids, '{}'::uuid[])
        ) > 0;

      if v_action.follow_up_scrim_id is not null then
        -- An explicit canonical follow-up remains authoritative. If it later
        -- becomes unavailable, report that honestly instead of substituting a
        -- different checkpoint.
        v_checkpoint_id := v_action.follow_up_scrim_id;
      else
        -- Array order reflects click order, not chronology. Resolve the next
        -- eligible practice block deterministically from canonical scrim time.
        select checkpoint.id
        into v_checkpoint_id
        from unnest(
          coalesce(v_action.checkpoint_scrim_ids, '{}'::uuid[])
        ) checkpoint_id
        join public.scrims checkpoint
          on checkpoint.id = checkpoint_id
         and checkpoint.tenant_id = v_action.tenant_id
        where checkpoint.archived_at is null
          and checkpoint.status is distinct from 'cancelled'
          and checkpoint.starts_at > v_scrim.starts_at
        order by checkpoint.starts_at, checkpoint.id
        limit 1;
      end if;

      if v_checkpoint_id is not null then
        select *
        into v_checkpoint
        from public.scrims checkpoint
        where checkpoint.id = v_checkpoint_id
          and checkpoint.tenant_id = v_action.tenant_id;
        v_checkpoint_exists := found;
        v_checkpoint_available := v_checkpoint_exists
          and v_checkpoint.archived_at is null
          and v_checkpoint.status is distinct from 'cancelled'
          and v_checkpoint.starts_at > v_scrim.starts_at;

        if v_checkpoint_exists then
          v_checkpoint_label := v_checkpoint.opponent_name
            || ' - '
            || to_char(
              v_checkpoint.starts_at at time zone coalesce(v_checkpoint.timezone, 'UTC'),
              'DD Mon YYYY HH24:MI'
            );
        end if;
      end if;

      if v_is_staff or v_action_available then
        v_action_json := jsonb_build_object(
          'id', v_action.id,
          'title', v_action.title,
          'status', v_action.status,
          'category', v_action.category,
          'scope_label', v_scope_label,
          'owner_label', v_owner_label,
          'due_at', v_action.due_at,
          'availability', case
            when v_action_available then 'available'
            else 'unavailable'
          end
        ) || case
          when v_is_staff or v_checkpoint_available then jsonb_build_object(
            'checkpoint_scrim_id', v_checkpoint_id,
            'checkpoint_label', v_checkpoint_label
          )
          else '{}'::jsonb
        end;
      else
        v_action_json := jsonb_build_object(
          'status', 'unavailable',
          'availability', 'unavailable'
        );
      end if;

      v_next_session_json := jsonb_build_object(
        'status', case
          when not v_action_available then 'unavailable'
          when v_checkpoint_id is null
            and v_action.status in ('complete', 'dismissed') then 'unavailable'
          when v_checkpoint_id is null
            and v_has_declared_checkpoints then 'unavailable'
          when v_checkpoint_id is null then 'pending'
          when not v_checkpoint_available then 'unavailable'
          when v_checkpoint.review_status = 'complete' then 'reviewed'
          else 'scheduled'
        end
      ) || case
        when v_is_staff or v_checkpoint_available then jsonb_build_object(
          'id', case when v_checkpoint_exists then v_checkpoint.id else null end,
          'label', case when v_checkpoint_exists then v_checkpoint_label else null end
        )
        else '{}'::jsonb
      end;
    else
      v_action_json := case
        when v_is_staff then jsonb_build_object(
          'id', v_link.action_id,
          'title', 'Follow-up unavailable',
          'status', 'unavailable',
          'category', null,
          'scope_label', 'Unavailable',
          'owner_label', 'Staff owner',
          'due_at', null,
          'checkpoint_scrim_id', null,
          'checkpoint_label', null,
          'availability', 'unavailable'
        )
        else jsonb_build_object(
          'status', 'unavailable',
          'availability', 'unavailable'
        )
      end;
      v_next_session_json := jsonb_build_object('status', 'unavailable');
    end if;
  end if;

  v_objective_json := jsonb_build_object(
    'id', v_objective.id,
    'title', v_objective.title,
    'evidence_standard', v_objective.evidence_standard,
    'status', v_objective.status,
    'team_status_summary', v_objective.team_status_summary,
    'version', v_objective.version,
    'created_at', v_objective.created_at,
    'updated_at', v_objective.updated_at,
    'availability', case
      when v_scrim.archived_at is not null
        or v_scrim.status is not distinct from 'cancelled' then 'unavailable'
      else 'available'
    end,
    'is_archived', v_objective.archived_at is not null,
    'archived_at', v_objective.archived_at,
    'evidence', v_evidence_json,
    'action', v_action_json,
    'next_session', v_next_session_json
  );

  if v_is_staff then
    v_objective_json := v_objective_json
      || jsonb_build_object('staff_note', v_objective.staff_note);
  end if;

  return jsonb_build_object(
    'contract_version', 'practice-development-v1',
    'projection', v_projection,
    'scrim_id', p_scrim_id,
    'planning', jsonb_build_object(
      'can_create', false,
      'unavailable_reason', v_planning_reason
    ),
    'objective', v_objective_json
  );
end;
$$;

create or replace function public.get_practice_development_action_breadcrumbs(
  p_tenant_id uuid,
  p_action_ids uuid[]
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_actor_id is null
    or not public.has_practice_development_access(p_tenant_id)
  then
    raise sqlstate '42501'
      using message = 'Practice development is unavailable';
  end if;

  -- Bound the raw request before any unnest/group work. Otherwise a caller can
  -- bypass a distinct-ID cap with a very large array containing duplicates.
  if cardinality(coalesce(p_action_ids, '{}'::uuid[])) > 200 then
    raise sqlstate '22023'
      using message = 'At most 200 action identifiers may be requested';
  end if;

  with requested as (
    select
      input.action_id,
      min(input.ordinality) as first_ordinality
    from unnest(coalesce(p_action_ids, '{}'::uuid[]))
      with ordinality as input(action_id, ordinality)
    where input.action_id is not null
    group by input.action_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'action_id', action.id,
        'scrim_id', objective.scrim_id,
        'objective_title', objective.title,
        'objective_status', objective.status,
        'is_archived', objective.archived_at is not null,
        'availability', case
          when source_scrim.id is not null
            and source_scrim.archived_at is null
            and source_scrim.status is distinct from 'cancelled'
            then 'available'
          else 'unavailable'
        end
      ) order by requested.first_ordinality
    ),
    '[]'::jsonb
  )
  into v_result
  from requested
  join public.coaching_actions action
    on action.id = requested.action_id
   and action.tenant_id = p_tenant_id
   and action.archived_at is null
  join public.practice_development_action_links link
    on link.action_id = action.id
   and link.tenant_id = action.tenant_id
   and link.archived_at is null
  join public.practice_development_objectives objective
    on objective.id = link.objective_id
   and objective.tenant_id = link.tenant_id
  left join public.scrims source_scrim
    on source_scrim.id = objective.scrim_id
   and source_scrim.tenant_id = objective.tenant_id;

  return v_result;
end;
$$;

-- PostgreSQL grants new functions to PUBLIC by default. Lock every customer
-- signature first, then expose only the authenticated RPC surface.
revoke all on function public.get_practice_development_loop(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.get_practice_development_action_breadcrumbs(uuid, uuid[])
  from public, anon, authenticated;
revoke all on function public.create_practice_development_objective(uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.update_practice_development_objective(uuid, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.link_practice_development_evidence(uuid, integer, text, uuid)
  from public, anon, authenticated;
revoke all on function public.review_practice_development_evidence(uuid, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.record_practice_development_unavailable(uuid, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.attach_practice_development_follow_up(uuid, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.detach_practice_development_follow_up(uuid, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.transition_practice_development_objective(uuid, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.archive_practice_development_objective(uuid, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.restore_practice_development_objective(uuid, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.get_practice_development_loop(uuid, uuid, uuid)
  to authenticated;
grant execute on function public.get_practice_development_action_breadcrumbs(uuid, uuid[])
  to authenticated;
grant execute on function public.create_practice_development_objective(uuid, uuid, text, text, text)
  to authenticated;
grant execute on function public.update_practice_development_objective(uuid, integer, text, text, text)
  to authenticated;
grant execute on function public.link_practice_development_evidence(uuid, integer, text, uuid)
  to authenticated;
grant execute on function public.review_practice_development_evidence(uuid, integer, text, text)
  to authenticated;
grant execute on function public.record_practice_development_unavailable(uuid, integer, text, text)
  to authenticated;
grant execute on function public.attach_practice_development_follow_up(uuid, integer, uuid)
  to authenticated;
grant execute on function public.detach_practice_development_follow_up(uuid, integer, text, text)
  to authenticated;
grant execute on function public.transition_practice_development_objective(uuid, integer, text, text, text)
  to authenticated;
grant execute on function public.archive_practice_development_objective(uuid, integer, text, text)
  to authenticated;
grant execute on function public.restore_practice_development_objective(uuid, integer, text, text)
  to authenticated;

comment on function public.get_practice_development_loop(uuid, uuid, uuid) is
  'Returns staff-v1 or team-v1 practice-development JSON after exact member, Elite, live, and enabled checks; optional same-block game context yields only a non-ID context_game match key.';
comment on function public.get_practice_development_action_breadcrumbs(uuid, uuid[]) is
  'Returns at most 200 safe same-tenant objective breadcrumbs for active linked Coaching Actions after exact practice-development access checks.';
comment on function public.create_practice_development_objective(uuid, uuid, text, text, text) is
  'Creates one pre-practice objective after server-side Elite, module, staff, tenant, and planning-window validation.';
comment on function public.update_practice_development_objective(uuid, integer, text, text, text) is
  'Updates planning fields before practice/evidence using an expected objective version.';
comment on function public.link_practice_development_evidence(uuid, integer, text, uuid) is
  'Links a completed same-block game or completed block review without copying raw source content.';
comment on function public.review_practice_development_evidence(uuid, integer, text, text) is
  'Records a factual staff evidence review and moves the objective to evidenced; it does not infer improvement.';
comment on function public.record_practice_development_unavailable(uuid, integer, text, text) is
  'Records an explicit team-facing unavailable evidence state without evidencing the objective.';
comment on function public.attach_practice_development_follow_up(uuid, integer, uuid) is
  'Links one validated canonical Coaching Action to an evidenced practice objective; it does not create or notify automatically.';
comment on function public.detach_practice_development_follow_up(uuid, integer, text, text) is
  'Soft-unlinks an incorrectly attached follow-up with versioned audit provenance.';
comment on function public.transition_practice_development_objective(uuid, integer, text, text, text) is
  'Blocks, completes, or reopens a practice objective while enforcing current evidence/action prerequisites.';
comment on function public.archive_practice_development_objective(uuid, integer, text, text) is
  'Archives an objective without deleting objective, evidence, action-link, or event history.';
comment on function public.restore_practice_development_objective(uuid, integer, text, text) is
  'Restores an archived objective after staff, entitlement, version, source-block, and active-objective validation.';

notify pgrst, 'reload schema';
