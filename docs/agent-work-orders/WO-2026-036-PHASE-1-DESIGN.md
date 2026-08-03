# WO-2026-036 Phase 1 design - Elite opponent preparation

## 1. Decision summary

WO-2026-036 will add a staff-only Elite workflow for turning existing, tenant-owned opponent evidence into a repeatable match-week preparation record. It will orchestrate existing Pro Scouting, Draft, Coaching Actions, and completed Scrim Block reviews without replacing those workflows or changing their current plan boundary.

Phase 1 is deliberately local to ScrimStats data already owned by the active tenant. It does not use Leaguepedia, provider feeds, public URLs, embeds, scraping, external resources, raw VODs, or any future WO-2026-035 source path.

The customer-facing name is **Opponent preparation**. An individual season-long record may be described as a **preparation playbook**. Existing reusable composition records remain **Draft playbooks**. Database objects use the unambiguous `opponent_preparation_` prefix.

This document is a design checkpoint only. It does not authorise a migration application, hosted data change, frontend deployment, billing or price change, customer activation, public claim, or release.

## 2. Outcome, users, and non-goals

### Intended outcome

For one opponent, authorised staff can maintain a season-long preparation playbook, approve an immutable match-week revision, assign canonical Coaching Actions, and later connect a completed Scrim Block review. Every factual input remains attributable to an existing tenant-owned source. Missing or insufficient evidence remains explicit.

Success means the workflow helps staff answer five operational questions without inventing intelligence:

1. What existing evidence did we review?
2. What is staff judgement rather than a sourced fact?
3. What patch or context was actually recorded?
4. What preparation actions are still open?
5. What completed review, if any, records what was tested?

### Phase 1 role contract

- **Elite Owner and Admin:** read, create, edit a draft, link or unlink permitted sources and actions, approve, create a revision, connect or remove a review link, archive, and restore.
- **Elite Member and Viewer:** no WO-2026-036 projection or mutation access in Phase 1.
- **Free and Pro roles:** retain current Scouting, Draft, Coaching Action, and review capabilities. They receive no WO-2026-036 data or controls.
- **Unknown, removed, or unauthenticated actors:** denied.

The staff-only decision is intentional because opponent preparation contains sensitive tactical judgement. A future team-facing projection requires its own approved scope; it must not be inferred from the published-brief behaviour already available in Pro.

### Non-goals

- No new opponent, champion, Draft, action, or review source of truth.
- No changes to current Pro Scouting or Draft entitlements.
- No member/player publication workflow.
- No official or third-party data ingestion.
- No external source links, citations, images, attachments, VODs, or provider payloads.
- No inferred tendencies, predictions, readiness scores, win probabilities, automated recommendations, or claims of improvement.
- No organisation-wide or cross-tenant sharing.
- No notifications, Discord delivery, email, recap, export, or generic knowledge-base surface.
- No billing, checkout, Stripe, pricing, or public Elite-copy change.

## 3. Existing architecture and reuse boundary

Phase 1 reuses canonical records rather than copying their content into a parallel intelligence system:

| Existing workflow | Phase 1 use | Boundary |
|---|---|---|
| `opponent_teams` | Stable same-tenant opponent identity | One active preparation playbook per tenant/opponent. |
| `scouting_evidence` | Attributed factual or manual opponent evidence | Link only; preserve source date, label, context, and lifecycle. Do not follow a superseding record silently. |
| `preparation_briefs` | Published, opponent-specific Draft preparation | Link only to the exact published or archived revision. Pro visibility remains unchanged. |
| `draft_playbooks` | Published internal Draft priorities or composition context | Link only to the exact tenant-owned revision; it is not opponent evidence. |
| `coaching_actions` | Assigned preparation work and current status | Link a canonical action; do not duplicate ownership, status, checkpoints, or review outcome. |
| `scrims` completed block review | Post-match/practice review reference | Link only when the canonical block review is complete and belongs to the same tenant/opponent. |

Existing external-draft, Leaguepedia, provider, source-URL, and embedded-resource records are excluded even if they exist elsewhere in the repository.

