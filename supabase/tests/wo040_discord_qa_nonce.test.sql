-- WO-2026-040 rollback-only local contract for the Phase D nonce controls.
-- No provider request is possible from this database test.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, security, extensions, auth, pg_temp;

select plan(25);

insert into public.tenants (id, name, slug, subscription_tier, subscription_status)
values
  ('00000000-0000-0000-0000-000000040301', 'WO040 Nonce A', 'wo040-nonce-a', 'elite', 'active'),
  ('00000000-0000-0000-0000-000000040302', 'WO040 Nonce B', 'wo040-nonce-b', 'pro', 'active');

update public.tenant_feature_access
set release_state = 'live', is_enabled = true
where tenant_id = '00000000-0000-0000-0000-000000040301'
  and module_key = 'discord';

insert into public.discord_installations (id, tenant_id, guild_id, guild_name, status, installed_by)
values (
  '00000000-0000-0000-0000-000000040311',
  '00000000-0000-0000-0000-000000040301',
  '12345678901234567',
  'WO040 private fixture',
  'active',
  '00000000-0000-0000-0000-000000040399'
);

insert into public.discord_channel_subscriptions (
  id, tenant_id, installation_id, channel_id, channel_name, event_type, enabled
)
values (
  '00000000-0000-0000-0000-000000040312',
  '00000000-0000-0000-0000-000000040301',
  '00000000-0000-0000-0000-000000040311',
  '123456789012345678',
  'wo040-private',
  'schedule_created',
  true
);

insert into public.integration_events (
  id, tenant_id, event_type, aggregate_type, payload, dedupe_key, provider
)
values
  (
    '00000000-0000-0000-0000-000000040321',
    '00000000-0000-0000-0000-000000040301',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-nonce-target', 'discord'
  ),
  (
    '00000000-0000-0000-0000-000000040322',
    '00000000-0000-0000-0000-000000040301',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-nonce-other', 'discord'
  ),
  (
    '00000000-0000-0000-0000-000000040323',
    '00000000-0000-0000-0000-000000040302',
    'schedule_created', 'scrim', '{}'::jsonb, 'wo040-nonce-pro', 'discord'
  );

create temporary table wo040_nonce_test_state (
  key text primary key,
  value uuid not null
) on commit drop;
grant select, insert, update on table wo040_nonce_test_state to service_role;

select has_table('security', 'discord_qa_nonce_runs', 'private nonce evidence table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'security.discord_qa_nonce_runs'::regclass),
  'RLS is enabled on private nonce evidence'
);
select ok(
  not has_table_privilege('anon', 'security.discord_qa_nonce_runs', 'select')
  and not has_table_privilege('authenticated', 'security.discord_qa_nonce_runs', 'select')
  and not has_table_privilege('service_role', 'security.discord_qa_nonce_runs', 'select'),
  'API roles cannot read private nonce evidence'
);
select ok(
  not has_function_privilege('service_role', 'security.arm_discord_qa_nonce_probe(uuid,uuid,text,timestamptz)', 'execute')
  and not has_function_privilege('authenticated', 'security.arm_discord_qa_nonce_probe(uuid,uuid,text,timestamptz)', 'execute'),
  'API roles cannot arm the nonce probe'
);
select ok(
  has_function_privilege('service_role', 'public.claim_discord_qa_nonce_probe(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.claim_discord_qa_nonce_probe(uuid)', 'execute'),
  'only service role can claim a nonce probe'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'security'
      and table_name = 'discord_qa_nonce_runs'
      and column_name in ('bot_token', 'provider_reference', 'request_body', 'response_body')
  ),
  'private nonce evidence stores no credential, provider identifier, or message body'
);

