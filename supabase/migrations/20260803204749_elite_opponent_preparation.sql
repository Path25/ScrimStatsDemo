-- WO-2026-036 Phase 2A: Elite opponent-preparation security boundary.
--
-- This migration is additive and fail closed. Every existing and future
-- workspace receives opponent_preparation as planned/false. No customer can
-- read or mutate this workflow unless the workspace is exactly Elite, the
-- actor is an Owner or Admin, and the module is explicitly live/enabled.

-- Register the module without changing any existing plan entitlement.
alter table public.tenant_feature_access
  drop constraint if exists tenant_feature_access_module_key_check;

alter table public.tenant_feature_access
  add constraint tenant_feature_access_module_key_check check (module_key in (
    'operations', 'soloq', 'analytics', 'scouting', 'draft_preparation',
    'collector', 'discord', 'practice_development', 'opponent_preparation'
  ));

-- Preserve the existing entitlement synchronizer and add one fail-closed row.
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
  ) values
    (new.id, 'practice_development', 'planned', false, now()),
    (new.id, 'opponent_preparation', 'planned', false, now())
  on conflict (tenant_id, module_key) do nothing;

  -- Downgrades fail closed. Elite upgrades never auto-enable either controlled
  -- module and never promote a planned/beta release state.
  if new.subscription_tier::text <> 'elite' then
    update public.tenant_feature_access
    set is_enabled = false,
        updated_at = now(),
        updated_by = null
    where tenant_id = new.id
      and module_key in ('practice_development', 'opponent_preparation')
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
  'Synchronizes existing plan modules, seeds controlled Elite modules planned/disabled, disables them on downgrade, and never auto-enables them on upgrade.';

insert into public.tenant_feature_access (
  tenant_id, module_key, release_state, is_enabled, updated_at
)
select tenant.id, 'opponent_preparation', 'planned', false, now()
from public.tenants tenant
on conflict (tenant_id, module_key) do nothing;

create or replace function public.has_opponent_preparation_access(
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
       and access.module_key = 'opponent_preparation'
      where membership.tenant_id = p_tenant_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(
          array['owner', 'admin']::public.tenant_role[]
        )
        and tenant.subscription_tier::text = 'elite'
        and public.collector_entitlement_active(
          tenant.subscription_tier,
          tenant.subscription_status,
          tenant.subscription_period_end,
          tenant.subscription_past_due_started_at
        )
        and access.release_state = 'live'
        and access.is_enabled is true
    );
$$;

revoke all on function public.has_opponent_preparation_access(uuid)
  from public, anon, authenticated;
grant execute on function public.has_opponent_preparation_access(uuid)
  to authenticated;

comment on function public.has_opponent_preparation_access(uuid) is
  'Returns true only for an authenticated Owner/Admin in an exact Elite workspace whose opponent_preparation module is live and enabled.';

create table public.opponent_preparation_playbooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opponent_team_id uuid not null,
  title text not null,
  version integer not null default 1,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  archived_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  constraint opponent_preparation_playbooks_id_tenant_unique
    unique (id, tenant_id),
  constraint opponent_preparation_playbooks_opponent_tenant_fkey
    foreign key (opponent_team_id, tenant_id)
    references public.opponent_teams(id, tenant_id) on delete restrict,
  constraint opponent_preparation_playbooks_title_check
    check (char_length(btrim(title)) between 1 and 140),
  constraint opponent_preparation_playbooks_version_check
    check (version >= 1),
  constraint opponent_preparation_playbooks_archive_check
    check ((archived_at is null) = (archived_by is null))
);

create unique index opponent_preparation_playbooks_active_opponent_key
  on public.opponent_preparation_playbooks (tenant_id, opponent_team_id)
  where archived_at is null;
create index opponent_preparation_playbooks_tenant_updated_idx
  on public.opponent_preparation_playbooks (tenant_id, updated_at desc);
create index opponent_preparation_playbooks_opponent_idx
  on public.opponent_preparation_playbooks (opponent_team_id);
create index opponent_preparation_playbooks_created_by_idx
  on public.opponent_preparation_playbooks (created_by);
create index opponent_preparation_playbooks_updated_by_idx
  on public.opponent_preparation_playbooks (updated_by);
create index opponent_preparation_playbooks_archived_by_idx
  on public.opponent_preparation_playbooks (archived_by)
  where archived_by is not null;

create table public.opponent_preparation_revisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  playbook_id uuid not null,
  revision_number integer not null,
  status text not null default 'draft',
  title text not null,
  fixture_scrim_id uuid,
  context_label text,
  patch_label text,
  staff_judgement text not null default '',
  version integer not null default 1,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  constraint opponent_preparation_revisions_id_tenant_unique
    unique (id, tenant_id),
  constraint opponent_preparation_revisions_playbook_tenant_fkey
    foreign key (playbook_id, tenant_id)
    references public.opponent_preparation_playbooks(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_revisions_fixture_tenant_fkey
    foreign key (fixture_scrim_id, tenant_id)
    references public.scrims(id, tenant_id) on delete restrict,
  constraint opponent_preparation_revisions_number_unique
    unique (playbook_id, revision_number),
  constraint opponent_preparation_revisions_number_check
    check (revision_number >= 1),
  constraint opponent_preparation_revisions_status_check
    check (status in ('draft', 'approved')),
  constraint opponent_preparation_revisions_title_check
    check (char_length(btrim(title)) between 1 and 140),
  constraint opponent_preparation_revisions_context_check
    check (context_label is null or char_length(btrim(context_label)) between 1 and 300),
  constraint opponent_preparation_revisions_patch_check
    check (patch_label is null or char_length(btrim(patch_label)) between 1 and 40),
  constraint opponent_preparation_revisions_judgement_check
    check (char_length(staff_judgement) <= 4000),
  constraint opponent_preparation_revisions_version_check
    check (version >= 1),
  constraint opponent_preparation_revisions_approval_check
    check (
      (status = 'draft' and approved_by is null and approved_at is null)
      or (status = 'approved' and approved_by is not null and approved_at is not null)
    )
);

create unique index opponent_preparation_revisions_one_draft_key
  on public.opponent_preparation_revisions (tenant_id, playbook_id)
  where status = 'draft';
create index opponent_preparation_revisions_playbook_history_idx
  on public.opponent_preparation_revisions (
    tenant_id, playbook_id, revision_number desc
  );
create index opponent_preparation_revisions_fixture_idx
  on public.opponent_preparation_revisions (fixture_scrim_id)
  where fixture_scrim_id is not null;
create index opponent_preparation_revisions_created_by_idx
  on public.opponent_preparation_revisions (created_by);
create index opponent_preparation_revisions_updated_by_idx
  on public.opponent_preparation_revisions (updated_by);
create index opponent_preparation_revisions_approved_by_idx
  on public.opponent_preparation_revisions (approved_by)
  where approved_by is not null;