The primary UI belongs in `ScoutingTeamReport` because the playbook is opponent-owned. Draft receives only a compact staff-only breadcrumb into the linked preparation record. Coaching Actions and Scrim Block may receive staff-only breadcrumbs or link controls, but no new top-level route, Overview card, or parallel editor is introduced.

## 4. Lifecycle and evidence semantics

### Season-long root

An active preparation playbook is the stable tenant/opponent container. Archiving hides it from the active workflow but retains every revision, source link, action link, review link, and audit event. Restoring is permitted only when no other active playbook exists for that tenant/opponent.

### Immutable revisions

Each match-week plan is a numbered revision:

- `draft`: editable by authorised staff with optimistic concurrency.
- `approved`: immutable preparation record. Approval records the actor and time.

Only one draft revision may exist for a playbook. Creating a revision clones the latest approved revision's staff-authored fields and active link references into a new draft. It does not mutate or relabel the prior approved revision. Linked canonical sources continue to resolve independently.

Approval requires:

- a non-empty title and explicit staff judgement;
- a recorded fixture/context label or an explicit statement that context is not recorded;
- at least one permitted evidence link or one `declared_insufficient` record;
- at least one linked canonical Coaching Action;
- every linked source and action to pass same-tenant and lifecycle validation at approval time; and
- the submitted expected version to match the locked draft revision.

A review link is optional at approval because it occurs after preparation. Its absence renders as **Review not recorded**, never as an incomplete technical error.

### Honest states

- **Evidence available:** the exact linked source still exists, belongs to the same tenant, and remains permitted.
- **Evidence superseded:** the exact Scouting record was superseded. Retain its recorded label and date; do not substitute the successor.
- **Evidence unavailable:** the source is missing, archived in a way that removes permitted access, no longer matches the tenant/opponent contract, or cannot be resolved.
- **Evidence insufficient:** staff deliberately recorded why qualifying evidence was insufficient. This is an editorial state, not factual evidence.
- **Patch recorded:** a source or staff context contains an explicit patch label.
- **Patch not recorded:** no patch is stored. Phase 1 never infers the current patch.
- **Action open:** the canonical linked action is not complete or dismissed.
- **Action unavailable:** the action is missing, archived, moved outside the valid relationship, or no longer readable.
- **Review linked:** the exact same-tenant Scrim Block review is complete and remains resolvable.
- **Review unavailable:** the source review was reopened, removed, archived, or otherwise no longer qualifies.

Approval is not a prediction, recommendation, or claim that a tendency is true. It records that authorised staff approved a preparation revision based on the displayed evidence and their separately labelled judgement.

## 5. Proposed data model

The migration should create five private workflow tables. All use UUID primary keys, lowercase identifiers, bounded text checks, explicit timestamps, composite same-tenant foreign keys, and indexes for every foreign key and primary list/read path.

### `public.opponent_preparation_playbooks`

Stable season-long container:

| Column | Contract |
|---|---|
| `id uuid` | Primary key. |
| `tenant_id uuid` | Required tenant ownership. |
| `opponent_team_id uuid` | Same-tenant opponent reference. |
| `title text` | Staff label, trimmed, 1-140 characters. |
| `version integer` | Root optimistic-concurrency version, starting at 1. |
| `created_by uuid` / `created_at timestamptz` | Creation attribution. |
| `updated_by uuid` / `updated_at timestamptz` | Latest root mutation attribution. |
| `archived_by uuid` / `archived_at timestamptz` | Soft archive provenance; both null or both set. |

A partial unique index enforces one active playbook per `(tenant_id, opponent_team_id)` where `archived_at is null`. A composite unique key on `(id, tenant_id)` supports same-tenant child references.

### `public.opponent_preparation_revisions`

Editable draft and immutable approved match-week revisions:

| Column | Contract |
|---|---|
| `id uuid`, `tenant_id uuid`, `playbook_id uuid` | Composite same-tenant identity. |
| `revision_number integer` | Positive and unique within the playbook. |
| `status text` | `draft` or `approved`. |
| `title text` | Match-week preparation title, trimmed, 1-140 characters. |
| `fixture_scrim_id uuid` | Optional same-tenant fixture; must match the playbook opponent when present. |
| `context_label text` | Explicit staff context, or null when context is unrecorded. |
| `patch_label text` | Optional recorded patch; never derived as current. |
| `staff_judgement text` | Explicit editorial judgement, up to a bounded length. |
| `version integer` | Draft optimistic-concurrency version. |
| `created_by uuid` / `created_at timestamptz` | Revision provenance. |
| `approved_by uuid` / `approved_at timestamptz` | Both required only for `approved`. |

