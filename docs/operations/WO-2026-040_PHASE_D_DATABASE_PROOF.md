# WO-2026-040 Phase D disposable database proof

## Boundary

Executed on 2026-08-06 under Theo's approval for a read-only schema-only ScrimStats export and an isolated disposable database proof. No hosted DDL/DML, Function deployment, provider request, fixture change, worker activation, customer action, secret/configuration change, smoke test, pilot, or release action was performed.

## Export evidence

- Hosted project identity: `tvcgjehreaayfazlhvps` (`ScrimStats.gg`), healthy, PostgreSQL 17.
- Default schema-only export: 747,690 bytes; SHA-256 `78ACC73F2839718053212C617DD3B402C665708DE0F27D1F855245D0D422E0F2`.
- Auth schema-only export: 47,837 bytes; SHA-256 `55E4904376BEA60ED540D8AE6A464FAA0758B48114CD450C84B356C459D473F9`.
- Both exports contained zero `COPY`, `INSERT`, `UPDATE`, or `DELETE` data statements. No connection string, credential, token, private key, Auth user, Storage object, or Vault value was exported. The default schema contained the configuration name `discord_dispatch_secret` only; no value was present.
- Both temporary export files were deleted after proof completion.

## Disposable identity and preflight

- Database image: `public.ecr.aws/supabase/postgres:17.6.1.143`, matching the hosted PostgreSQL 17 major.
- Dedicated loopback port: `127.0.0.1:55322`.
- The container, Docker network, and volume used the unique `scrimstats_wo040_phase_d_20260806` identity. None existed before the proof.
- Before candidate application: zero estimated rows across `public`/`security`; zero tenants, integration events, delivery attempts, Discord installations, Auth users, and Vault secrets; `security.discord_qa_nonce_runs` was absent.
- The running ClimbLab database remained on its existing healthy container and port and was never attached to the Phase D network.

## Candidate and pgTAP result

- Restored the zero-data current ScrimStats schema with stop-on-error enabled.
- Applied only `20260806095431_wo040_discord_nonce_qa_controls.sql`; every statement completed successfully.
- The first test pass completed assertions 1-11 and then stopped because the CLI default schema export excludes Supabase's `auth.jwt()` helper. The test transaction rolled back automatically.
- Exported the hosted Auth schema without rows and restored the exact exported `auth.jwt()` schema object into the disposable clone. No candidate SQL changed.
- The second `wo040_discord_qa_nonce.test.sql` execution passed **25/25** assertions and ended with `ROLLBACK`.
- Post-test state: zero tenants, events, delivery attempts, and nonce runs; zero active exact-event runs; `security.discord_qa_nonce_runs` retained RLS enabled.

## Lint and advisor result

- `security` schema lint: no schema errors.
- Direct `plpgsql_check` of `public.claim_discord_qa_nonce_probe(uuid)` and `public.complete_discord_qa_nonce_probe(uuid,text,integer,integer,boolean,boolean,text)`: zero issues.
- Full-schema lint reported inherited clone/baseline errors outside Phase D, including legacy encryption helpers, an Auth-column mismatch, and historical draft/external-tool functions. No Phase D object was named.
- Security/performance advisors completed with no error-level finding. Warning-level findings were inherited public-schema performance notices on `contact_submissions`, `external_draft_tools`, `live_game_data`, `game_drafts`, and `subscribers`; none referenced `security.discord_qa_nonce_runs` or a Phase D RPC. Relevant Supabase guidance: <https://supabase.com/docs/guides/database/database-linter>.

## Hosted isolation and cleanup

- Final read-only hosted check: Phase D table absent; Discord events `10`; Discord delivery attempts `12`; active exact-event runs `0`; active Discord workers `0`.
- Deleted only the exact Phase D disposable container, network, volume, and temporary export directory. Follow-up checks returned zero matching resources and no export path.
- ClimbLab remained healthy on its original container/port. `supabase/config.toml` was restored to its original project identity and local database ports/version; the approved explicit `[functions.discord-qa-nonce] verify_jwt = true` source correction remains.

## Evidence classification

This is local disposable-database migration, RLS/grant, function, and rollback evidence. It is not hosted migration, deployed gateway-authentication, provider deduplication, rendered-message, recovery rehearsal, production smoke, pilot, customer availability, or release evidence. WO-2026-040 remains HOLD.

## Scheduler reactivation correction proof - 2026-08-06

Theo approved the source-only scheduler correction and a new disposable proof after the hosted Phase D-B rehearsal showed that named `cron.schedule()` reconciliation left jobs 4/5 inactive. No commit, push, hosted migration, Function deployment, provider request, committed worker activation, fixture/customer action, Phase D-C action, or release action was approved or performed.

- Candidate migration: `20260806141005_wo040_discord_worker_reactivation.sql`. It preserves the existing disable routine, explicitly calls `cron.alter_job(..., active := true)` for both returned job IDs, re-reads each named row's actual state, and fails transactionally unless both are active.
- Schema-only evidence: default export 763,710 bytes / SHA-256 `819619623CDD00D9CC36D8AA0FA5EBD9B4C74E9C9B9FCE5888E1627A3C713EAE`; Auth export 47,837 bytes / SHA-256 `55E4904376BEA60ED540D8AE6A464FAA0758B48114CD450C84B356C459D473F9`. Neither export contained table-data `COPY`, `INSERT`, `UPDATE`, or `DELETE` statements. Both temporary exports were removed.
- Disposable identity: PostgreSQL image `public.ecr.aws/supabase/postgres:17.6.1.143`, database `scrimstats_wo040_phase_db_fix_20260806`, and loopback port `127.0.0.1:55323`, with matching uniquely named container/network/volume. The default schema restored with zero tenant, event, attempt, Vault, cron-job, or HTTP-queue rows. A full Auth-schema restore encountered the known disposable baseline `auth.users.is_sso_user` mismatch; the scheduler proof does not reference Auth and did not rely on that partial restore.
- Guarded rollback proof: two exact named jobs were created as inactive disposable fixtures before the transaction. Configure returned verified active state for both existing IDs; the unchanged disable routine returned both inactive; rollback preserved both original IDs and their inactive state. Cron history, HTTP queue, Discord events, and delivery attempts remained `0/0/0/0`.
- Function validation: direct `plpgsql_check` returned zero rows; `search_path` remained fixed to empty; `anon`, `authenticated`, and `service_role` execute checks were all false. Focused source contracts passed 11/11, scoped ESLint passed with zero warnings, TypeScript passed, production build passed, and bundle budgets passed.
- The Supabase CLI lint wrapper could not connect to the loopback container because it forced TLS while the disposable server refused TLS. Migration application with stop-on-error and direct `plpgsql_check` passed; hosted Advisors remain a required inert post-application check because the candidate has not been applied to the shared project.
- Cleanup verification found zero matching disposable resources and no export path. The existing ClimbLab database remained healthy on port 54322 and was never attached to the proof network.

Evidence classification remains local/source-only. WO-2026-040 stays **Blocked** under Core and release stays **HOLD** until Theo separately approves the exact candidate commit/push, hosted migration, inert checks, and one rollback-only active-then-inactive rehearsal.
