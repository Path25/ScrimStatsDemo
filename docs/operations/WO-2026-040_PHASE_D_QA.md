# WO-2026-040 Phase D controlled QA plan

## Boundary

This document describes a source-only candidate for later independently approved hosted QA. It does not approve a migration, Function deployment, fixture mutation, Discord permission change, provider request, module change, worker activation, customer use, smoke test, pilot, or release.

Workers remain inactive throughout every Phase D step. Never invoke the global dispatcher. Every provider-facing action must use the exact private non-customer tenant, event, channel, one-use run, evidence boundary, and cleanup approved by Theo.

## A. Nonce and delivered-evidence deduplication

1. Create one fresh, labelled non-customer schedule event with zero delivery attempts. Record its generated tenant/event/channel identifiers without putting generated IDs into a migration.
2. Independently verify the event is eligible, the tenant is Elite, its Discord module is live/enabled, exactly one matching subscription is enabled, all Discord workers are inactive, and no Discord QA control is active.
3. Temporarily permit the ScrimStats app to send only in the private QA channel. This permission change requires separate Theo approval and operator confirmation.
4. Arm one nonce probe for no more than five minutes. Invoke only `discord-qa-nonce` with gateway JWT verification plus the separate server-side dispatch secret.
5. The probe may make a maximum of two provider POSTs. Both use the byte-identical message body, deterministic event/channel nonce, `enforce_nonce: true`, empty allowed mentions, and suppressed embeds.
6. The first successful provider receipt is written to `integration_delivery_attempts` before the second request. The private run stores only status codes, an equality boolean, evidence state, and Function metadata; it stores no provider identifier, tenant/channel identifier in logs, secret, or message body.
7. Expected pass: both provider responses succeed, both return the same provider reference, and Discord shows exactly one visible private QA message. If nonce enforcement fails, one or two visible private QA messages are within the separately approved maximum; stop and retain `mismatch` evidence.
8. Restore the channel to view-only before testing the normal dispatcher.
9. Arm one normal exact-event dispatch run for the same still-pending event. The existing genuine delivered-attempt row must cause the dispatcher to skip Discord, create no new delivery-attempt row, and finish the event as delivered. A regression can only reach the now non-postable target and must return 403 rather than creating an unplanned message.
10. Confirm both runs are terminal, no run remains active, no unrelated event was claimed, no additional provider reference exists, and workers remain inactive.

## B. Global disable and rollback-only recovery

Use one explicit rollback-only transaction against the approved project:

1. Verify both Discord jobs are inactive and capture their IDs plus aggregate run-history counts.
2. Call `security.configure_discord_production_worker_schedule()` and verify both job rows are active only inside the transaction.
3. Immediately call `security.disable_discord_production_worker_schedule()` and verify both are inactive inside the same transaction.
4. Roll back the transaction. Never commit an active cron state.
5. Recheck both jobs are inactive, no `net.http_post` request was created, no cron run-history count changed, and no event or attempt count changed.

This proves the source-tracked global recovery controls without exposing the scheduler to an active committed job definition.

## C. Workspace disable and recovery

1. Snapshot the exact private fixture's Discord `tenant_feature_access` row.
2. Create two fresh labelled schedule events with zero attempts; do not reuse delivered, failed, or historical evidence.
3. Disable only that fixture's Discord module and invoke one exact-event run for event A. Expected result: the event is cancelled as unavailable and no provider attempt is recorded.
4. Restore the exact original module row, including release state, enabled state, updater, and timestamp fields where applicable.
5. With the channel view-only, invoke one exact-event run for event B. Expected result: one Discord 403 retry proves the restored module reaches the provider boundary without posting.
6. Cancel event B through a separately approved evidence-preserving cleanup update so it cannot enter a future global queue. Do not delete either fixture or its evidence.
7. Verify the module row exactly matches its snapshot, both events belong only to the fixture tenant, no unrelated row changed, no run remains active, and workers remain inactive.

## Stop conditions

Stop immediately if any identifier, entitlement, module state, subscription, deployed revision, worker state, active-run count, or event baseline differs from the separately approved preflight. Also stop after any unexpected delivery, provider response, second distinct provider reference, evidence-write failure, unrelated claim, cleanup mismatch, or worker activity.

## Disposable ScrimStats database proof path

Do not use a database belonging to another workspace and do not rename or rewrite historical migrations to make the current CLI accept them. The valid Phase D database proof path is an isolated schema-only clone:

1. Obtain separate approval for a read-only, schema-only export of the current ScrimStats Supabase database. Export no table rows, Auth users, Storage objects, Vault values, or secret/configuration values; record only the export timestamp and checksum.
2. Start a disposable local container from the same Supabase Postgres major version under a unique project/container identity, Docker network, database name, and non-conflicting host port. Do not attach it to the running ClimbLab network or ports.
3. Restore the approved schema-only export with ownership and privilege restoration disabled. Confirm the disposable database contains the current `public` and `security` objects needed by the Phase D migration while containing zero tenant, event, attempt, Discord, Auth-user, and Vault-secret rows.
4. Apply only `20260806130646_wo040_discord_nonce_qa_controls.sql` with stop-on-error enabled, then run `wo040_discord_qa_nonce.test.sql`. The test itself remains inside `BEGIN`/`ROLLBACK`; require all 25 assertions and a zero exit status.
5. Run database lint/advisor checks against that disposable database. Record bounded output only; do not record connection strings or credentials.
6. Stop and remove only the exact disposable container, network, and volume after confirming their resolved names carry the unique Phase D identity. Recheck that the running ClimbLab stack and the hosted ScrimStats project were untouched.

If an independently verified schema-only export cannot be obtained, the database proof remains blocked. Do not substitute the shared hosted project, a partial hand-built schema, or the existing ClimbLab database.

## Required approval sequence

1. QA source audit of the migration, shared message helper, nonce Function, tests, and this runbook.
2. Separate Theo approval for commit/push and hosted migration/Function deployment with inert verification only.
3. Separate Theo approval for the exact nonce fixture, temporary private-channel permission, maximum of two requests/messages, evidence capture, restoration, and exact dispatcher pass.
4. Separate Theo approval for rollback-only global control testing.
5. Separate Theo approval for the exact workspace module snapshot/change, two fixtures, invocations, restoration, and evidence-preserving cleanup.

None of these approvals activates workers, customers, production configuration, smoke testing, a pilot, or release.