One partial unique index permits only one draft per playbook. Approved rows are immutable through both the RPC contract and a defensive trigger. The table stores staff-authored content, not copied raw source content.

### `public.opponent_preparation_evidence_links`

Source references and minimal historical labels:

| Column | Contract |
|---|---|
| `id uuid`, `tenant_id uuid`, `revision_id uuid` | Same-tenant revision link. |
| `source_type text` | `scouting_evidence`, `preparation_brief`, `draft_playbook`, or `declared_insufficient`. |
| `source_id uuid` | Required for canonical sources; null for `declared_insufficient`. |
| `source_label text` | Bounded label captured at link time. |
| `source_recorded_at timestamptz` | Canonical source date captured at link time. |
| `source_patch_label text` | Optional patch exactly as stored on the canonical source. |
| `staff_relevance_note text` | Why staff included the source; explicitly editorial. |
| `insufficient_reason text` | Required only for `declared_insufficient`. |
| `linked_by uuid` / `linked_at timestamptz` | Link provenance. |
| `removed_by uuid` / `removed_at timestamptz` | Soft unlink provenance on draft revisions only. |

Shape constraints enforce a source ID for canonical links and a reason with no source ID for `declared_insufficient`. A partial unique index prevents duplicate active canonical links on one revision. Source availability is resolved at read and approval time; the stored label/date are historical context, not proof that the source remains available.

### `public.opponent_preparation_action_links`

Canonical preparation work:

| Column | Contract |
|---|---|
| `id uuid`, `tenant_id uuid`, `revision_id uuid` | Same-tenant revision link. |
| `action_id uuid` | Same-tenant `coaching_actions` reference. |
| `linked_by uuid` / `linked_at timestamptz` | Link provenance. |
| `removed_by uuid` / `removed_at timestamptz` | Soft unlink provenance on draft revisions only. |

An active action may appear once per revision. Linking does not change action ownership or status and cannot create an action. Action creation and review continue through the existing Coaching Action RPCs.

### `public.opponent_preparation_review_links`

Post-match/practice outcome reference:

| Column | Contract |
|---|---|
| `id uuid`, `tenant_id uuid`, `revision_id uuid` | Same-tenant revision link. |
| `scrim_id uuid` | Exact same-tenant Scrim Block whose review is complete and whose opponent matches the playbook. |
| `staff_outcome_summary text` | Bounded editorial account of what was tested; not an inferred result. |
| `linked_by uuid` / `linked_at timestamptz` | Link provenance. |
| `removed_by uuid` / `removed_at timestamptz` | Soft unlink provenance. |

Only one active review link is permitted per revision. A reopened review remains linked historically but projects as unavailable until it is complete again. Raw game or coach-feedback content is never copied into this table or projection.

### `public.opponent_preparation_events`

Append-only audit events for `created`, `draft_updated`, `evidence_linked`, `evidence_unlinked`, `action_linked`, `action_unlinked`, `approved`, `revision_created`, `review_linked`, `review_unlinked`, `archived`, and `restored`.

Each event records tenant, playbook, optional revision, actor, event type, resulting version, bounded summary, and timestamp. Authenticated clients receive no direct table access and the table cannot be updated or deleted through application roles.

## 6. Source validation contract

Every source identifier is validated inside the same transaction as the link or approval mutation.

### Scouting evidence

- `tenant_id` and `opponent_team_id` must match the playbook.
- The exact evidence record may be linked only while active.
- Its title, `observed_at`, optional patch/context, and lifecycle are the only permitted source metadata in the projection.
- Observation text may be shown to authorised staff through the shaped projection but is not copied into the new tables.
- If superseded later, the link remains on the old record and displays `superseded`; it never follows `superseded_by_evidence_id` automatically.

### Preparation brief