create table public.opponent_preparation_evidence_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  revision_id uuid not null,
  source_type text not null,
  source_id uuid,
  source_label text not null,
  source_recorded_at timestamptz not null,
  source_patch_label text,
  staff_relevance_note text,
  insufficient_reason text,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  removed_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz,
  constraint opponent_preparation_evidence_links_id_tenant_unique
    unique (id, tenant_id),
  constraint opponent_preparation_evidence_links_revision_tenant_fkey
    foreign key (revision_id, tenant_id)
    references public.opponent_preparation_revisions(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_evidence_links_source_type_check
    check (source_type in (
      'scouting_evidence', 'preparation_brief', 'draft_playbook',
      'declared_insufficient'
    )),
  constraint opponent_preparation_evidence_links_source_shape_check
    check (
      (
        source_type = 'declared_insufficient'
        and source_id is null
        and nullif(btrim(insufficient_reason), '') is not null
      )
      or (
        source_type <> 'declared_insufficient'
        and source_id is not null
        and insufficient_reason is null
      )
    ),
  constraint opponent_preparation_evidence_links_label_check
    check (char_length(btrim(source_label)) between 1 and 180),
  constraint opponent_preparation_evidence_links_patch_check
    check (
      source_patch_label is null
      or char_length(btrim(source_patch_label)) between 1 and 40
    ),
  constraint opponent_preparation_evidence_links_relevance_check
    check (
      staff_relevance_note is null
      or char_length(btrim(staff_relevance_note)) between 1 and 1000
    ),
  constraint opponent_preparation_evidence_links_insufficient_check
    check (
      insufficient_reason is null
      or char_length(btrim(insufficient_reason)) between 1 and 1000
    ),
  constraint opponent_preparation_evidence_links_removed_check
    check ((removed_at is null) = (removed_by is null))
);

create unique index opponent_preparation_evidence_active_source_key
  on public.opponent_preparation_evidence_links (
    tenant_id, revision_id, source_type, source_id
  )
  where removed_at is null and source_id is not null;
create unique index opponent_preparation_evidence_active_insufficient_key
  on public.opponent_preparation_evidence_links (
    tenant_id, revision_id, source_type
  )
  where removed_at is null and source_type = 'declared_insufficient';
create index opponent_preparation_evidence_revision_idx
  on public.opponent_preparation_evidence_links (
    tenant_id, revision_id, linked_at, id
  );
create index opponent_preparation_evidence_source_idx
  on public.opponent_preparation_evidence_links (source_id)
  where source_id is not null;
create index opponent_preparation_evidence_linked_by_idx
  on public.opponent_preparation_evidence_links (linked_by);
create index opponent_preparation_evidence_removed_by_idx
  on public.opponent_preparation_evidence_links (removed_by)
  where removed_by is not null;

create table public.opponent_preparation_action_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  revision_id uuid not null,
  action_id uuid not null,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  removed_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz,
  constraint opponent_preparation_action_links_id_tenant_unique
    unique (id, tenant_id),
  constraint opponent_preparation_action_links_revision_tenant_fkey
    foreign key (revision_id, tenant_id)
    references public.opponent_preparation_revisions(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_action_links_action_tenant_fkey
    foreign key (action_id, tenant_id)
    references public.coaching_actions(id, tenant_id) on delete restrict,
  constraint opponent_preparation_action_links_removed_check
    check ((removed_at is null) = (removed_by is null))
);

create unique index opponent_preparation_actions_active_key
  on public.opponent_preparation_action_links (
    tenant_id, revision_id, action_id
  )
  where removed_at is null;
create index opponent_preparation_actions_revision_idx
  on public.opponent_preparation_action_links (
    tenant_id, revision_id, linked_at, id
  );
create index opponent_preparation_actions_action_idx
  on public.opponent_preparation_action_links (action_id);
create index opponent_preparation_actions_linked_by_idx
  on public.opponent_preparation_action_links (linked_by);
create index opponent_preparation_actions_removed_by_idx
  on public.opponent_preparation_action_links (removed_by)
  where removed_by is not null;

create table public.opponent_preparation_review_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  revision_id uuid not null,
  scrim_id uuid not null,
  staff_outcome_summary text not null,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  removed_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz,
  constraint opponent_preparation_review_links_id_tenant_unique
    unique (id, tenant_id),
  constraint opponent_preparation_review_links_revision_tenant_fkey
    foreign key (revision_id, tenant_id)
    references public.opponent_preparation_revisions(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_review_links_scrim_tenant_fkey
    foreign key (scrim_id, tenant_id)
    references public.scrims(id, tenant_id) on delete restrict,
  constraint opponent_preparation_review_links_summary_check
    check (char_length(btrim(staff_outcome_summary)) between 1 and 2000),
  constraint opponent_preparation_review_links_removed_check
    check ((removed_at is null) = (removed_by is null))
);

create unique index opponent_preparation_reviews_active_revision_key
  on public.opponent_preparation_review_links (tenant_id, revision_id)
  where removed_at is null;
create index opponent_preparation_reviews_revision_idx
  on public.opponent_preparation_review_links (
    tenant_id, revision_id, linked_at desc
  );
create index opponent_preparation_reviews_scrim_idx
  on public.opponent_preparation_review_links (scrim_id);
create index opponent_preparation_reviews_linked_by_idx
  on public.opponent_preparation_review_links (linked_by);
create index opponent_preparation_reviews_removed_by_idx
  on public.opponent_preparation_review_links (removed_by)
  where removed_by is not null;

create table public.opponent_preparation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  playbook_id uuid not null,
  revision_id uuid,
  actor_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null,
  resulting_version integer not null,
  summary text,
  created_at timestamptz not null default now(),
  constraint opponent_preparation_events_playbook_tenant_fkey
    foreign key (playbook_id, tenant_id)
    references public.opponent_preparation_playbooks(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_events_revision_tenant_fkey
    foreign key (revision_id, tenant_id)
    references public.opponent_preparation_revisions(id, tenant_id)
    on delete restrict,
  constraint opponent_preparation_events_type_check
    check (event_type in (
      'created', 'draft_updated', 'evidence_linked', 'evidence_unlinked',
      'action_linked', 'action_unlinked', 'approved', 'revision_created',
      'review_linked', 'review_unlinked', 'archived', 'restored'
    )),
  constraint opponent_preparation_events_version_check
    check (resulting_version >= 1),
  constraint opponent_preparation_events_summary_check
    check (summary is null or char_length(btrim(summary)) between 1 and 1000)
);

create index opponent_preparation_events_playbook_created_idx
  on public.opponent_preparation_events (
    tenant_id, playbook_id, created_at, id
  );
create index opponent_preparation_events_revision_idx
  on public.opponent_preparation_events (revision_id)
  where revision_id is not null;
create index opponent_preparation_events_actor_idx
  on public.opponent_preparation_events (actor_id);

alter table public.opponent_preparation_playbooks enable row level security;
alter table public.opponent_preparation_revisions enable row level security;
alter table public.opponent_preparation_evidence_links enable row level security;
alter table public.opponent_preparation_action_links enable row level security;
alter table public.opponent_preparation_review_links enable row level security;
alter table public.opponent_preparation_events enable row level security;

alter table public.opponent_preparation_playbooks force row level security;
alter table public.opponent_preparation_revisions force row level security;
alter table public.opponent_preparation_evidence_links force row level security;
alter table public.opponent_preparation_action_links force row level security;
alter table public.opponent_preparation_review_links force row level security;
alter table public.opponent_preparation_events force row level security;

revoke all on table
  public.opponent_preparation_playbooks,
  public.opponent_preparation_revisions,
  public.opponent_preparation_evidence_links,
  public.opponent_preparation_action_links,
  public.opponent_preparation_review_links,
  public.opponent_preparation_events
from public, anon, authenticated;

grant select, insert, update on table
  public.opponent_preparation_playbooks,
  public.opponent_preparation_revisions,
  public.opponent_preparation_evidence_links,
  public.opponent_preparation_action_links,
  public.opponent_preparation_review_links