select throws_ok(
  $$select security.arm_discord_qa_nonce_probe(
      '00000000-0000-0000-0000-000000040301',
      '00000000-0000-0000-0000-000000040321',
      'invalid-channel',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '22023', 'Valid tenant, event, and channel are required',
  'invalid channels fail closed'
);
select throws_ok(
  $$select security.arm_discord_qa_nonce_probe(
      '00000000-0000-0000-0000-000000040302',
      '00000000-0000-0000-0000-000000040323',
      '123456789012345678',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '22023', 'Event is not eligible for the Discord nonce probe',
  'non-Elite events cannot be armed'
);

insert into wo040_nonce_test_state (key, value)
values (
  'claimed_run',
  security.arm_discord_qa_nonce_probe(
    '00000000-0000-0000-0000-000000040301',
    '00000000-0000-0000-0000-000000040321',
    '123456789012345678',
    clock_timestamp() + interval '5 minutes'
  )
);

select is(
  (select state from security.discord_qa_nonce_runs where id = (select value from wo040_nonce_test_state where key = 'claimed_run')),
  'armed',
  'operator can arm one exact fresh nonce fixture'
);
select throws_ok(
  $$select security.arm_discord_qa_dispatch(
      '00000000-0000-0000-0000-000000040301',
      '00000000-0000-0000-0000-000000040322',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '55000', 'A Discord QA control is already active',
  'exact-event dispatch cannot overlap an active nonce probe'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.claim_discord_qa_nonce_probe((select value from wo040_nonce_test_state where key = 'claimed_run'))$$,
  '42501', null,
  'authenticated callers cannot claim a nonce probe'
);
reset role;

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is(
  (select event_id from public.claim_discord_qa_nonce_probe((select value from wo040_nonce_test_state where key = 'claimed_run'))),
  '00000000-0000-0000-0000-000000040321'::uuid,
  'service role claims only the armed event'
);
select is(
  (select count(*) from public.claim_discord_qa_nonce_probe((select value from wo040_nonce_test_state where key = 'claimed_run'))),
  0::bigint,
  'a nonce run cannot be claimed twice'
);
reset role;

select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040321'),
  'pending',
  'nonce claim does not rewrite the fresh event state'
);
select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040322'),
  'pending',
  'another event remains untouched'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select ok(
  not public.complete_discord_qa_nonce_probe(
    (select value from wo040_nonce_test_state where key = 'claimed_run'),
    'confirmed', 200, 200, true, true, 'local-test'
  ),
  'confirmed completion requires genuine delivered evidence'
);
reset role;

insert into public.integration_delivery_attempts (
  tenant_id, event_id, provider, delivery_target_id, outcome, provider_reference
)
values (
  '00000000-0000-0000-0000-000000040301',
  '00000000-0000-0000-0000-000000040321',
  'discord',
  '123456789012345678',
  'delivered',
  '123456789012345679'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select ok(
  public.complete_discord_qa_nonce_probe(
    (select value from wo040_nonce_test_state where key = 'claimed_run'),
    'confirmed', 200, 200, true, true, 'local-test'
  ),
  'matching provider-backed evidence completes the nonce probe'
);
reset role;

select ok(
  (
    select state = 'completed'
      and outcome = 'confirmed'
      and same_provider_reference is true
      and delivery_evidence_recorded is true
    from security.discord_qa_nonce_runs
    where id = (select value from wo040_nonce_test_state where key = 'claimed_run')
  ),
  'completed nonce evidence stores only bounded result metadata'
);

select throws_ok(
  $$select security.arm_discord_qa_nonce_probe(
      '00000000-0000-0000-0000-000000040301',
      '00000000-0000-0000-0000-000000040321',
      '123456789012345678',
      clock_timestamp() + interval '5 minutes'
    )$$,
  '22023', 'Event is not eligible for the Discord nonce probe',
  'events with delivery evidence cannot be re-armed'
);

insert into wo040_nonce_test_state (key, value)
values (
  'disabled_run',
  security.arm_discord_qa_nonce_probe(
    '00000000-0000-0000-0000-000000040301',
    '00000000-0000-0000-0000-000000040322',
    '123456789012345678',
    clock_timestamp() + interval '5 minutes'
  )
);
select ok(
  security.disable_discord_qa_nonce_probe((select value from wo040_nonce_test_state where key = 'disabled_run')),
  'operator can disable an unused nonce probe'
);
select is(
  (select state from security.discord_qa_nonce_runs where id = (select value from wo040_nonce_test_state where key = 'disabled_run')),
  'disabled',
  'disabled nonce evidence remains durable'
);
select ok(
  (select count(*) = 2 from security.discord_qa_nonce_runs),
  'only the two exact nonce fixtures were recorded'
);
select is(
  (select count(*) from public.integration_delivery_attempts where event_id = '00000000-0000-0000-0000-000000040321'),
  1::bigint,
  'one delivered-attempt receipt is retained for the confirmed fixture'
);
select is(
  (select count(*) from public.integration_delivery_attempts where event_id = '00000000-0000-0000-0000-000000040322'),
  0::bigint,
  'the untouched fixture has no delivery evidence'
);
select is(
  (select status from public.integration_events where id = '00000000-0000-0000-0000-000000040323'),
  'pending',
  'the unrelated Pro event remains untouched'
);

select * from finish();
rollback;