- Tenant and opponent must match the playbook.
- Only `published` or historically `archived` briefs with their immutable snapshot may be linked.
- The exact revision remains the reference; no automatic move to a newer brief revision.

### Draft playbook

- It must belong to the same tenant and be `published` or historically `archived` with an immutable snapshot.
- It supplies internal Draft priority context, not opponent evidence.
- It cannot satisfy the opponent-evidence requirement by itself. Approval still requires Scouting evidence or `declared_insufficient`.

### Declared insufficient evidence

- Has no source ID.
- Requires a bounded, non-empty staff explanation.
- Is displayed as insufficient and never counted or described as evidence.

### Explicit exclusions

The source validator rejects external drafts, provider records, source URLs, Leaguepedia records, attachments, VODs, embeds, arbitrary table names, and cross-tenant IDs. The API accepts a closed source-type enum, never a caller-supplied relation or SQL fragment.

## 7. Entitlement, authorization, RLS, and grants

### Module contract

Add `opponent_preparation` to `tenant_feature_access` and the TypeScript workspace-module union.

- Existing and future tenants start `planned/false`.
- An Elite upgrade never enables the module automatically.
- A downgrade disables it but retains all records.
- Missing rows, loading failures, non-`live` state, or `is_enabled = false` deny access.
- Only the named QA fixture may later be set `live/true`, and only after separate hosted-mutation approval.

### Exact access helper

`public.has_opponent_preparation_access(p_tenant_id uuid)` returns true only when all are true:

```text
auth.uid() is present
AND tenant membership exists for auth.uid()
AND membership role is owner or admin
AND tenant subscription is exactly Elite and currently entitled
AND tenant_feature_access.module_key = 'opponent_preparation'
AND release_state = 'live'
AND is_enabled = true
```

The helper must reuse the authoritative subscription-lifecycle interpretation already used by the working WO-033 boundary. It must not read user-editable metadata or introduce a second plan-status model.

### Base-table policy

- Enable and force RLS on all five new tables.
- Revoke every privilege from `public`, `anon`, and `authenticated`.
- Do not grant authenticated clients direct read or mutation access.
- Grant `service_role` only the operations required for approved maintenance and verification; audit events receive no update/delete grant.
- Every table and foreign-key column receives the required index. Tenant equality columns lead composite indexes used by list, lifecycle, and RLS checks.

### Function policy

Privileged validation helpers live in the non-exposed `security` schema, use `security definer`, set `search_path = ''`, check the authenticated actor explicitly, and have execution revoked from public roles.

Public RPCs are the only browser-facing API. Each RPC:

1. rejects an absent authenticated user;
2. verifies exact Elite/module/staff access;
3. resolves the canonical tenant from the target row for ID-based mutations;
4. validates every supplied parent, source, action, fixture, and review ID through same-tenant joins;
5. locks mutable rows in a consistent order;
6. enforces the expected version and lifecycle invariants;
7. performs one short transaction with no external work;
8. writes the append-only event; and
9. returns only a bounded result or shaped projection.

Every public function signature is first revoked from `public`, `anon`, and `authenticated`, then only the intended read/write signatures are granted to `authenticated`. Authorization still occurs inside each function.

### Proposed RPC surface

- `get_opponent_preparation_playbook(p_tenant_id, p_opponent_team_id)`
- `create_opponent_preparation_playbook(...)`
- `update_opponent_preparation_draft(p_revision_id, p_expected_version, ...)`
- `link_opponent_preparation_evidence(...)`
- `unlink_opponent_preparation_evidence(...)`
- `link_opponent_preparation_action(...)`
- `unlink_opponent_preparation_action(...)`
- `approve_opponent_preparation_revision(p_revision_id, p_expected_version)`
- `create_opponent_preparation_revision(p_playbook_id, p_expected_version)`
- `link_opponent_preparation_review(...)`
- `unlink_opponent_preparation_review(...)`
- `archive_opponent_preparation_playbook(...)`
- `restore_opponent_preparation_playbook(...)`

The read RPC returns a versioned `staff-v1` JSON contract only. Member/viewer and ineligible-plan calls receive generic SQLSTATE `42501` unavailability, not existence or entitlement detail.

## 8. Projection and browser contract

The `staff-v1` projection returns only:

- playbook ID, opponent display name, title, root version, archive state, and timestamps;
- ordered revision metadata and explicit draft/approved state;
- recorded fixture, context, and patch labels or honest not-recorded states;
- staff judgement, clearly labelled as editorial;
- evidence type, historical label/date/patch, availability, relevance note, and permitted source display fields;
- canonical action ID, title, owner display label, status, due/checkpoint display, and availability;
- linked review block display label, completion/availability state, and staff outcome summary; and
- permitted mutation capabilities derived by the server.

It does not return emails, Auth UUIDs for display, provider payloads, source URLs, arbitrary JSON snapshots, raw coach feedback, raw game telemetry, internal event history, or data from another tenant.

React Query keys include tenant ID, opponent ID, active role, and module state. Tenant switching, role change, downgrade, module disable, or membership loss removes prior WO-2026-036 queries. Client invalidation limits stale display; it is not authorization.

Required UI states:

- module unavailable or access denied;
- loading and retryable server error;
- no active playbook;
- editable draft;
- approval blocked with specific safe validation guidance;
- approved revision;
- newer draft alongside approved history;
- no patch/context recorded;
- evidence available, superseded, unavailable, or insufficient;
- action open, complete, dismissed, or unavailable;
- review not recorded, linked, reopened/unavailable, or complete;
- archived playbook and safe restore collision.

Desktop and 390px mobile layouts must keep staff judgement visually distinct from sourced facts. No unavailable state may fall back to mock opponent or plan data.

## 9. Concurrency, integrity, and recovery

- Every mutable root or draft mutation uses an expected integer version and rejects stale writes.
- Approval locks the root and draft first, then active link rows in stable ID order before validating sources and actions.
- Approved revision fields and their link set are immutable. Removing a mistaken approved link requires a new revision; historical data is not rewritten.
- Review links may be added or removed after approval because they record a later outcome. Each change is audited.
- Archive and restore never delete records.
- Foreign keys use composite `(id, tenant_id)` relationships where tenant ownership must be preserved.
- Soft-removal uniqueness uses partial indexes so retained history does not block a replacement link.

Before a migration is authored, record a source checkpoint commit. Before any hosted application, capture the approved schema/function backup required by the incident-recovery procedure.

Operational rollback is:

1. set only the affected tenant's `opponent_preparation` module to disabled;
2. remove or hide the frontend entry point in the deployment if necessary;
3. retain all playbook, revision, link, and audit history;
4. inspect and correct through a forward migration; and
5. re-enable only after the isolated fixture passes again.

Do not drop tables or delete customer history as a release rollback.

## 10. Implementation sequence

### Phase 2A - local schema and security boundary

1. Create a source checkpoint commit after Theo accepts this design.
2. Use `supabase migration new` to create the migration filename.
3. Add the module constraint/update, default `planned/false` seeding, and downgrade-only disable behaviour.
4. Add the five tables, checks, composite foreign keys, partial uniqueness, foreign-key indexes, and audit protections.
5. Add source-availability and immutable-approved-revision triggers.
6. Add the exact access helper, internal validators, shaped read RPC, and versioned mutation RPCs.
7. Revoke default privileges and grant only explicit RPC execution and required maintenance access.
8. Regenerate Supabase types from the schema; never edit the generated file manually.

### Phase 2B - application integration

1. Add `opponent_preparation` to fail-closed workspace-module types and queries.
2. Add explicit view/manage role capabilities for Owner/Admin only.
3. Add domain types, the RPC hook, role/tenant-safe cache invalidation, and error mapping.
4. Add the primary Opponent preparation panel to `ScoutingTeamReport`.
5. Add compact staff-only breadcrumbs in Draft, Coaching Actions, and Scrim Block where the canonical link exists.
6. Add accessible desktop/mobile loading, empty, unavailable, lifecycle, and conflict states.

### Phase 2C - evidence and handoff

1. Run database tests across plan, module, role, tenant, lifecycle, source, and stale-version cases.
2. Run focused frontend contracts, ESLint with zero warnings, TypeScript, production build, and bundle budget.
3. Run local desktop and 390px browser verification.
4. Update the work order and board with exact local evidence and reproducible QA steps.
5. Request separate approval before hosted migration application or frontend deployment.