to service_role;
grant select, insert on table public.opponent_preparation_events
  to service_role;

comment on table public.opponent_preparation_playbooks is
  'Private Elite season-long opponent preparation containers; browser access is RPC-only.';
comment on table public.opponent_preparation_revisions is
  'Private draft and immutable approved match-week preparation revisions.';
comment on table public.opponent_preparation_evidence_links is
  'References only permitted tenant-owned sources or an explicit insufficient-evidence declaration.';
comment on table public.opponent_preparation_action_links is
  'References canonical Coaching Actions without copying ownership or lifecycle state.';
comment on table public.opponent_preparation_review_links is
  'References a completed same-opponent Scrim Block review plus explicit staff outcome judgement.';
comment on table public.opponent_preparation_events is
  'Append-only audit history for opponent-preparation lifecycle changes.';

create or replace function security.require_opponent_preparation_staff(
  p_tenant_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null
    or not public.has_opponent_preparation_access(p_tenant_id)
  then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  return v_actor_id;
end;
$$;

revoke all on function security.require_opponent_preparation_staff(uuid)
  from public, anon, authenticated, service_role;

comment on function security.require_opponent_preparation_staff(uuid) is
  'Returns the authenticated actor only after exact Elite, live/enabled module, tenant, and Owner/Admin checks.';

create or replace function security.record_opponent_preparation_event(
  p_tenant_id uuid,
  p_playbook_id uuid,
  p_revision_id uuid,
  p_actor_id uuid,
  p_event_type text,
  p_resulting_version integer,
  p_summary text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.opponent_preparation_events (
    tenant_id,
    playbook_id,
    revision_id,
    actor_id,
    event_type,
    resulting_version,
    summary
  ) values (
    p_tenant_id,
    p_playbook_id,
    p_revision_id,
    p_actor_id,
    p_event_type,
    p_resulting_version,
    nullif(btrim(coalesce(p_summary, '')), '')
  );
end;
$$;

revoke all on function security.record_opponent_preparation_event(
  uuid, uuid, uuid, uuid, text, integer, text
) from public, anon, authenticated, service_role;

create or replace function security.prevent_opponent_preparation_event_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise sqlstate '42501'
    using message = 'Opponent preparation history is immutable';
end;
$$;

revoke all on function security.prevent_opponent_preparation_event_change()
  from public, anon, authenticated, service_role;

create trigger prevent_opponent_preparation_event_change_trigger
before update or delete on public.opponent_preparation_events
for each row execute function security.prevent_opponent_preparation_event_change();

create or replace function security.prevent_approved_opponent_preparation_revision_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation revisions are immutable';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function security.prevent_approved_opponent_preparation_revision_change()
  from public, anon, authenticated, service_role;

create trigger prevent_approved_opponent_preparation_revision_change_trigger
before update or delete on public.opponent_preparation_revisions
for each row execute function security.prevent_approved_opponent_preparation_revision_change();

create or replace function security.require_draft_opponent_preparation_link()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_revision_id uuid;
  v_status text;
begin
  v_revision_id := case
    when tg_op = 'DELETE' then old.revision_id
    else new.revision_id
  end;

  select revision.status
  into v_status
  from public.opponent_preparation_revisions revision
  where revision.id = v_revision_id;

  if v_status is distinct from 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation links are immutable';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function security.require_draft_opponent_preparation_link()
  from public, anon, authenticated, service_role;

create trigger require_draft_opponent_preparation_evidence_link_trigger
before insert or update or delete on public.opponent_preparation_evidence_links
for each row execute function security.require_draft_opponent_preparation_link();

create trigger require_draft_opponent_preparation_action_link_trigger
before insert or update or delete on public.opponent_preparation_action_links
for each row execute function security.require_draft_opponent_preparation_link();

create or replace function security.validate_opponent_preparation_fixture()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_opponent_team_id uuid;
begin
  if new.fixture_scrim_id is null then
    return new;
  end if;

  select playbook.opponent_team_id
  into v_opponent_team_id
  from public.opponent_preparation_playbooks playbook
  where playbook.id = new.playbook_id
    and playbook.tenant_id = new.tenant_id;

  if not exists (
    select 1
    from public.scrims scrim
    where scrim.id = new.fixture_scrim_id
      and scrim.tenant_id = new.tenant_id
      and scrim.opponent_team_id = v_opponent_team_id
      and scrim.archived_at is null
      and scrim.status is distinct from 'cancelled'
  ) then
    raise sqlstate '23514'
      using message = 'Preparation fixture must be an active same-opponent block';
  end if;

  return new;
end;
$$;

revoke all on function security.validate_opponent_preparation_fixture()
  from public, anon, authenticated, service_role;

create trigger validate_opponent_preparation_fixture_trigger
before insert or update of fixture_scrim_id, playbook_id, tenant_id
on public.opponent_preparation_revisions
for each row execute function security.validate_opponent_preparation_fixture();

create or replace function security.validate_opponent_preparation_evidence_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opponent_team_id uuid;
  v_label text;
  v_recorded_at timestamptz;
  v_patch_label text;
begin
  if tg_op = 'UPDATE'
    and old.removed_at is null
    and new.removed_at is not null
  then
    return new;
  end if;

  select playbook.opponent_team_id
  into v_opponent_team_id
  from public.opponent_preparation_revisions revision
  join public.opponent_preparation_playbooks playbook
    on playbook.id = revision.playbook_id
   and playbook.tenant_id = revision.tenant_id
  where revision.id = new.revision_id
    and revision.tenant_id = new.tenant_id
    and revision.status = 'draft'
    and playbook.archived_at is null;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation evidence is unavailable';
  end if;

  if new.source_type = 'declared_insufficient' then
    if new.source_id is not null
      or nullif(btrim(coalesce(new.insufficient_reason, '')), '') is null
    then
      raise sqlstate '22023'
        using message = 'An insufficient-evidence reason is required';
    end if;

    new.source_label := 'Evidence insufficient';
    new.source_recorded_at := coalesce(new.source_recorded_at, now());
    new.source_patch_label := null;
    return new;
  end if;

  if new.source_type = 'scouting_evidence' then
    select evidence.title, evidence.observed_at, null::text
    into v_label, v_recorded_at, v_patch_label
    from public.scouting_evidence evidence
    where evidence.id = new.source_id
      and evidence.tenant_id = new.tenant_id
      and evidence.opponent_team_id = v_opponent_team_id
      and evidence.lifecycle_state = 'active';
  elsif new.source_type = 'preparation_brief' then
    select brief.title,
      coalesce(brief.published_at, brief.updated_at),
      brief.patch_label
    into v_label, v_recorded_at, v_patch_label
    from public.preparation_briefs brief
    where brief.id = new.source_id
      and brief.tenant_id = new.tenant_id
      and brief.opponent_team_id = v_opponent_team_id
      and brief.status in ('published', 'archived')
      and brief.snapshot is not null;
  elsif new.source_type = 'draft_playbook' then
    select playbook.title,
      coalesce(playbook.published_at, playbook.updated_at),
      playbook.patch_label
    into v_label, v_recorded_at, v_patch_label
    from public.draft_playbooks playbook
    where playbook.id = new.source_id
      and playbook.tenant_id = new.tenant_id
      and playbook.status in ('published', 'archived')
      and playbook.snapshot is not null;
  else
    raise sqlstate '22023'
      using message = 'Unsupported opponent preparation source';
  end if;

  if v_label is null or v_recorded_at is null then
    raise sqlstate '42501'
      using message = 'Opponent preparation evidence is unavailable';
  end if;

  new.source_label := v_label;
  new.source_recorded_at := v_recorded_at;
  new.source_patch_label := nullif(btrim(coalesce(v_patch_label, '')), '');
  new.insufficient_reason := null;
  return new;
end;
$$;

revoke all on function security.validate_opponent_preparation_evidence_link()
  from public, anon, authenticated, service_role;

create trigger validate_opponent_preparation_evidence_link_trigger
before insert or update on public.opponent_preparation_evidence_links
for each row execute function security.validate_opponent_preparation_evidence_link();

create or replace function security.validate_opponent_preparation_action_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.removed_at is null
    and new.removed_at is not null
  then
    return new;
  end if;

  if not exists (
    select 1
    from public.opponent_preparation_revisions revision
    join public.opponent_preparation_playbooks playbook
      on playbook.id = revision.playbook_id
     and playbook.tenant_id = revision.tenant_id
    join public.coaching_actions action
      on action.id = new.action_id
     and action.tenant_id = revision.tenant_id
    where revision.id = new.revision_id
      and revision.tenant_id = new.tenant_id
      and revision.status = 'draft'
      and playbook.archived_at is null
      and action.archived_at is null
  ) then
    raise sqlstate '42501'
      using message = 'Opponent preparation action is unavailable';
  end if;

  return new;
end;
$$;

revoke all on function security.validate_opponent_preparation_action_link()
  from public, anon, authenticated, service_role;

create trigger validate_opponent_preparation_action_link_trigger
before insert or update on public.opponent_preparation_action_links
for each row execute function security.validate_opponent_preparation_action_link();

create or replace function security.validate_opponent_preparation_review_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.removed_at is null
    and new.removed_at is not null
  then
    return new;
  end if;

  if not exists (
    select 1
    from public.opponent_preparation_revisions revision
    join public.opponent_preparation_playbooks playbook
      on playbook.id = revision.playbook_id
     and playbook.tenant_id = revision.tenant_id
    join public.scrims scrim
      on scrim.id = new.scrim_id
     and scrim.tenant_id = revision.tenant_id
     and scrim.opponent_team_id = playbook.opponent_team_id
    where revision.id = new.revision_id
      and revision.tenant_id = new.tenant_id
      and revision.status = 'approved'
      and playbook.archived_at is null
      and scrim.archived_at is null
      and scrim.status is distinct from 'cancelled'
      and scrim.review_status = 'complete'
  ) then
    raise sqlstate '42501'
      using message = 'Opponent preparation review is unavailable';
  end if;

  return new;
end;
$$;

revoke all on function security.validate_opponent_preparation_review_link()
  from public, anon, authenticated, service_role;

create trigger validate_opponent_preparation_review_link_trigger
before insert or update on public.opponent_preparation_review_links
for each row execute function security.validate_opponent_preparation_review_link();

create or replace function security.opponent_preparation_evidence_availability(
  p_tenant_id uuid,
  p_opponent_team_id uuid,
  p_source_type text,
  p_source_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_source_type = 'declared_insufficient' then
    return 'insufficient';
  end if;

  if p_source_type = 'scouting_evidence' then
    if exists (
      select 1
      from public.scouting_evidence evidence
      where evidence.id = p_source_id
        and evidence.tenant_id = p_tenant_id
        and evidence.opponent_team_id = p_opponent_team_id
        and evidence.lifecycle_state = 'active'
    ) then
      return 'available';
    end if;

    if exists (
      select 1
      from public.scouting_evidence evidence
      where evidence.id = p_source_id
        and evidence.tenant_id = p_tenant_id
        and evidence.opponent_team_id = p_opponent_team_id
        and evidence.lifecycle_state = 'superseded'
    ) then
      return 'superseded';
    end if;
  elsif p_source_type = 'preparation_brief' then
    if exists (
      select 1
      from public.preparation_briefs brief
      where brief.id = p_source_id
        and brief.tenant_id = p_tenant_id
        and brief.opponent_team_id = p_opponent_team_id
        and brief.status in ('published', 'archived')
        and brief.snapshot is not null
    ) then
      return 'available';
    end if;
  elsif p_source_type = 'draft_playbook' then
    if exists (
      select 1
      from public.draft_playbooks playbook
      where playbook.id = p_source_id
        and playbook.tenant_id = p_tenant_id
        and playbook.status in ('published', 'archived')
        and playbook.snapshot is not null
    ) then
      return 'available';
    end if;
  end if;

  return 'unavailable';
end;
$$;

revoke all on function security.opponent_preparation_evidence_availability(
  uuid, uuid, text, uuid
) from public, anon, authenticated, service_role;

create or replace function public.get_opponent_preparation_playbook(
  p_tenant_id uuid,
  p_opponent_team_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_opponent_label text;
  v_playbook public.opponent_preparation_playbooks;
  v_revisions jsonb;
begin
  perform security.require_opponent_preparation_staff(p_tenant_id);

  select opponent.name
  into v_opponent_label
  from public.opponent_teams opponent
  where opponent.id = p_opponent_team_id
    and opponent.tenant_id = p_tenant_id;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  select playbook.*
  into v_playbook
  from public.opponent_preparation_playbooks playbook
  where playbook.tenant_id = p_tenant_id
    and playbook.opponent_team_id = p_opponent_team_id
  order by (playbook.archived_at is null) desc, playbook.updated_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'contract_version', 'opponent-preparation-v1',
      'projection', 'staff-v1',
      'opponent', jsonb_build_object(
        'id', p_opponent_team_id,
        'name', v_opponent_label
      ),
      'playbook', null
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', revision.id,
        'revision_number', revision.revision_number,
        'status', revision.status,
        'title', revision.title,
        'fixture_scrim_id', revision.fixture_scrim_id,
        'fixture_label', case
          when fixture.id is null then null
          else fixture.opponent_name || ' - ' || to_char(
            fixture.starts_at at time zone coalesce(fixture.timezone, 'UTC'),
            'DD Mon YYYY HH24:MI'
          )
        end,
        'fixture_availability', case
          when revision.fixture_scrim_id is null then 'not_recorded'
          when fixture.id is not null
            and fixture.archived_at is null
            and fixture.status is distinct from 'cancelled'
            and fixture.opponent_team_id = v_playbook.opponent_team_id
            then 'available'
          else 'unavailable'
        end,
        'context_label', revision.context_label,
        'context_state', case
          when revision.context_label is null then 'not_recorded'
          else 'recorded'
        end,
        'patch_label', revision.patch_label,
        'patch_state', case
          when revision.patch_label is null then 'not_recorded'
          else 'recorded'
        end,
        'staff_judgement', revision.staff_judgement,
        'version', revision.version,
        'created_at', revision.created_at,
        'updated_at', revision.updated_at,
        'approved_at', revision.approved_at,
        'evidence', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', evidence_link.id,
              'source_type', evidence_link.source_type,
              'source_id', evidence_link.source_id,
              'source_label', evidence_link.source_label,
              'source_recorded_at', evidence_link.source_recorded_at,
              'source_patch_label', evidence_link.source_patch_label,
              'staff_relevance_note', evidence_link.staff_relevance_note,
              'insufficient_reason', evidence_link.insufficient_reason,
              'availability', security.opponent_preparation_evidence_availability(
                evidence_link.tenant_id,
                v_playbook.opponent_team_id,
                evidence_link.source_type,
                evidence_link.source_id
              ),
              'source_summary', case evidence_link.source_type
                when 'scouting_evidence' then (
                  select evidence.observation
                  from public.scouting_evidence evidence
                  where evidence.id = evidence_link.source_id
                    and evidence.tenant_id = evidence_link.tenant_id
                    and evidence.opponent_team_id = v_playbook.opponent_team_id
                )
                when 'preparation_brief' then (
                  select brief.executive_summary
                  from public.preparation_briefs brief
                  where brief.id = evidence_link.source_id
                    and brief.tenant_id = evidence_link.tenant_id
                    and brief.opponent_team_id = v_playbook.opponent_team_id
                    and brief.status in ('published', 'archived')
                    and brief.snapshot is not null
                )
                when 'draft_playbook' then (
                  select playbook.description
                  from public.draft_playbooks playbook
                  where playbook.id = evidence_link.source_id
                    and playbook.tenant_id = evidence_link.tenant_id
                    and playbook.status in ('published', 'archived')
                    and playbook.snapshot is not null
                )
                else null
              end,
              'source_context', case
                when evidence_link.source_type = 'scouting_evidence' then (
                  select evidence.sample_context
                  from public.scouting_evidence evidence
                  where evidence.id = evidence_link.source_id
                    and evidence.tenant_id = evidence_link.tenant_id
                    and evidence.opponent_team_id = v_playbook.opponent_team_id
                )
                else null
              end,
              'linked_at', evidence_link.linked_at
            ) order by evidence_link.linked_at, evidence_link.id
          )
          from public.opponent_preparation_evidence_links evidence_link
          where evidence_link.revision_id = revision.id
            and evidence_link.tenant_id = revision.tenant_id
            and evidence_link.removed_at is null
        ), '[]'::jsonb),
        'actions', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'link_id', action_link.id,
              'id', action.id,
              'title', coalesce(action.title, 'Preparation action unavailable'),
              'status', coalesce(action.status, 'unavailable'),
              'category', action.category,
              'due_at', action.due_at,
              'owner_label', coalesce(
                nullif(btrim(owner_profile.display_name), ''),
                'Staff owner'
              ),
              'availability', case
                when action.id is not null
                  and action.archived_at is null then 'available'
                else 'unavailable'
              end,
              'linked_at', action_link.linked_at
            ) order by action_link.linked_at, action_link.id
          )
          from public.opponent_preparation_action_links action_link
          left join public.coaching_actions action
            on action.id = action_link.action_id
           and action.tenant_id = action_link.tenant_id
          left join public.profiles owner_profile
            on owner_profile.id = action.owner_user_id
          where action_link.revision_id = revision.id
            and action_link.tenant_id = revision.tenant_id
            and action_link.removed_at is null
        ), '[]'::jsonb),
        'review', (
          select jsonb_build_object(
            'link_id', review_link.id,
            'scrim_id', review_link.scrim_id,
            'label', coalesce(
              review_scrim.opponent_name || ' - ' || to_char(
                review_scrim.starts_at at time zone coalesce(review_scrim.timezone, 'UTC'),
                'DD Mon YYYY HH24:MI'
              ),
              'Review unavailable'
            ),
            'staff_outcome_summary', review_link.staff_outcome_summary,
            'availability', case
              when review_scrim.id is not null
                and review_scrim.archived_at is null
                and review_scrim.status is distinct from 'cancelled'
                and review_scrim.review_status = 'complete'
                and review_scrim.opponent_team_id = v_playbook.opponent_team_id
                then 'available'
              else 'unavailable'
            end,
            'linked_at', review_link.linked_at
          )
          from public.opponent_preparation_review_links review_link
          left join public.scrims review_scrim
            on review_scrim.id = review_link.scrim_id
           and review_scrim.tenant_id = review_link.tenant_id
          where review_link.revision_id = revision.id
            and review_link.tenant_id = revision.tenant_id
            and review_link.removed_at is null
          order by review_link.linked_at desc
          limit 1
        )
      ) order by revision.revision_number desc
    ),
    '[]'::jsonb
  )
  into v_revisions
  from public.opponent_preparation_revisions revision
  left join public.scrims fixture
    on fixture.id = revision.fixture_scrim_id
   and fixture.tenant_id = revision.tenant_id
  where revision.playbook_id = v_playbook.id
    and revision.tenant_id = v_playbook.tenant_id;

  return jsonb_build_object(
    'contract_version', 'opponent-preparation-v1',
    'projection', 'staff-v1',
    'opponent', jsonb_build_object(
      'id', p_opponent_team_id,
      'name', v_opponent_label
    ),
    'playbook', jsonb_build_object(
      'id', v_playbook.id,
      'title', v_playbook.title,
      'version', v_playbook.version,
      'is_archived', v_playbook.archived_at is not null,
      'archived_at', v_playbook.archived_at,
      'created_at', v_playbook.created_at,
      'updated_at', v_playbook.updated_at,
      'revisions', v_revisions
    )
  );
