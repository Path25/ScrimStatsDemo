-- WO-2026-036 hosted direct-authorization verification.
--
-- Run only against the shared hosted project after Theo approves the check.
-- The script resolves established non-customer QA fixtures by exact workspace
-- name, validates their shape, performs every temporary change in one
-- transaction, fails if any expected allow/deny result differs, and rolls back.
-- It creates no durable schema, user, tenant, playbook, or module-state change.

begin;

set local statement_timeout = '20s';
set local lock_timeout = '5s';

create temporary table wo036_fixture (
  key text primary key,
  id uuid not null
) on commit drop;

create temporary table wo036_result (
  check_name text primary key,
  passed boolean not null,
  observed_sqlstate text
) on commit drop;

grant select on table wo036_fixture to anon, authenticated;
grant select, insert on table wo036_result to anon, authenticated;

insert into wo036_fixture (key, id)
select 'tenant_a', id
from public.tenants
where name = 'WO-024 QA Tenant A'
  and subscription_tier::text = 'elite'
  and subscription_status::text = 'active';

insert into wo036_fixture (key, id)
select 'tenant_b', id
from public.tenants
where name = 'WO-024 QA Tenant B'
  and subscription_tier::text = 'elite'
  and subscription_status::text = 'active';

insert into wo036_fixture (key, id)
select 'tenant_free', id
from public.tenants
where name = 'TestWorkspace'
  and subscription_tier::text = 'free'
  and subscription_status::text = 'active';

insert into wo036_fixture (key, id)
select 'tenant_pro', id
from public.tenants
where name = 'WO-023 QA Additional 2026-08-02'
  and subscription_tier::text = 'pro'
  and subscription_status::text = 'active';

insert into wo036_fixture (key, id)
select 'owner_a', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and membership.role = 'owner'
limit 1;

insert into wo036_fixture (key, id)
select 'admin_a', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and membership.role = 'admin'
limit 1;

insert into wo036_fixture (key, id)
select 'member_a', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and membership.role = 'member'
limit 1;

insert into wo036_fixture (key, id)
select 'viewer_a', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and membership.role = 'viewer'
limit 1;

insert into wo036_fixture (key, id)
select 'owner_b', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_b'
  )
  and membership.role = 'owner'
limit 1;

insert into wo036_fixture (key, id)
select 'owner_free', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_free'
  )
  and membership.role = 'owner'
limit 1;

insert into wo036_fixture (key, id)
select 'owner_pro', membership.user_id
from public.tenant_users membership
where membership.tenant_id = (
    select id from wo036_fixture where key = 'tenant_pro'
  )
  and membership.role = 'owner'
limit 1;

insert into wo036_fixture (key, id)
select 'opponent_a', opponent.id
from public.opponent_teams opponent
where opponent.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and opponent.archived_at is null
order by opponent.created_at
limit 1;

insert into wo036_fixture (key, id)
select 'opponent_b', opponent.id
from public.opponent_teams opponent
where opponent.tenant_id = (
    select id from wo036_fixture where key = 'tenant_b'
  )
  and opponent.archived_at is null
order by opponent.created_at
limit 1;

insert into wo036_fixture (key, id)
select 'draft_revision_a', revision.id
from public.opponent_preparation_revisions revision
join public.opponent_preparation_playbooks playbook
  on playbook.id = revision.playbook_id
 and playbook.tenant_id = revision.tenant_id
where revision.tenant_id = (
    select id from wo036_fixture where key = 'tenant_a'
  )
  and revision.status = 'draft'
  and playbook.archived_at is null
order by revision.updated_at desc
limit 1;

do $$
declare
  required_keys constant text[] := array[
    'tenant_a', 'tenant_b', 'tenant_free', 'tenant_pro',
    'owner_a', 'admin_a', 'member_a', 'viewer_a', 'owner_b',
    'owner_free', 'owner_pro', 'opponent_a', 'opponent_b',
    'draft_revision_a'
  ];
  missing_keys text[];
