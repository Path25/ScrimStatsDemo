-- WO-2026-033 RECORD-PRESERVING FEATURE DISABLE
--
-- This is an operational psql script, not a migration. It changes one named
-- tenant only and defaults to ROLLBACK. A hosted run still requires Theo's
-- explicit approval for the named project, tenant, operator, and incident.
-- Never commit this script with customer identifiers substituted into it.

\set ON_ERROR_STOP on

\if :{?wo033_tenant_id}
\else
  \echo 'Missing -v wo033_tenant_id=<approved tenant UUID>; stopping.'
  \quit 3
\endif
\if :{?wo033_operator_id}
\else
  \echo 'Missing -v wo033_operator_id=<approved platform operator UUID>; stopping.'
  \quit 3
\endif
\if :{?wo033_incident_ref}
\else
  \echo 'Missing -v wo033_incident_ref=<support/change reference>; stopping.'
  \quit 3
\endif
\if :{?wo033_apply}
\else
  \set wo033_apply false
\endif

begin;

-- psql deliberately does not interpolate variables inside dollar-quoted
-- function bodies. Copy the validated inputs into transaction-local settings
-- so the procedural guard receives typed values without dynamic SQL.
select set_config('wo033.tenant_id', :'wo033_tenant_id', true);
select set_config('wo033.operator_id', :'wo033_operator_id', true);

do $guard$
declare
  v_tenant_id uuid := current_setting('wo033.tenant_id')::uuid;
  v_operator_id uuid := current_setting('wo033.operator_id')::uuid;
begin
  if not exists (
    select 1
    from public.platform_operators operator
    where operator.user_id = v_operator_id
      and operator.is_active is true
  ) then
    raise exception 'WO-033 disable requires an active platform operator';
  end if;

  if (
    select count(*)
    from public.tenant_feature_access access
    where access.tenant_id = v_tenant_id
      and access.module_key = 'practice_development'
  ) <> 1 then
    raise exception 'WO-033 disable expected exactly one named tenant module row';
  end if;
end;
$guard$;

with before_state as (
  select access.*
  from public.tenant_feature_access access
  where access.tenant_id = :'wo033_tenant_id'::uuid
    and access.module_key = 'practice_development'
  for update
), changed as (
  update public.tenant_feature_access access
  set is_enabled = false,
      updated_at = clock_timestamp(),
      updated_by = :'wo033_operator_id'::uuid
  from before_state before
  where access.tenant_id = before.tenant_id
    and access.module_key = before.module_key
  returning access.*
)
insert into public.operator_audit_events (
  operator_id,
  tenant_id,
  action,
  target_type,
  target_id,
  detail
)
select
  :'wo033_operator_id'::uuid,
  changed.tenant_id,
  'practice_development_disabled',
  'tenant_feature_access',
  changed.tenant_id::text || ':practice_development',
  jsonb_build_object(
    'incident_ref', :'wo033_incident_ref'::text,
    'before', to_jsonb(before_state),
    'after', to_jsonb(changed),
    'records_preserved', true
  )
from before_state
join changed using (tenant_id, module_key);

select tenant_id, module_key, release_state, is_enabled, updated_at, updated_by
from public.tenant_feature_access
where tenant_id = :'wo033_tenant_id'::uuid
  and module_key = 'practice_development';

select
  (select count(*) from public.practice_development_objectives where tenant_id = :'wo033_tenant_id'::uuid) as objectives_preserved,
  (select count(*) from public.practice_development_evidence where tenant_id = :'wo033_tenant_id'::uuid) as evidence_preserved,
  (select count(*) from public.practice_development_action_links where tenant_id = :'wo033_tenant_id'::uuid) as action_links_preserved,
  (select count(*) from public.practice_development_events where tenant_id = :'wo033_tenant_id'::uuid) as events_preserved;

\if :wo033_apply
  \echo 'Explicit apply flag received; committing the one-tenant disable.'
  commit;
\else
  \echo 'Dry run only; rolling back. Pass -v wo033_apply=true only after explicit approval.'
  rollback;
\endif
