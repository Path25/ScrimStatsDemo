-- WO-2026-033 disposable local-database contract and lifecycle test.
-- Run only through `supabase test db` against a reset local stack.
-- Every fixture and mutation is enclosed in this transaction and rolled back.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth, pg_temp;

select plan(47);

-- Stable synthetic IDs; these never leave this rollback-only transaction.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000033001',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'wo033-owner-a@example.invalid', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000033002',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'wo033-member-a@example.invalid', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000033003',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'wo033-owner-b@example.invalid', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000033004',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'wo033-admin-a@example.invalid', '',
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.tenants (
  id, name, slug, subscription_tier, subscription_status
) values
  ('00000000-0000-0000-0000-000000033101',
   'WO033 Local A', 'wo033-local-a', 'elite', 'active'),
  ('00000000-0000-0000-0000-000000033102',
   'WO033 Local B', 'wo033-local-b', 'elite', 'active');

insert into public.tenant_users (tenant_id, user_id, role) values
  ('00000000-0000-0000-0000-000000033101',
   '00000000-0000-0000-0000-000000033001', 'owner'),
  ('00000000-0000-0000-0000-000000033101',
   '00000000-0000-0000-0000-000000033002', 'member'),
  ('00000000-0000-0000-0000-000000033102',
   '00000000-0000-0000-0000-000000033003', 'owner'),
  ('00000000-0000-0000-0000-000000033101',
   '00000000-0000-0000-0000-000000033004', 'admin');

insert into public.scrims (
  id, tenant_id, opponent_name, match_date, starts_at, created_by, status
) values
  ('00000000-0000-0000-0000-000000033201',
   '00000000-0000-0000-0000-000000033101', 'WO033 Opponent A',
   (current_date + 1)::date, now() + interval '1 day',
   '00000000-0000-0000-0000-000000033001', 'scheduled'),
  ('00000000-0000-0000-0000-000000033202',
   '00000000-0000-0000-0000-000000033102', 'WO033 Opponent B',
   (current_date + 1)::date, now() + interval '1 day',
   '00000000-0000-0000-0000-000000033003', 'scheduled'),
  ('00000000-0000-0000-0000-000000033203',
   '00000000-0000-0000-0000-000000033101', 'WO033 Follow-up A',
   (current_date + 7)::date, now() + interval '7 days',
   '00000000-0000-0000-0000-000000033001', 'scheduled'),
  ('00000000-0000-0000-0000-000000033204',
   '00000000-0000-0000-0000-000000033101', 'WO033 Earlier Follow-up A',
   (current_date + 3)::date, now() + interval '3 days',
   '00000000-0000-0000-0000-000000033001', 'scheduled');

create temporary table wo033_test_state (
  key text primary key,
  value uuid not null
) on commit drop;
grant select, insert, update on table wo033_test_state to authenticated;

select has_table(
  'public', 'practice_development_objectives',
  'objectives table exists'
);
select has_table(
  'public', 'practice_development_evidence',
  'evidence table exists'
);
select has_table(
  'public', 'practice_development_action_links',
  'action-link table exists'
);
select has_table(
  'public', 'practice_development_events',
  'append-only event table exists'
);

select is(
  (
    select count(*)
    from public.tenant_feature_access access
    where access.tenant_id in (
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033102'
    )
      and access.module_key = 'practice_development'
      and access.release_state = 'planned'
      and access.is_enabled is false
  )::bigint,
  2::bigint,
  'new Elite tenants remain planned and disabled'
);

select ok(
  not has_table_privilege(
    'authenticated', 'public.practice_development_objectives', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.practice_development_evidence', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.practice_development_action_links', 'select'
  )
  and not has_table_privilege(
    'authenticated', 'public.practice_development_events', 'select'
  ),
  'authenticated clients have no direct practice table access'
);

select ok(
  has_table_privilege(
    'service_role', 'public.practice_development_events', 'select'
  )
  and has_table_privilege(
    'service_role', 'public.practice_development_events', 'insert'
  )
  and not has_table_privilege(
    'service_role', 'public.practice_development_events', 'update'
  )
  and not has_table_privilege(
    'service_role', 'public.practice_development_events', 'delete'
  ),
  'service role can append and inspect events but cannot rewrite them'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_practice_development_loop(uuid,uuid,uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.get_practice_development_action_breadcrumbs(uuid,uuid[])',
    'execute'
  ),
  'anonymous callers cannot execute either read RPC'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_practice_development_loop(uuid,uuid,uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.get_practice_development_action_breadcrumbs(uuid,uuid[])',
    'execute'
  ),
  'authenticated callers can reach the server-authorized read RPCs'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select ok(
  not public.has_practice_development_access(
    '00000000-0000-0000-0000-000000033101'
  ),
  'Elite membership alone does not bypass planned/disabled state'
);

select throws_ok(
  $$select public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      null
    )$$,
  '42501', 'Practice development is unavailable',
  'planned/disabled getter fails closed'
);

