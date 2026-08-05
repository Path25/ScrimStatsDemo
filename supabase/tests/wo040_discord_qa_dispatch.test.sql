-- WO-2026-040 disposable local-database contract for exact-event dispatch isolation.
-- Run only through `supabase test db` against a reset local stack.
-- Fixtures and mutations remain inside this rollback-only transaction.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, security, extensions, auth, pg_temp;

select plan(28);

insert into public.tenants (id, name, slug, subscription_tier, subscription_status)
values
  ('00000000-0000-0000-0000-000000040201', 'WO040 Dispatch A', 'wo040-dispatch-a', 'elite', 'active'),
  ('00000000-0000-0000-0000-000000040202', 'WO040 Dispatch B', 'wo040-dispatch-b', 'elite', 'active');

insert into public.integration_events (
  id, tenant_id, event_type, aggregate_type, payload, dedupe_key, provider
)
values
  (
    '00000000-0000-0000-0000-000000040211',
    '00000000-0000-0000-0000-000000040201',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-dispatch-target', 'discord'
  ),
  (
    '00000000-0000-0000-0000-000000040212',
    '00000000-0000-0000-0000-000000040201',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-dispatch-other-a', 'discord'
  ),
  (
    '00000000-0000-0000-0000-000000040213',
    '00000000-0000-0000-0000-000000040202',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-dispatch-other-b', 'discord'
  );

create temporary table wo040_dispatch_test_state (
  key text primary key,
  value uuid not null
) on commit drop;
grant select, insert, update on table wo040_dispatch_test_state to service_role;

select has_table('security', 'discord_qa_dispatch_runs', 'private exact-event dispatch table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'security.discord_qa_dispatch_runs'::regclass),
  'RLS is enabled on private dispatch evidence'
);
select ok(
  not has_schema_privilege('anon', 'security', 'usage')
  and not has_schema_privilege('authenticated', 'security', 'usage')
  and not has_schema_privilege('service_role', 'security', 'usage'),
  'API roles cannot enter the private security schema'
);
select ok(
  not has_table_privilege('anon', 'security.discord_qa_dispatch_runs', 'select')
  and not has_table_privilege('authenticated', 'security.discord_qa_dispatch_runs', 'select')
  and not has_table_privilege('service_role', 'security.discord_qa_dispatch_runs', 'select'),
  'API roles cannot read exact-event dispatch evidence directly'
);
select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'security'
      and table_name = 'discord_qa_dispatch_runs'
      and column_name in ('bot_token', 'channel_id', 'provider_reference', 'secret', 'request_body')
  ),
  'durable dispatch evidence stores no provider target, request, credential, or secret material'
);
select ok(
  not has_function_privilege('service_role', 'security.arm_discord_qa_dispatch(uuid,uuid,timestamptz)', 'execute')
  and not has_function_privilege('service_role', 'security.disable_discord_qa_dispatch(uuid)', 'execute'),
  'service-role clients cannot arm or disable the operator-only control'
);
select ok(
  has_function_privilege('service_role', 'public.claim_discord_qa_dispatch_event(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.claim_discord_qa_dispatch_event(uuid)', 'execute'),
  'only service role can reach the narrow exact-event claim RPC'
);
select ok(
  has_function_privilege('service_role', 'public.complete_discord_qa_dispatch_run(uuid,uuid,text,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.complete_discord_qa_dispatch_run(uuid,uuid,text,text)', 'execute'),
  'only service role can reach the bounded completion RPC'
);