end;
$$;

create or replace function public.create_opponent_preparation_playbook(
  p_tenant_id uuid,
  p_opponent_team_id uuid,
  p_title text,
  p_revision_title text,
  p_fixture_scrim_id uuid default null,
  p_context_label text default null,
  p_patch_label text default null,
  p_staff_judgement text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_playbook public.opponent_preparation_playbooks;
  v_revision public.opponent_preparation_revisions;
begin
  v_actor_id := security.require_opponent_preparation_staff(p_tenant_id);

  if nullif(btrim(coalesce(p_title, '')), '') is null
    or nullif(btrim(coalesce(p_revision_title, '')), '') is null
  then
    raise sqlstate '22023'
      using message = 'Playbook and revision titles are required';
  end if;

  if not exists (
    select 1
    from public.opponent_teams opponent
    where opponent.id = p_opponent_team_id
      and opponent.tenant_id = p_tenant_id
      and opponent.archived_at is null
  ) then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  insert into public.opponent_preparation_playbooks (
    tenant_id,
    opponent_team_id,
    title,
    created_by,
    updated_by
  ) values (
    p_tenant_id,
    p_opponent_team_id,
    btrim(p_title),
    v_actor_id,
    v_actor_id
  )
  returning * into v_playbook;

  insert into public.opponent_preparation_revisions (
    tenant_id,
    playbook_id,
    revision_number,
    title,
    fixture_scrim_id,
    context_label,
    patch_label,
    staff_judgement,
    created_by,
    updated_by
  ) values (
    p_tenant_id,
    v_playbook.id,
    1,
    btrim(p_revision_title),
    p_fixture_scrim_id,
    nullif(btrim(coalesce(p_context_label, '')), ''),
    nullif(btrim(coalesce(p_patch_label, '')), ''),
    btrim(coalesce(p_staff_judgement, '')),
    v_actor_id,
    v_actor_id
  )
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    p_tenant_id,
    v_playbook.id,
    v_revision.id,
    v_actor_id,
    'created',
    v_revision.version,
    'Preparation playbook created'
  );

  return jsonb_build_object(
    'playbook_id', v_playbook.id,
    'revision_id', v_revision.id,
    'playbook_version', v_playbook.version,
    'revision_version', v_revision.version
  );