reset role;
update public.tenant_feature_access
set release_state = 'live', is_enabled = true
where tenant_id in (
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033102'
  )
  and module_key = 'practice_development';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select ok(
  public.has_practice_development_access(
    '00000000-0000-0000-0000-000000033101'
  ),
  'named Elite tenant becomes available only after explicit live enablement'
);

reset role;
update public.scrims
set status = 'cancelled'
where id = '00000000-0000-0000-0000-000000033202';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033003', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033003","role":"authenticated"}',
  true
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033102',
    '00000000-0000-0000-0000-000000033202',
    null
  )#>>'{planning,unavailable_reason}',
  'practice_block_cancelled',
  'cancelled source block derives an explicit unavailable planning reason'
);

select throws_ok(
  $$select public.create_practice_development_objective(
      '00000000-0000-0000-0000-000000033102',
      '00000000-0000-0000-0000-000000033202',
      'Cancelled objective',
      'This objective must never be created.',
      null
    )$$,
  'P0001', 'Practice block is unavailable',
  'cancelled source block rejects objective creation'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

insert into wo033_test_state (key, value)
select
  'objective_a',
  (
    public.create_practice_development_objective(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      'Track first-objective setup',
      'Review the completed game and record the observed change.',
      'Staff-only planning detail'
    )->>'id'
  )::uuid;

select ok(
  (select value is not null from wo033_test_state where key = 'objective_a'),
  'staff can create the pre-practice objective through the RPC'
);

select throws_ok(
  $$select public.update_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      null,
      'Unsafe update', 'Unsafe evidence standard', null
    )$$,
  '40001', 'Practice objective changed; reload and retry',
  'null expected version cannot bypass optimistic concurrency'
);

select is(
  (
    public.update_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      1,
      'Track first-objective setup precisely',
      'Review the completed game and record the observed change.',
      'Updated staff-only planning detail'
    )->>'version'
  )::integer,
  2,
  'matching version updates planning and increments the version'
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    null
  )->>'projection',
  'staff-v1',
  'owner receives the staff projection'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033002', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033002","role":"authenticated"}',
  true
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    null
  )->>'projection',
  'team-v1',
  'member receives the team projection'
);

select ok(
  not (
    public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      null
    )#>'{objective}' ? 'staff_note'
  ),
  'team projection omits the objective staff note'
);

select throws_ok(
  $$select public.update_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      2,
      'Member mutation', 'Member evidence standard', null
    )$$,
  '42501', 'Practice-development staff access is required',
  'member cannot mutate the objective through a staff RPC'
);

select throws_ok(
  $$select public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033102',
      '00000000-0000-0000-0000-000000033202',
      null
    )$$,
  '42501', 'Practice development is unavailable',
  'membership in tenant A cannot read enabled tenant B'
);

select throws_ok(
  $$select count(*) from public.practice_development_objectives$$,
  '42501', 'permission denied for table practice_development_objectives',
  'authenticated callers cannot bypass the RPC with a direct read'
);

reset role;

-- Close the source practice block and add two completed game 1 records on
-- different blocks. The duplicate display number must never become identity.
update public.scrims
set starts_at = now() - interval '2 hours'
where id = '00000000-0000-0000-0000-000000033201';

insert into public.scrim_games (
  id, scrim_id, game_number, status, result, game_start_time, game_end_time
) values
  ('00000000-0000-0000-0000-000000033301',
   '00000000-0000-0000-0000-000000033201', 1, 'completed', 'win',
   now() - interval '90 minutes', now() - interval '45 minutes'),
  ('00000000-0000-0000-0000-000000033302',
   '00000000-0000-0000-0000-000000033203', 1, 'completed', 'loss',
   now() - interval '30 minutes', now() - interval '5 minutes');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.link_practice_development_evidence(
      (select value from wo033_test_state where key = 'objective_a'),
      null,
      'scrim_game',
      '00000000-0000-0000-0000-000000033301'
    )$$,
  '40001', 'Practice objective changed; reload and retry',
  'evidence linking also rejects a null expected version'
);

insert into wo033_test_state (key, value)
select
  'evidence_a',
  (
    public.link_practice_development_evidence(
      (select value from wo033_test_state where key = 'objective_a'),
      2,
      'scrim_game',
      '00000000-0000-0000-0000-000000033301'
    )->>'id'
  )::uuid;

select ok(
  (select value is not null from wo033_test_state where key = 'evidence_a')
  and (
    public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      '00000000-0000-0000-0000-000000033301'
    )#>>'{objective,version}'
  )::integer = 3,
  'completed same-block game links and advances the objective version'
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    '00000000-0000-0000-0000-000000033301'
  )#>>'{objective,evidence,0,source_match_key}',
  'context_game',
  'exact linked game context receives the safe context match key'
);

