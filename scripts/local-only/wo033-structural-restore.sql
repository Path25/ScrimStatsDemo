-- LOCAL ONLY - DESTRUCTIVE - NEVER LINK OR RUN AGAINST A HOSTED PROJECT
--
-- WO-2026-033 disposable-database structural restore.
-- This removes every WO-033 database object and every local WO-033 record,
-- then restores the exact pre-WO-033 module constraint and entitlement
-- synchronizer. It is deliberately outside supabase/migrations so it cannot
-- enter the normal migration/deployment path.
--
-- Required psql variables:
--   wo033_environment=local-supabase-disposable
--   wo033_ack=I_UNDERSTAND_THIS_DELETES_WO033_LOCAL_DATA
--   wo033_checkpoint=ac71123f86212437780d46647f39535abb1b0b31
-- Optional:
--   wo033_apply=true  -- otherwise the complete restore is rolled back

\set ON_ERROR_STOP on

\if :{?wo033_environment}
\else
  \echo 'Missing -v wo033_environment=local-supabase-disposable; stopping.'
  \quit 3
\endif
\if :{?wo033_ack}
\else
  \echo 'Missing the destructive local-only acknowledgement; stopping.'
  \quit 3
\endif
\if :{?wo033_checkpoint}
\else
  \echo 'Missing the reviewed Phase 1 checkpoint; stopping.'
  \quit 3
\endif
\if :{?wo033_apply}
\else
  \set wo033_apply false
\endif

begin;

-- psql variables are not interpolated within dollar-quoted bodies. Copy the
-- acknowledgements into transaction-local settings before the procedural
-- guard so an accidental or partially specified invocation fails closed.
select set_config('wo033.environment', :'wo033_environment', true);
select set_config('wo033.ack', :'wo033_ack', true);
select set_config('wo033.checkpoint', :'wo033_checkpoint', true);

do $guard$
begin
  if current_setting('wo033.environment') <> 'local-supabase-disposable' then
    raise exception 'WO-033 restore is restricted to a disposable local Supabase database';
  end if;

  if current_setting('wo033.ack') <> 'I_UNDERSTAND_THIS_DELETES_WO033_LOCAL_DATA' then
    raise exception 'WO-033 restore requires the exact destructive local-only acknowledgement';
  end if;

  if current_setting('wo033.checkpoint') <> 'ac71123f86212437780d46647f39535abb1b0b31' then
    raise exception 'WO-033 restore checkpoint does not match the reviewed Phase 1 baseline';
  end if;

  if to_regclass('public.practice_development_objectives') is null
    or to_regclass('public.practice_development_evidence') is null
    or to_regclass('public.practice_development_action_links') is null
    or to_regclass('public.practice_development_events') is null
  then
    raise exception 'WO-033 restore expected the complete practice-development schema';
  end if;
end;
$guard$;

-- Remove the public API before its row types and backing tables.
drop function public.get_practice_development_loop(uuid, uuid, uuid);
drop function public.create_practice_development_objective(uuid, uuid, text, text, text);
drop function public.update_practice_development_objective(uuid, integer, text, text, text);
drop function public.link_practice_development_evidence(uuid, integer, text, uuid);
drop function public.review_practice_development_evidence(uuid, integer, text, text);
drop function public.record_practice_development_unavailable(uuid, integer, text, text);
drop function public.attach_practice_development_follow_up(uuid, integer, uuid);
drop function public.detach_practice_development_follow_up(uuid, integer, text, text);
drop function public.transition_practice_development_objective(uuid, integer, text, text, text);
drop function public.archive_practice_development_objective(uuid, integer, text, text);
drop function public.restore_practice_development_objective(uuid, integer, text, text);
drop function public.get_practice_development_action_breadcrumbs(uuid, uuid[]);
drop function public.has_practice_development_access(uuid);

-- Child-first table removal avoids CASCADE and makes unexpected dependencies
-- stop this script instead of being silently removed.
drop table public.practice_development_events;
drop table public.practice_development_action_links;
drop table public.practice_development_evidence;
drop table public.practice_development_objectives;

drop function security.prevent_practice_development_action_relink();
drop function security.prevent_practice_development_objective_reparent();
drop function security.prevent_practice_development_evidence_relink();
drop function security.validate_practice_development_evidence_source();
drop function security.practice_development_source_available(uuid, text, uuid);
drop function security.require_practice_development_staff(uuid);

drop index public.coaching_actions_id_tenant_unique;

delete from public.tenant_feature_access
where module_key = 'practice_development';

alter table public.tenant_feature_access
  drop constraint tenant_feature_access_module_key_check;

alter table public.tenant_feature_access
  add constraint tenant_feature_access_module_key_check check (module_key in (
    'operations', 'soloq', 'analytics', 'scouting', 'draft_preparation',
    'collector', 'discord'
  ));

-- Restore the reviewed pre-WO-033 definition from
-- 20260801111044_enable_free_soloq_entitlement.sql.
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

  return new;
end;
$$;

revoke all on function public.sync_tenant_plan_entitlements()
  from public, anon, authenticated;
grant execute on function public.sync_tenant_plan_entitlements()
  to service_role;

comment on function public.sync_tenant_plan_entitlements() is
  'Synchronizes tenant module access. Collector is available to Pro and Elite workspaces; Discord remains Elite-only.';

do $verify$
begin
  if to_regclass('public.practice_development_objectives') is not null
    or to_regclass('public.practice_development_evidence') is not null
    or to_regclass('public.practice_development_action_links') is not null
    or to_regclass('public.practice_development_events') is not null
  then
    raise exception 'WO-033 local restore left a practice-development table behind';
  end if;

  if to_regprocedure('public.has_practice_development_access(uuid)') is not null
    or to_regprocedure('public.get_practice_development_loop(uuid,uuid,uuid)') is not null
    or to_regprocedure('public.get_practice_development_action_breadcrumbs(uuid,uuid[])') is not null
  then
    raise exception 'WO-033 local restore left a public practice-development API behind';
  end if;

  if exists (
    select 1 from public.tenant_feature_access
    where module_key = 'practice_development'
  ) then
    raise exception 'WO-033 local restore left a module row behind';
  end if;

  if position(
    'practice_development' in pg_get_functiondef(
      'public.sync_tenant_plan_entitlements()'::regprocedure
    )
  ) > 0 then
    raise exception 'WO-033 local restore did not restore the pre-WO-033 entitlement synchronizer';
  end if;
end;
$verify$;

notify pgrst, 'reload schema';

\if :wo033_apply
  \echo 'Local-only apply flag received; committing the destructive structural restore.'
  commit;
\else
  \echo 'Dry run complete; rolling back. Pass -v wo033_apply=true only for a disposable local database.'
  rollback;
\endif