begin
  select array_agg(required_key order by required_key)
  into missing_keys
  from unnest(required_keys) required_key
  where not exists (
    select 1 from wo036_fixture fixture where fixture.key = required_key
  );

  if missing_keys is not null then
    raise exception 'WO-036 QA fixture precondition failed: %', missing_keys;
  end if;

  if not exists (
    select 1
    from public.tenant_feature_access access
    where access.tenant_id = (
        select id from wo036_fixture where key = 'tenant_a'
      )
      and access.module_key = 'opponent_preparation'
      and access.release_state = 'live'
      and access.is_enabled is true
  ) then
    raise exception 'WO-036 Tenant A is not the approved live/enabled fixture';
  end if;

  if exists (
    select 1
    from public.tenant_feature_access access
    where access.tenant_id = (
        select id from wo036_fixture where key = 'tenant_b'
      )
      and access.module_key = 'opponent_preparation'
      and (access.release_state <> 'planned' or access.is_enabled is true)
  ) then
    raise exception 'WO-036 Tenant B is not the disabled control';
  end if;
end;
$$;

create temporary table wo036_draft_snapshot on commit drop as
select revision.version,
       revision.title,
       revision.fixture_scrim_id,
       revision.context_label,
       revision.patch_label,
       revision.staff_judgement
from public.opponent_preparation_revisions revision
where revision.id = (
  select id from wo036_fixture where key = 'draft_revision_a'
);

grant select on table wo036_draft_snapshot to authenticated;

insert into wo036_result values (
  'authenticated roles have no direct table privileges',
  not has_table_privilege(
    'authenticated', 'public.opponent_preparation_playbooks', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.opponent_preparation_revisions', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.opponent_preparation_evidence_links', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.opponent_preparation_action_links', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.opponent_preparation_review_links', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.opponent_preparation_events', 'select'
  ),
  null
);

insert into wo036_result values (
  'anonymous role cannot execute the shaped getter',
  not has_function_privilege(
    'anon', 'public.get_opponent_preparation_playbook(uuid,uuid)', 'execute'
  ),
  null
);

select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
declare
  projection jsonb;
begin
  projection := public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_a')
  );
  insert into wo036_result values (
    'Elite Owner direct getter positive control',
    projection->>'projection' = 'staff-v1', null
  );
exception when others then
  insert into wo036_result values (
    'Elite Owner direct getter positive control', false, sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'admin_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'admin_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
declare
  projection jsonb;
begin
  projection := public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_a')
  );
  insert into wo036_result values (
    'Elite Admin direct getter positive control',
    projection->>'projection' = 'staff-v1', null
  );
exception when others then
  insert into wo036_result values (
    'Elite Admin direct getter positive control', false, sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'member_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'member_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_a')
  );
  insert into wo036_result values (
    'Elite Member direct RPC denial', false, null
  );
exception when others then
  insert into wo036_result values (
    'Elite Member direct RPC denial',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'viewer_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'viewer_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_a')
  );
  insert into wo036_result values (
    'Elite Viewer direct RPC denial', false, null
  );
exception when others then
  insert into wo036_result values (
    'Elite Viewer direct RPC denial',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

reset role;

select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_b'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_b'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_b'),
    (select id from wo036_fixture where key = 'opponent_b')
  );
  insert into wo036_result values (
    'disabled Elite Tenant B direct RPC denial', false, null
  );
exception when others then
  insert into wo036_result values (
    'disabled Elite Tenant B direct RPC denial',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

reset role;

-- Temporarily make only the established Free/Pro controls live/enabled inside
-- this uncommitted transaction. Other sessions cannot observe the change and
-- the final rollback restores the exact hosted state.
update public.tenant_feature_access
set release_state = 'live', is_enabled = true
where tenant_id in (
    (select id from wo036_fixture where key = 'tenant_free'),
    (select id from wo036_fixture where key = 'tenant_pro')
  )
  and module_key = 'opponent_preparation';

select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_free'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_free'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_free'),
    gen_random_uuid()
  );
  insert into wo036_result values (
    'Free Owner direct RPC denial with live module simulation', false, null
  );
exception when others then
  insert into wo036_result values (
    'Free Owner direct RPC denial with live module simulation',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_pro'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_pro'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_pro'),
    gen_random_uuid()
  );
  insert into wo036_result values (
    'Pro Owner direct RPC denial with live module simulation', false, null
  );
exception when others then
  insert into wo036_result values (
    'Pro Owner direct RPC denial with live module simulation',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

select set_config('request.jwt.claim.sub', '', true);
select set_config(
  'request.jwt.claims', '{"role":"authenticated"}', true
);
set local role authenticated;

do $$
begin
  perform public.get_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_a')
  );
  insert into wo036_result values (
    'authenticated database role without Auth identity is denied', false, null
  );