select ok(
  not (
    public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      null
    )#>'{objective,evidence,0}' ? 'source_match_key'
  ),
  'game evidence omits the match key when no exact context is supplied'
);

select throws_ok(
  $$select public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      '00000000-0000-0000-0000-000000033302'
    )$$,
  '42501', 'Practice development is unavailable',
  'same-number game from another block cannot match the linked source'
);

select is(
  (
    public.review_practice_development_evidence(
      (select value from wo033_test_state where key = 'evidence_a'),
      3,
      'The team applied the first-objective setup in the completed game.',
      'Private review detail'
    )->>'version'
  )::integer,
  4,
  'staff review moves current evidence into the evidenced lifecycle'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033002', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033002","role":"authenticated"}',
  true
);

select ok(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    '00000000-0000-0000-0000-000000033301'
  )#>>'{objective,evidence,0,source_match_key}' = 'context_game'
  and not (
    public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      '00000000-0000-0000-0000-000000033301'
    )#>'{objective,evidence,0}' ? 'source_id'
  )
  and not (
    public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      '00000000-0000-0000-0000-000000033301'
    )#>'{objective,evidence,0}' ? 'staff_note'
  ),
  'team evidence keeps the safe exact-context hint and omits raw/staff fields'
);

reset role;
update public.scrim_games
set status = 'cancelled'
where id = '00000000-0000-0000-0000-000000033301';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033002', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033002","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      '00000000-0000-0000-0000-000000033301'
    )$$,
  '42501', 'Practice development is unavailable',
  'cancelled context game is unavailable even when its identifier is exact'
);

reset role;
update public.scrim_games
set status = 'completed'
where id = '00000000-0000-0000-0000-000000033301';

insert into public.coaching_actions (
  id, tenant_id, scrim_id, title, status, owner_user_id, created_by,
  due_at, scope_type, unit_label, category, participant_player_ids,
  checkpoint_scrim_ids, source_type
) values (
  '00000000-0000-0000-0000-000000033401',
  '00000000-0000-0000-0000-000000033101',
  '00000000-0000-0000-0000-000000033201',
  'Apply the first-objective setup', 'assigned',
  '00000000-0000-0000-0000-000000033001',
  '00000000-0000-0000-0000-000000033001',
  now() + interval '7 days', 'team', null, 'review_discipline', '{}'::uuid[],
  array[
    '00000000-0000-0000-0000-000000033203'::uuid,
    '00000000-0000-0000-0000-000000033204'::uuid
  ], 'scrim'
), (
  '00000000-0000-0000-0000-000000033402',
  '00000000-0000-0000-0000-000000033101',
  '00000000-0000-0000-0000-000000033201',
  'Invalid duplicate-player unit follow-up', 'assigned',
  '00000000-0000-0000-0000-000000033001',
  '00000000-0000-0000-0000-000000033001',
  now() + interval '7 days', 'unit', 'Mid and jungle', 'review_discipline',
  array[
    '00000000-0000-0000-0000-000000033501'::uuid,
    '00000000-0000-0000-0000-000000033501'::uuid
  ],
  array['00000000-0000-0000-0000-000000033204'::uuid], 'scrim'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.attach_practice_development_follow_up(
      (select value from wo033_test_state where key = 'objective_a'),
      4,
      '00000000-0000-0000-0000-000000033402'
    )$$,
  'P0001', 'Unit follow-ups require a label and at least two players',
  'duplicate participant IDs do not satisfy the unit-scope minimum'
);

select throws_ok(
  $$select public.attach_practice_development_follow_up(
      (select value from wo033_test_state where key = 'objective_a'),
      null,
      '00000000-0000-0000-0000-000000033401'
    )$$,
  '40001', 'Practice objective changed; reload and retry',
  'follow-up attachment rejects a null expected version'
);

select is(
  (
    public.attach_practice_development_follow_up(
      (select value from wo033_test_state where key = 'objective_a'),
      4,
      '00000000-0000-0000-0000-000000033401'
    )->>'version'
  )::integer,
  5,
  'canonical same-tenant Coaching Action attaches to evidenced objective'
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    null
  )#>>'{objective,next_session,id}',
  '00000000-0000-0000-0000-000000033204',
  'next session uses earliest eligible checkpoint rather than array order'
);

select is(
  jsonb_array_length(
    public.get_practice_development_action_breadcrumbs(
      '00000000-0000-0000-0000-000000033101',
      array[
        '00000000-0000-0000-0000-000000033401'::uuid,
        '00000000-0000-0000-0000-000000033401'::uuid
      ]
    )
  ),
  1,
  'breadcrumb RPC deduplicates repeated in-bound action identifiers'
);

