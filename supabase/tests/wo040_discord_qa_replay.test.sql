-- WO-2026-040 disposable local-database contract for the exact-replay control.
-- Run only through `supabase test db` against a reset local stack.
-- Fixtures and mutations remain inside this rollback-only transaction.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, security, extensions, auth, pg_temp;

select plan(22);

insert into public.tenants (id, name, slug, subscription_tier, subscription_status)
values (
  '00000000-0000-0000-0000-000000040101',
  'WO040 Local Replay',
  'wo040-local-replay',
  'elite',
  'active'
);

create temporary table wo040_test_state (
  key text primary key,
  value uuid not null
) on commit drop;
grant select, insert, update on table wo040_test_state to service_role;

select has_table('security', 'discord_qa_replay_runs', 'private replay evidence table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'security.discord_qa_replay_runs'::regclass),
  'RLS is enabled even though the evidence table is outside the exposed schema'
);
select ok(
  not has_schema_privilege('anon', 'security', 'usage')
  and not has_schema_privilege('authenticated', 'security', 'usage')
  and not has_schema_privilege('service_role', 'security', 'usage'),
  'API roles cannot enter the private security schema'
);
select ok(
  not has_table_privilege('anon', 'security.discord_qa_replay_runs', 'select')
  and not has_table_privilege('authenticated', 'security.discord_qa_replay_runs', 'select')
  and not has_table_privilege('service_role', 'security.discord_qa_replay_runs', 'select'),
  'API roles cannot read durable replay evidence directly'
);
select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'security'
      and table_name = 'discord_qa_replay_runs'
      and column_name in ('raw_body', 'signature', 'signature_timestamp', 'interaction_token', 'guild_id', 'role_ids', 'credentials', 'secret')
  ),
  'durable evidence has no signed envelope, target, role, token, credential, or secret columns'
);
select ok(
  not has_function_privilege('service_role', 'security.arm_discord_qa_replay(uuid,timestamptz)', 'execute')
  and not has_function_privilege('service_role', 'security.disable_discord_qa_replay(uuid)', 'execute'),
  'service-role clients cannot arm or disable the operator-only control'
);
select ok(
  has_function_privilege('service_role', 'public.claim_discord_qa_replay_run(uuid,text)', 'execute')
  and has_function_privilege('service_role', 'public.complete_discord_qa_replay_run(uuid,text,text,text,integer,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.claim_discord_qa_replay_run(uuid,text)', 'execute'),
  'only service role can reach the narrow claim and completion RPCs'
);

select throws_ok(
  $$select security.arm_discord_qa_replay(
      '00000000-0000-0000-0000-000000040101',
      clock_timestamp() + interval '16 minutes'
    )$$,
  '22023', 'Expiry must be within 15 minutes',
  'operator cannot arm a replay window longer than 15 minutes'
);

insert into wo040_test_state (key, value)
values (
  'completed_run',
  security.arm_discord_qa_replay(
    '00000000-0000-0000-0000-000000040101',
    clock_timestamp() + interval '10 minutes'
  )
);

select is(
  (select state from security.discord_qa_replay_runs where id = (select value from wo040_test_state where key = 'completed_run')),
  'armed',
  'operator can arm one short-lived tenant-scoped run'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.claim_discord_qa_replay_run(
      '00000000-0000-0000-0000-000000040101',
      '123456789012345678'
    )$$,
  '42501', null,
  'authenticated callers cannot claim the replay control'
);
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(
  $$select public.claim_discord_qa_replay_run(null, '123456789012345678')$$,
  '22023', 'Invalid replay claim',
  'null tenant claims fail closed'
);
select is(
  (
    select run_id
    from public.claim_discord_qa_replay_run(
      '00000000-0000-0000-0000-000000040101',
      '123456789012345678'
    )
  ),
  (select value from wo040_test_state where key = 'completed_run'),
  'first eligible signed interaction claims the armed run'
);

select is(
  (
    select count(*)
    from public.claim_discord_qa_replay_run(
      '00000000-0000-0000-0000-000000040101',
      '223456789012345678'
    )
  ),
  0::bigint,
  'a second interaction cannot claim the one-use run'
);

select ok(
  public.complete_discord_qa_replay_run(
    (select value from wo040_test_state where key = 'completed_run'),
    '123456789012345678', 'created', 'replay', 240, 'local-test'
  ),
  'matching created then replay evidence completes the claimed run'
);

select ok(
  not public.complete_discord_qa_replay_run(
    (select value from wo040_test_state where key = 'completed_run'),
    '123456789012345678', 'created', 'created', 300, 'local-test'
  ),
  'terminal evidence is immutable on a second completion attempt'
);
select ok(
  not public.complete_discord_qa_replay_run(
    '00000000-0000-0000-0000-000000040999',
    '123456789012345678', 'created', 'replay', 240, 'local-test'
  ),
  'a forged run identifier cannot create evidence'
);
reset role;

select ok(
  (select state = 'completed' and first_result = 'created' and replay_result = 'replay'
   from security.discord_qa_replay_runs
   where id = (select value from wo040_test_state where key = 'completed_run')),
  'durable evidence records only bounded result metadata'
);

insert into security.discord_qa_replay_runs (tenant_id, armed_at, expires_at)
values (
  '00000000-0000-0000-0000-000000040101',
  clock_timestamp() - interval '2 minutes',
  clock_timestamp() - interval '1 minute'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
  (
    select count(*)
    from public.claim_discord_qa_replay_run(
      '00000000-0000-0000-0000-000000040101',
      '323456789012345678'
    )
  ),
  0::bigint,
  'expired replay windows cannot be claimed'
);
reset role;

select is(
  (select state from security.discord_qa_replay_runs where interaction_id is null order by armed_at desc limit 1),
  'expired',
  'claim cleanup preserves an expired terminal evidence row'
);

insert into wo040_test_state (key, value)
values (
  'disabled_run',
  security.arm_discord_qa_replay(
    '00000000-0000-0000-0000-000000040101',
    clock_timestamp() + interval '5 minutes'
  )
);

select ok(
  security.disable_discord_qa_replay((select value from wo040_test_state where key = 'disabled_run')),
  'operator recovery disables an unused control without deleting it'
);
select is(
  (select state from security.discord_qa_replay_runs where id = (select value from wo040_test_state where key = 'disabled_run')),
  'disabled',
  'disabled replay evidence remains durable'
);

insert into security.discord_qa_replay_runs (tenant_id, expires_at)
values (
  '00000000-0000-0000-0000-000000040101',
  clock_timestamp() + interval '5 minutes'
);
select throws_ok(
  $$insert into security.discord_qa_replay_runs (tenant_id, expires_at)
    values (
      '00000000-0000-0000-0000-000000040101',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '23505', null,
  'partial uniqueness prevents concurrent active controls for one tenant and case'
);

select * from finish();
rollback;