exception
  when unique_violation then
    raise sqlstate '23505'
      using message = 'An active preparation playbook already exists for this opponent';
end;
$$;

create or replace function public.update_opponent_preparation_draft(
  p_revision_id uuid,
  p_expected_version integer,
  p_title text,
  p_fixture_scrim_id uuid default null,
  p_context_label text default null,
  p_patch_label text default null,
  p_staff_judgement text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
begin
  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = p_revision_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation revisions are immutable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise sqlstate '22023'
      using message = 'A revision title is required';
  end if;

  update public.opponent_preparation_revisions
  set title = btrim(p_title),
      fixture_scrim_id = p_fixture_scrim_id,
      context_label = nullif(btrim(coalesce(p_context_label, '')), ''),
      patch_label = nullif(btrim(coalesce(p_patch_label, '')), ''),
      staff_judgement = btrim(coalesce(p_staff_judgement, '')),
      version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'draft_updated',
    v_revision.version,
    'Preparation draft updated'
  );

  return jsonb_build_object(
    'revision_id', v_revision.id,
    'status', v_revision.status,
    'version', v_revision.version
  );
end;
$$;

create or replace function public.link_opponent_preparation_evidence(
  p_revision_id uuid,
  p_expected_version integer,
  p_source_type text,
  p_source_id uuid default null,
  p_staff_relevance_note text default null,
  p_insufficient_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
  v_link public.opponent_preparation_evidence_links;
begin
  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = p_revision_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation links are immutable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if p_source_type not in (
    'scouting_evidence', 'preparation_brief', 'draft_playbook',
    'declared_insufficient'
  ) then
    raise sqlstate '22023'
      using message = 'Unsupported opponent preparation source';
  end if;

  insert into public.opponent_preparation_evidence_links (
    tenant_id,
    revision_id,
    source_type,
    source_id,
    source_label,
    source_recorded_at,
    staff_relevance_note,
    insufficient_reason,
    linked_by
  ) values (
    v_revision.tenant_id,
    v_revision.id,
    p_source_type,
    p_source_id,
    'Pending source validation',
    now(),
    nullif(btrim(coalesce(p_staff_relevance_note, '')), ''),
    nullif(btrim(coalesce(p_insufficient_reason, '')), ''),
    v_actor_id
  )
  returning * into v_link;

  update public.opponent_preparation_revisions
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'evidence_linked',
    v_revision.version,
    case
      when v_link.source_type = 'declared_insufficient'
        then 'Insufficient evidence recorded'
      else 'Preparation evidence linked'
    end
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'source_type', v_link.source_type,
    'source_label', v_link.source_label,
    'source_recorded_at', v_link.source_recorded_at,
    'source_patch_label', v_link.source_patch_label,
    'version', v_revision.version
  );