select throws_ok(
  $$select security.arm_discord_qa_dispatch(
      '00000000-0000-0000-0000-000000040201',
      '00000000-0000-0000-0000-000000040211',
      clock_timestamp() + interval '16 minutes'
    )$$,
  '22023', 'Expiry must be within 15 minutes',
  'operator cannot arm a dispatch window longer than 15 minutes'
);
select throws_ok(
  $$select security.arm_discord_qa_dispatch(
      '00000000-0000-0000-0000-000000040202',
      '00000000-0000-0000-0000-000000040211',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '22023', 'Event is not eligible for exact Discord dispatch',
  'operator cannot bind an event to a different tenant'
);

insert into wo040_dispatch_test_state (key, value)
values (
  'claimed_run',
  security.arm_discord_qa_dispatch(
    '00000000-0000-0000-0000-000000040201',
    '00000000-0000-0000-0000-000000040211',
    clock_timestamp() + interval '10 minutes'
  )
);

select is(
  (select state from security.discord_qa_dispatch_runs where id = (select value from wo040_dispatch_test_state where key = 'claimed_run')),
  'armed',
  'operator can arm one short-lived tenant-and-event-bound run'
);
select throws_ok(
  $$select security.arm_discord_qa_dispatch(
      '00000000-0000-0000-0000-000000040201',
      '00000000-0000-0000-0000-000000040212',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '55000', 'An exact-event dispatch run is already active',
  'only one exact-event dispatch run can be active globally'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.claim_discord_qa_dispatch_event(
      '00000000-0000-0000-0000-000000040298'
    )$$,
  '42501', null,
  'authenticated callers cannot claim the dispatch control'
);
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(
  $$select public.claim_discord_qa_dispatch_event(null)$$,
  '22023', 'Valid dispatch run is required',
  'null run claims fail closed'
);
select is(
  (select count(*) from public.claim_discord_qa_dispatch_event('00000000-0000-0000-0000-000000040299')),
  0::bigint,
  'unknown run references claim no event'
);
select is(
  (
    select id
    from public.claim_discord_qa_dispatch_event(
      (select value from wo040_dispatch_test_state where key = 'claimed_run')
    )
  ),
  '00000000-0000-0000-0000-000000040211'::uuid,
  'the armed run claims only its exact event'
);
reset role;
select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040211'),
  'processing',
  'the exact target becomes processing'
);
select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040212'),
  'pending',
  'another eligible event in the same tenant remains untouched'
);
select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040213'),
  'pending',
  'an eligible event in another tenant remains untouched'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
  (
    select count(*)
    from public.claim_discord_qa_dispatch_event(
      (select value from wo040_dispatch_test_state where key = 'claimed_run')
    )
  ),
  0::bigint,
  'a consumed run cannot claim the event again'
);
select ok(
  not public.complete_discord_qa_dispatch_run(
    (select value from wo040_dispatch_test_state where key = 'claimed_run'),
    '00000000-0000-0000-0000-000000040212',
    'pending',
    'local-test'
  ),
  'completion cannot substitute another event identifier'
);
reset role;

update public.integration_events
set status = 'pending', attempt_count = 1, available_at = clock_timestamp()
where id = '00000000-0000-0000-0000-000000040211';

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select ok(
  public.complete_discord_qa_dispatch_run(
    (select value from wo040_dispatch_test_state where key = 'claimed_run'),
    '00000000-0000-0000-0000-000000040211',
    'pending',
    'local-test'
  ),
  'matching bounded result evidence completes the claimed run'
);
reset role;
select ok(
  (
    select state = 'completed'
      and result_status = 'pending'
      and function_version = 'local-test'
    from security.discord_qa_dispatch_runs
    where id = (select value from wo040_dispatch_test_state where key = 'claimed_run')
  ),
  'completed evidence records only bounded status and Function metadata'
);

insert into wo040_dispatch_test_state (key, value)
values (
  'disabled_run',
  security.arm_discord_qa_dispatch(
    '00000000-0000-0000-0000-000000040201',
    '00000000-0000-0000-0000-000000040211',
    clock_timestamp() + interval '5 minutes'
  )
);
select ok(
  (select value is not null from wo040_dispatch_test_state where key = 'disabled_run'),
  'a retry requires a separately armed one-use run for the same exact event'
);
select ok(
  security.disable_discord_qa_dispatch((select value from wo040_dispatch_test_state where key = 'disabled_run')),
  'operator recovery disables an unused dispatch control without deleting it'
);
select is(
  (select state from security.discord_qa_dispatch_runs where id = (select value from wo040_dispatch_test_state where key = 'disabled_run')),
  'disabled',
  'disabled dispatch evidence remains durable'
);

insert into security.discord_qa_dispatch_runs (
  id, tenant_id, event_id, armed_at, expires_at
)
values (
  '00000000-0000-0000-0000-000000040297',
  '00000000-0000-0000-0000-000000040201',
  '00000000-0000-0000-0000-000000040212',
  clock_timestamp() - interval '2 minutes',
  clock_timestamp() - interval '1 minute'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
  (
    select count(*)
    from public.claim_discord_qa_dispatch_event(
      '00000000-0000-0000-0000-000000040297'
    )
  ),
  0::bigint,
  'expired controls cannot claim their bound event'
);
reset role;
select is(
  (select state from security.discord_qa_dispatch_runs where event_id = '00000000-0000-0000-0000-000000040212' order by armed_at desc limit 1),
  'expired',
  'expired control evidence remains durable and terminal'
);

select * from finish();
rollback;