## 11. Required test matrix

### Authorization and entitlement

| Actor/state | Read | Mutation |
|---|---|---|
| Unauthenticated | Denied | Denied |
| Free Owner/Admin/Member/Viewer | Denied | Denied |
| Pro Owner/Admin/Member/Viewer | Denied | Denied |
| Elite with missing module row | Denied | Denied |
| Elite with `planned`, `beta`, or disabled module | Denied | Denied |
| Elite/live/enabled Owner | `staff-v1` | Permitted same-tenant lifecycle |
| Elite/live/enabled Admin | `staff-v1` | Permitted same-tenant lifecycle |
| Elite/live/enabled Member | Denied | Denied |
| Elite/live/enabled Viewer | Denied | Denied |
| Elite tenant B targeting tenant A IDs | Denied/no disclosure | Denied/no mutation |

### Lifecycle and integrity

- Create one active playbook and reject a duplicate active playbook for the same opponent.
- Reject blank judgement, missing context declaration, no evidence/insufficient record, or no linked action at approval.
- Approve a valid draft and reject every attempted approved-content or approved-link mutation.
- Create one new draft from an approved revision and reject a second concurrent draft.
- Reject stale expected versions without changing the current record.
- Archive and restore with full history retained; reject restore when an active collision exists.
- Add and remove a post-approval review link with audit history retained.

### Provenance

- Accept same-tenant, same-opponent active Scouting evidence.
- Reject other-opponent, other-tenant, external, arbitrary, and missing source IDs.
- Preserve the exact link and render `superseded` when Scouting evidence is revised.
- Link only published/archived immutable preparation briefs and Draft playbooks.
- Ensure Draft playbook context cannot alone satisfy opponent evidence.
- Record and render `declared_insufficient` without counting it as evidence.
- Render source-specific patch/date/context and `not recorded` without currentness claims.
- Reopen or archive a linked review and render it unavailable without deleting the link.

### Grants and direct access

- Inspect table, sequence, function, and schema grants.
- Confirm authenticated direct table select/insert/update/delete is denied.
- Confirm public/anon function execution is denied.
- Confirm the read RPC exposes only `staff-v1` fields.
- Run Supabase DB lint and Security/Performance Advisor review.

### Hosted QA after separate approval

Use one named, isolated, non-customer Elite fixture and separate Pro, Free, and tenant-B controls. Seed only bounded tenant-owned records. Capture migration version, deployment revision, redacted identifiers, role/plan/module states, direct RPC results, desktop/mobile screenshots, console state, and Advisor exports. Disable the fixture module after QA unless Theo separately approves continued use.

## 12. Acceptance traceability

| WO-036 acceptance criterion | Design contract | Required evidence |
|---|---|---|
| Elite staff create, approve, revise, and archive | Root plus immutable revisions, staff-only RPC lifecycle, soft archive | Local DB contracts and hosted owner/admin browser lifecycle |
| Only permitted evidence or explicit insufficiency | Closed source enum, transactional tenant/opponent validation, `declared_insufficient` | Source allow/deny matrix and unavailable-state screenshots |
| Patch/context, date, judgement, actions, and review remain honest | Source metadata, editorial labels, canonical action/review links, explicit not-recorded/unavailable states | Projection contract and desktop/mobile browser evidence |
| Free/Pro/ineligible roles and other tenants denied below browser | Exact Elite/live/enabled Owner/Admin helper, locked base tables, RPC-only access | Direct plan/role/tenant denial matrix and grant inspection |
| Hosted entitlement and provenance checks pass | Isolated fixture procedure and fail-closed module | QA and Release Auditor evidence pack after separate approvals |

## 13. Approval gates remaining

- **Phase 1 scope and implementation:** approved by Theo on 2026-08-03.
- **This design checkpoint:** accepted by Theo on 2026-08-03.
- **Migration authoring and local implementation:** approved to proceed locally on 2026-08-03.
- **Hosted migration application:** requires separate explicit approval.
- **Staging frontend deployment:** requires separate explicit approval.
- **Billing, price, checkout, customer activation, external sources, public claims, and release:** not approved and outside this phase.