exception
  when unique_violation then
    raise sqlstate '23505'
      using message = 'This evidence is already linked to the draft';
end;
$$;

create or replace function public.unlink_opponent_preparation_evidence(
  p_link_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.opponent_preparation_evidence_links;
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
begin
  select evidence_link.*
  into v_link
  from public.opponent_preparation_evidence_links evidence_link
  where evidence_link.id = p_link_id
    and evidence_link.removed_at is null
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation evidence is unavailable';
  end if;

  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = v_link.revision_id
    and revision.tenant_id = v_link.tenant_id
  for update;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation links are immutable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  update public.opponent_preparation_evidence_links
  set removed_by = v_actor_id,
      removed_at = now()
  where id = v_link.id;

  update public.opponent_preparation_revisions
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'evidence_unlinked',
    v_revision.version,
    'Preparation evidence unlinked'
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'version', v_revision.version
  );
end;
$$;

create or replace function public.link_opponent_preparation_action(
  p_revision_id uuid,
  p_expected_version integer,
  p_action_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.opponent_preparation_revisions;
  v_link public.opponent_preparation_action_links;
  v_actor_id uuid;
begin
  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = p_revision_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation links are immutable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  insert into public.opponent_preparation_action_links (
    tenant_id,
    revision_id,
    action_id,
    linked_by
  ) values (
    v_revision.tenant_id,
    v_revision.id,
    p_action_id,
    v_actor_id
  )
  returning * into v_link;

  update public.opponent_preparation_revisions
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'action_linked',
    v_revision.version,
    'Preparation action linked'
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'action_id', v_link.action_id,
    'version', v_revision.version
  );
exception
  when unique_violation then
    raise sqlstate '23505'
      using message = 'This action is already linked to the draft';
end;
$$;

create or replace function public.unlink_opponent_preparation_action(
  p_link_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.opponent_preparation_action_links;
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
begin
  select action_link.*
  into v_link
  from public.opponent_preparation_action_links action_link
  where action_link.id = p_link_id
    and action_link.removed_at is null
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation action is unavailable';
  end if;

  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = v_link.revision_id
    and revision.tenant_id = v_link.tenant_id
  for update;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Approved opponent preparation links are immutable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  update public.opponent_preparation_action_links
  set removed_by = v_actor_id,
      removed_at = now()
  where id = v_link.id;

  update public.opponent_preparation_revisions
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'action_unlinked',
    v_revision.version,
    'Preparation action unlinked'
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'version', v_revision.version
  );
end;
$$;

create or replace function public.approve_opponent_preparation_revision(
  p_revision_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.opponent_preparation_revisions;
  v_playbook public.opponent_preparation_playbooks;
  v_actor_id uuid;
begin
  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = p_revision_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  select playbook.*
  into v_playbook
  from public.opponent_preparation_playbooks playbook
  where playbook.id = v_revision.playbook_id
    and playbook.tenant_id = v_revision.tenant_id
  for update;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_playbook.archived_at is not null or v_revision.status <> 'draft' then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  if v_revision.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if nullif(btrim(v_revision.staff_judgement), '') is null then
    raise sqlstate '22023'
      using message = 'Record explicit staff judgement before approval';
  end if;

  if not exists (
    select 1
    from public.opponent_preparation_evidence_links evidence_link
    where evidence_link.revision_id = v_revision.id
      and evidence_link.tenant_id = v_revision.tenant_id
      and evidence_link.removed_at is null
      and evidence_link.source_type in (
        'scouting_evidence', 'preparation_brief', 'declared_insufficient'
      )
      and security.opponent_preparation_evidence_availability(
        evidence_link.tenant_id,
        v_playbook.opponent_team_id,
        evidence_link.source_type,
        evidence_link.source_id
      ) in ('available', 'insufficient')
  ) then
    raise sqlstate '22023'
      using message = 'Link qualifying opponent evidence or record why evidence is insufficient';
  end if;

  if exists (
    select 1
    from public.opponent_preparation_evidence_links evidence_link
    where evidence_link.revision_id = v_revision.id
      and evidence_link.tenant_id = v_revision.tenant_id
      and evidence_link.removed_at is null
      and security.opponent_preparation_evidence_availability(
        evidence_link.tenant_id,
        v_playbook.opponent_team_id,
        evidence_link.source_type,
        evidence_link.source_id
      ) in ('unavailable', 'superseded')
  ) then
    raise sqlstate '22023'
      using message = 'Remove or replace unavailable evidence before approval';
  end if;

  if not exists (
    select 1
    from public.opponent_preparation_action_links action_link
    join public.coaching_actions action
      on action.id = action_link.action_id
     and action.tenant_id = action_link.tenant_id
    where action_link.revision_id = v_revision.id
      and action_link.tenant_id = v_revision.tenant_id
      and action_link.removed_at is null
      and action.archived_at is null
  ) then
    raise sqlstate '22023'
      using message = 'Link at least one active preparation action before approval';
  end if;

  update public.opponent_preparation_revisions
  set status = 'approved',
      version = version + 1,
      approved_by = v_actor_id,
      approved_at = now(),
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_revision.id
  returning * into v_revision;

  update public.opponent_preparation_playbooks
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_playbook.id
  returning * into v_playbook;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'approved',
    v_revision.version,
    'Preparation revision approved'
  );

  return jsonb_build_object(
    'playbook_id', v_playbook.id,
    'revision_id', v_revision.id,
    'status', v_revision.status,
    'playbook_version', v_playbook.version,
    'revision_version', v_revision.version,
    'approved_at', v_revision.approved_at
  );