exception when others then
  insert into wo036_result values (
    'authenticated database role without Auth identity is denied',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

do $$
begin
  perform 1 from public.opponent_preparation_playbooks limit 1;
  insert into wo036_result values (
    'authenticated caller cannot directly read locked playbook table',
    false, null
  );
exception when others then
  insert into wo036_result values (
    'authenticated caller cannot directly read locked playbook table',
    sqlstate = '42501', sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
begin
  perform public.create_opponent_preparation_playbook(
    (select id from wo036_fixture where key = 'tenant_a'),
    (select id from wo036_fixture where key = 'opponent_b'),
    'Rollback-only cross-tenant denial check',
    'Rollback-only cross-tenant denial check',
    null, null, null, ''
  );
  insert into wo036_result values (
    'cross-tenant opponent identifier mutation is denied', false, null
  );
exception when others then
  insert into wo036_result values (
    'cross-tenant opponent identifier mutation is denied',
    sqlstate = '42501' and sqlerrm = 'Opponent preparation is unavailable',
    sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
declare
  current_revision record;
begin
  select snapshot.version, snapshot.title, snapshot.fixture_scrim_id,
         snapshot.context_label, snapshot.patch_label,
         snapshot.staff_judgement
  into current_revision
  from wo036_draft_snapshot snapshot;

  perform public.update_opponent_preparation_draft(
    (select id from wo036_fixture where key = 'draft_revision_a'),
    current_revision.version - 1,
    current_revision.title,
    current_revision.fixture_scrim_id,
    current_revision.context_label,
    current_revision.patch_label,
    current_revision.staff_judgement
  );
  insert into wo036_result values (
    'stale draft version is rejected', false, null
  );
exception when others then
  insert into wo036_result values (
    'stale draft version is rejected',
    sqlstate = '40001'
      and sqlerrm = 'Opponent preparation changed; refresh and try again',
    sqlstate
  );
end;
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select id::text from wo036_fixture where key = 'owner_a'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from wo036_fixture where key = 'owner_a'),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

do $$
declare
  current_version integer;
begin
  select version into current_version
  from wo036_draft_snapshot;

  perform public.link_opponent_preparation_evidence(
    (select id from wo036_fixture where key = 'draft_revision_a'),
    current_version,
    'external_url',
    null, null, null
  );
  insert into wo036_result values (
    'unsupported evidence source is rejected', false, null
  );
exception when others then
  insert into wo036_result values (
    'unsupported evidence source is rejected',
    sqlstate = '22023'
      and sqlerrm = 'Unsupported opponent preparation source',
    sqlstate
  );
end;
$$;

do $$
begin
  perform public.get_opponent_preparation_breadcrumbs(
    (select id from wo036_fixture where key = 'tenant_a'),
    'scrim',
    array_fill(gen_random_uuid(), array[101])
  );
  insert into wo036_result values (
    'oversized breadcrumb request is rejected', false, null
  );
exception when others then
  insert into wo036_result values (
    'oversized breadcrumb request is rejected',
    sqlstate = '22023'
      and sqlerrm = 'Too many opponent preparation breadcrumb contexts',
    sqlstate
  );
end;
$$;

do $$
begin
  perform public.get_opponent_preparation_breadcrumbs(
    (select id from wo036_fixture where key = 'tenant_a'),
    'external_url',
    array[gen_random_uuid()]
  );
  insert into wo036_result values (
    'unsupported breadcrumb context is rejected', false, null
  );
exception when others then
  insert into wo036_result values (
    'unsupported breadcrumb context is rejected',
    sqlstate = '22023'
      and sqlerrm = 'Unsupported opponent preparation breadcrumb context',
    sqlstate
  );
end;
$$;

reset role;

do $$
declare
  failed_checks text;
begin
  select string_agg(
    check_name || coalesce(' [' || observed_sqlstate || ']', ''),
    '; ' order by check_name
  )
  into failed_checks
  from wo036_result
  where not passed;

  if failed_checks is not null then
    raise exception 'WO-036 hosted authorization matrix failed: %', failed_checks;
  end if;

  if (select count(*) from wo036_result) <> 16 then
    raise exception 'WO-036 hosted authorization matrix was incomplete';
  end if;

  raise notice 'WO-036 hosted authorization matrix passed 16/16 checks; rolling back';
end;
$$;

rollback;