select ok(
  (
    public.get_practice_development_action_breadcrumbs(
      '00000000-0000-0000-0000-000000033101',
      array['00000000-0000-0000-0000-000000033401'::uuid]
    )->0
  ) ? 'objective_title'
  and not (
    public.get_practice_development_action_breadcrumbs(
      '00000000-0000-0000-0000-000000033101',
      array['00000000-0000-0000-0000-000000033401'::uuid]
    )->0 ? 'staff_note'
  ),
  'member-safe breadcrumb contains no staff detail'
);

select throws_ok(
  $$select public.get_practice_development_action_breadcrumbs(
      '00000000-0000-0000-0000-000000033101',
      array_fill(
        '00000000-0000-0000-0000-000000033401'::uuid,
        array[201]
      )
    )$$,
  '22023', 'At most 200 action identifiers may be requested',
  'breadcrumb RPC bounds the raw request before deduplication'
);

reset role;
update public.scrims
set status = 'cancelled'
where id in (
  '00000000-0000-0000-0000-000000033203',
  '00000000-0000-0000-0000-000000033204'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select is(
  public.get_practice_development_loop(
    '00000000-0000-0000-0000-000000033101',
    '00000000-0000-0000-0000-000000033201',
    null
  )#>>'{objective,next_session,status}',
  'unavailable',
  'checkpoint cancelled after linking derives an unavailable next session'
);

select throws_ok(
  $$select public.transition_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      5, 'completed', 'Applied consistently in review.', null
    )$$,
  'P0001', 'A completed linked Coaching Action is required before completion',
  'objective cannot complete before the linked action completes'
);

reset role;
update public.coaching_actions
set status = 'complete',
    completed_at = now(),
    completed_by = '00000000-0000-0000-0000-000000033001'
where id = '00000000-0000-0000-0000-000000033401';

update public.tenant_users
set role = 'member'
where tenant_id = '00000000-0000-0000-0000-000000033101'
  and user_id = '00000000-0000-0000-0000-000000033001';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033004', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033004","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.transition_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      5, 'completed', 'Applied consistently in review.', null
    )$$,
  'P0001', 'A completed linked Coaching Action is required before completion',
  'completed action with a demoted owner cannot complete the objective'
);

reset role;
update public.tenant_users
set role = 'owner'
where tenant_id = '00000000-0000-0000-0000-000000033101'
  and user_id = '00000000-0000-0000-0000-000000033001';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033004', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033004","role":"authenticated"}',
  true
);

select is(
  public.transition_practice_development_objective(
    (select value from wo033_test_state where key = 'objective_a'),
    5, 'completed', 'Applied consistently in review.', null
  )->>'status',
  'completed',
  'reviewed evidence plus completed action completes the objective'
);

select is(
  (
    public.archive_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      6, 'Archived for cancelled-source restore rehearsal.', null
    )->>'version'
  )::integer,
  7,
  'staff can archive the completed objective before recovery rehearsal'
);

reset role;
update public.scrims
set status = 'cancelled'
where id = '00000000-0000-0000-0000-000000033201';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033004', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033004","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.restore_practice_development_objective(
      (select value from wo033_test_state where key = 'objective_a'),
      7, 'Attempted restore after source cancellation.', null
    )$$,
  'P0001', 'The source practice block is unavailable',
  'cancelled source block prevents archived-objective restoration'
);

reset role;
update public.tenants
set subscription_tier = 'pro'
where id = '00000000-0000-0000-0000-000000033101';

select ok(
  exists (
    select 1
    from public.tenant_feature_access access
    where access.tenant_id = '00000000-0000-0000-0000-000000033101'
      and access.module_key = 'practice_development'
      and access.is_enabled is false
  ),
  'tier downgrade disables practice development'
);

select ok(
  (
    select count(*) = 1
    from public.practice_development_objectives objective
    where objective.tenant_id = '00000000-0000-0000-0000-000000033101'
  )
  and (
    select count(*) = 1
    from public.practice_development_evidence evidence
    where evidence.tenant_id = '00000000-0000-0000-0000-000000033101'
  )
  and (
    select count(*) = 1
    from public.practice_development_action_links link
    where link.tenant_id = '00000000-0000-0000-0000-000000033101'
  )
  and (
    select count(*) >= 6
    from public.practice_development_events event
    where event.tenant_id = '00000000-0000-0000-0000-000000033101'
  ),
  'tier downgrade preserves objective, evidence, action-link, and event history'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000033001', true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000033001","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.get_practice_development_loop(
      '00000000-0000-0000-0000-000000033101',
      '00000000-0000-0000-0000-000000033201',
      null
    )$$,
  '42501', 'Practice development is unavailable',
  'downgraded tenant loses RPC access while records remain preserved'
);

reset role;
select * from finish();
rollback;