end;
$$;

create or replace function public.create_opponent_preparation_revision(
  p_playbook_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_playbook public.opponent_preparation_playbooks;
  v_source_revision public.opponent_preparation_revisions;
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
begin
  select playbook.*
  into v_playbook
  from public.opponent_preparation_playbooks playbook
  where playbook.id = p_playbook_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_playbook.tenant_id);

  if v_playbook.archived_at is not null then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  if v_playbook.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if exists (
    select 1
    from public.opponent_preparation_revisions revision
    where revision.playbook_id = v_playbook.id
      and revision.tenant_id = v_playbook.tenant_id
      and revision.status = 'draft'
  ) then
    raise sqlstate '23505'
      using message = 'A preparation draft already exists';
  end if;

  select revision.*
  into v_source_revision
  from public.opponent_preparation_revisions revision
  where revision.playbook_id = v_playbook.id
    and revision.tenant_id = v_playbook.tenant_id
    and revision.status = 'approved'
  order by revision.revision_number desc
  limit 1;

  if not found then
    raise sqlstate '22023'
      using message = 'Approve the first preparation revision before creating another';
  end if;

  insert into public.opponent_preparation_revisions (
    tenant_id,
    playbook_id,
    revision_number,
    title,
    fixture_scrim_id,
    context_label,
    patch_label,
    staff_judgement,
    created_by,
    updated_by
  ) values (
    v_playbook.tenant_id,
    v_playbook.id,
    v_source_revision.revision_number + 1,
    v_source_revision.title,
    null,
    v_source_revision.context_label,
    v_source_revision.patch_label,
    v_source_revision.staff_judgement,
    v_actor_id,
    v_actor_id
  )
  returning * into v_revision;

  insert into public.opponent_preparation_evidence_links (
    tenant_id,
    revision_id,
    source_type,
    source_id,
    source_label,
    source_recorded_at,
    source_patch_label,
    staff_relevance_note,
    insufficient_reason,
    linked_by
  )
  select
    source_link.tenant_id,
    v_revision.id,
    source_link.source_type,
    source_link.source_id,
    source_link.source_label,
    source_link.source_recorded_at,
    source_link.source_patch_label,
    source_link.staff_relevance_note,
    source_link.insufficient_reason,
    v_actor_id
  from public.opponent_preparation_evidence_links source_link
  where source_link.revision_id = v_source_revision.id
    and source_link.tenant_id = v_source_revision.tenant_id
    and source_link.removed_at is null
    and security.opponent_preparation_evidence_availability(
      source_link.tenant_id,
      v_playbook.opponent_team_id,
      source_link.source_type,
      source_link.source_id
    ) in ('available', 'insufficient')
  order by source_link.id;

  insert into public.opponent_preparation_action_links (
    tenant_id,
    revision_id,
    action_id,
    linked_by
  )
  select
    source_link.tenant_id,
    v_revision.id,
    source_link.action_id,
    v_actor_id
  from public.opponent_preparation_action_links source_link
  join public.coaching_actions action
    on action.id = source_link.action_id
   and action.tenant_id = source_link.tenant_id
   and action.archived_at is null
  where source_link.revision_id = v_source_revision.id
    and source_link.tenant_id = v_source_revision.tenant_id
    and source_link.removed_at is null
  order by source_link.id;

  update public.opponent_preparation_playbooks
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now()
  where id = v_playbook.id
  returning * into v_playbook;

  perform security.record_opponent_preparation_event(
    v_playbook.tenant_id,
    v_playbook.id,
    v_revision.id,
    v_actor_id,
    'revision_created',
    v_revision.version,
    'New preparation revision created from approved history'
  );

  return jsonb_build_object(
    'playbook_id', v_playbook.id,
    'revision_id', v_revision.id,
    'revision_number', v_revision.revision_number,
    'playbook_version', v_playbook.version,
    'revision_version', v_revision.version
  );
end;
$$;

create or replace function public.link_opponent_preparation_review(
  p_revision_id uuid,
  p_scrim_id uuid,
  p_staff_outcome_summary text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision public.opponent_preparation_revisions;
  v_link public.opponent_preparation_review_links;
  v_actor_id uuid;
begin
  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = p_revision_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if v_revision.status <> 'approved'
    or nullif(btrim(coalesce(p_staff_outcome_summary, '')), '') is null
  then
    raise sqlstate '22023'
      using message = 'An approved revision and staff outcome summary are required';
  end if;

  insert into public.opponent_preparation_review_links (
    tenant_id,
    revision_id,
    scrim_id,
    staff_outcome_summary,
    linked_by
  ) values (
    v_revision.tenant_id,
    v_revision.id,
    p_scrim_id,
    btrim(p_staff_outcome_summary),
    v_actor_id
  )
  returning * into v_link;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'review_linked',
    v_revision.version,
    'Completed review linked to preparation revision'
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'revision_id', v_revision.id,
    'scrim_id', v_link.scrim_id,
    'revision_version', v_revision.version
  );
exception
  when unique_violation then
    raise sqlstate '23505'
      using message = 'This preparation revision already has a linked review';
end;
$$;

create or replace function public.unlink_opponent_preparation_review(
  p_link_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.opponent_preparation_review_links;
  v_revision public.opponent_preparation_revisions;
  v_actor_id uuid;
begin
  select review_link.*
  into v_link
  from public.opponent_preparation_review_links review_link
  where review_link.id = p_link_id
    and review_link.removed_at is null
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation review is unavailable';
  end if;

  select revision.*
  into v_revision
  from public.opponent_preparation_revisions revision
  where revision.id = v_link.revision_id
    and revision.tenant_id = v_link.tenant_id
  for update;

  v_actor_id := security.require_opponent_preparation_staff(v_revision.tenant_id);

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise sqlstate '22023'
      using message = 'Record why the review link is being removed';
  end if;

  update public.opponent_preparation_review_links
  set removed_by = v_actor_id,
      removed_at = now()
  where id = v_link.id;

  perform security.record_opponent_preparation_event(
    v_revision.tenant_id,
    v_revision.playbook_id,
    v_revision.id,
    v_actor_id,
    'review_unlinked',
    v_revision.version,
    btrim(p_reason)
  );

  return jsonb_build_object(
    'link_id', v_link.id,
    'revision_id', v_revision.id,
    'revision_version', v_revision.version
  );
end;
$$;

create or replace function public.archive_opponent_preparation_playbook(
  p_playbook_id uuid,
  p_expected_version integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_playbook public.opponent_preparation_playbooks;
  v_actor_id uuid;
begin
  select playbook.*
  into v_playbook
  from public.opponent_preparation_playbooks playbook
  where playbook.id = p_playbook_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_playbook.tenant_id);

  if v_playbook.archived_at is not null then
    raise sqlstate '22023'
      using message = 'Preparation playbook is already archived';
  end if;

  if v_playbook.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise sqlstate '22023'
      using message = 'Record why the preparation playbook is being archived';
  end if;

  update public.opponent_preparation_playbooks
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now(),
      archived_by = v_actor_id,
      archived_at = now()
  where id = v_playbook.id
  returning * into v_playbook;

  perform security.record_opponent_preparation_event(
    v_playbook.tenant_id,
    v_playbook.id,
    null,
    v_actor_id,
    'archived',
    v_playbook.version,
    btrim(p_reason)
  );

  return jsonb_build_object(
    'playbook_id', v_playbook.id,
    'version', v_playbook.version,
    'archived_at', v_playbook.archived_at
  );
end;
$$;

create or replace function public.restore_opponent_preparation_playbook(
  p_playbook_id uuid,
  p_expected_version integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_playbook public.opponent_preparation_playbooks;
  v_actor_id uuid;
begin
  select playbook.*
  into v_playbook
  from public.opponent_preparation_playbooks playbook
  where playbook.id = p_playbook_id
  for update;

  if not found then
    raise sqlstate '42501'
      using message = 'Opponent preparation is unavailable';
  end if;

  v_actor_id := security.require_opponent_preparation_staff(v_playbook.tenant_id);

  if v_playbook.archived_at is null then
    raise sqlstate '22023'
      using message = 'Preparation playbook is already active';
  end if;

  if v_playbook.version <> p_expected_version then
    raise sqlstate '40001'
      using message = 'Opponent preparation changed; refresh and try again';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise sqlstate '22023'
      using message = 'Record why the preparation playbook is being restored';
  end if;

  if exists (
    select 1
    from public.opponent_preparation_playbooks active_playbook
    where active_playbook.tenant_id = v_playbook.tenant_id
      and active_playbook.opponent_team_id = v_playbook.opponent_team_id
      and active_playbook.archived_at is null
      and active_playbook.id <> v_playbook.id
  ) then
    raise sqlstate '23505'
      using message = 'Another active preparation playbook exists for this opponent';
  end if;

  update public.opponent_preparation_playbooks
  set version = version + 1,
      updated_by = v_actor_id,
      updated_at = now(),
      archived_by = null,
      archived_at = null
  where id = v_playbook.id
  returning * into v_playbook;

  perform security.record_opponent_preparation_event(
    v_playbook.tenant_id,
    v_playbook.id,
    null,
    v_actor_id,
    'restored',
    v_playbook.version,
    btrim(p_reason)
  );

  return jsonb_build_object(
    'playbook_id', v_playbook.id,
    'version', v_playbook.version,
    'archived_at', v_playbook.archived_at
  );
end;
$$;

-- PostgreSQL grants new functions to PUBLIC by default. Lock every signature
-- before exposing only the authenticated RPC surface.
revoke all on function public.get_opponent_preparation_playbook(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.create_opponent_preparation_playbook(
  uuid, uuid, text, text, uuid, text, text, text
) from public, anon, authenticated;
revoke all on function public.update_opponent_preparation_draft(
  uuid, integer, text, uuid, text, text, text
) from public, anon, authenticated;
revoke all on function public.link_opponent_preparation_evidence(
  uuid, integer, text, uuid, text, text
) from public, anon, authenticated;
revoke all on function public.unlink_opponent_preparation_evidence(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.link_opponent_preparation_action(uuid, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.unlink_opponent_preparation_action(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.approve_opponent_preparation_revision(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.create_opponent_preparation_revision(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.link_opponent_preparation_review(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.unlink_opponent_preparation_review(uuid, text)
  from public, anon, authenticated;
revoke all on function public.archive_opponent_preparation_playbook(
  uuid, integer, text
) from public, anon, authenticated;
revoke all on function public.restore_opponent_preparation_playbook(
  uuid, integer, text
) from public, anon, authenticated;

grant execute on function public.get_opponent_preparation_playbook(uuid, uuid)
  to authenticated;
grant execute on function public.create_opponent_preparation_playbook(
  uuid, uuid, text, text, uuid, text, text, text
) to authenticated;
grant execute on function public.update_opponent_preparation_draft(
  uuid, integer, text, uuid, text, text, text
) to authenticated;
grant execute on function public.link_opponent_preparation_evidence(
  uuid, integer, text, uuid, text, text
) to authenticated;
grant execute on function public.unlink_opponent_preparation_evidence(uuid, integer)
  to authenticated;
grant execute on function public.link_opponent_preparation_action(uuid, integer, uuid)
  to authenticated;
grant execute on function public.unlink_opponent_preparation_action(uuid, integer)
  to authenticated;
grant execute on function public.approve_opponent_preparation_revision(uuid, integer)
  to authenticated;
grant execute on function public.create_opponent_preparation_revision(uuid, integer)
  to authenticated;
grant execute on function public.link_opponent_preparation_review(uuid, uuid, text)
  to authenticated;
grant execute on function public.unlink_opponent_preparation_review(uuid, text)
  to authenticated;
grant execute on function public.archive_opponent_preparation_playbook(
  uuid, integer, text
) to authenticated;
grant execute on function public.restore_opponent_preparation_playbook(
  uuid, integer, text
) to authenticated;

comment on function public.get_opponent_preparation_playbook(uuid, uuid) is
  'Returns the staff-v1 opponent-preparation projection after exact Elite/live/enabled Owner/Admin access checks.';
comment on function public.create_opponent_preparation_playbook(
  uuid, uuid, text, text, uuid, text, text, text
) is
  'Creates one active same-tenant opponent preparation container and its first draft revision.';
comment on function public.update_opponent_preparation_draft(
  uuid, integer, text, uuid, text, text, text
) is
  'Updates only a draft revision using optimistic concurrency and same-opponent fixture validation.';
comment on function public.link_opponent_preparation_evidence(
  uuid, integer, text, uuid, text, text
) is
  'Links a closed set of tenant-owned sources or records explicit insufficient evidence on a draft revision.';
comment on function public.unlink_opponent_preparation_evidence(uuid, integer) is
  'Soft-unlinks evidence from a draft revision while retaining audit history.';
comment on function public.link_opponent_preparation_action(uuid, integer, uuid) is
  'Links one active same-tenant canonical Coaching Action to a preparation draft.';
comment on function public.unlink_opponent_preparation_action(uuid, integer) is
  'Soft-unlinks a canonical Coaching Action from a preparation draft.';
comment on function public.approve_opponent_preparation_revision(uuid, integer) is
  'Approves and freezes a valid draft after evidence, action, tenant, entitlement, and version checks.';
comment on function public.create_opponent_preparation_revision(uuid, integer) is
  'Creates one new draft from the latest approved revision while retaining immutable history.';
comment on function public.link_opponent_preparation_review(uuid, uuid, text) is
  'Links a completed same-opponent Scrim Block review and explicit staff outcome to an approved revision.';
comment on function public.unlink_opponent_preparation_review(uuid, text) is
  'Soft-unlinks a review with an audited reason without rewriting the approved preparation revision.';
comment on function public.archive_opponent_preparation_playbook(uuid, integer, text) is
  'Soft-archives a preparation playbook and retains every revision, link, and event.';
comment on function public.restore_opponent_preparation_playbook(uuid, integer, text) is
  'Restores an archived playbook after access, version, and active-opponent collision checks.';

notify pgrst, 'reload schema';
