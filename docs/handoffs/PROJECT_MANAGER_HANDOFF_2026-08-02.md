# ScrimStats Project Manager handoff — 2 August 2026

## Purpose

This handoff is the starting context for a replacement ScrimStats Project Manager agent. It is deliberately durable: confirm current claims against the repository, work-order evidence, connected systems, and current task state before changing a status or advising a release.

## Founder context

ScrimStats by ProComps is a premium League of Legends team-operations platform for amateur, grassroots, collegiate, and developing professional teams. Coaches and managers are the main daily users; players and viewers need reliable read-only access to relevant intelligence; organisation owners may also buy.

The near-term commercial aim is $200 MRR, initially through roughly 3–5 Pro and 1–2 Elite subscriptions, while rebuilding usage after the old product lost its registered-team base. The primary product bets are dependable team operations, practice/review, and scouting. Pro must have clear value; Elite is retained during soft launch while Discord integration and genuinely differentiated Elite value are explored.

The quality trade-off favours a polished, bespoke, operationally trustworthy product, while still moving at a practical pace. Weak first impressions and missing integrations/features are the largest perceived risks. Financial capacity is constrained; ProComps has final approval for marketing and contract-affecting matters.

## Operating rules

Read `AGENTS.md` first. Do not implement code, deploy, apply migrations, alter production data/configuration/secrets, change billing or pricing, contact customers, publish, or spend money unless Theo explicitly approves the action.

For every substantial review, inspect the relevant documents, code, tests, deployment evidence, work orders, analytics, and current task state. Reconcile claims with evidence and label work as proposed, implemented, locally tested, browser verified, hosted verified, or production-ready. Do not collapse those states into “done”.

The work-order file is the detailed source of truth. `docs/agent-work-orders/WORK_ORDER_INDEX.md` is the authoritative ID registry and current high-level status; `DEVELOPER_ASSIGNMENT_BOARD.md` is the developer dispatch aid. Where they conflict, do not guess: inspect evidence, record the discrepancy, and update only where evidence supports it. New IDs must be reserved in the index; the next available ID after this handoff is `WO-2026-030`.

## Shared workspace and roles

Work-order folders are `docs/agent-work-orders/proposed/`, `ready/`, `in-progress/`, `review/`, and `done/`. The template requires scope, non-goals, acceptance criteria, affected areas, risks, validation, priority, autonomy, size, risk, owner, dependencies, QA scenario, status, handoff, and release audit.

Roles:

- **Project Manager:** evidence-led prioritisation, work-order quality, founder decisions, handoffs, and status integrity. No implementation by default.
- **Core Features Developer:** all M/L work, integrations, shared components, data flow, Collector, auth, billing, Supabase, migrations, security, or medium/high risk.
- **Developer – Fast Lane:** S, Low-risk, isolated visual polish, copy, contained UX defects, or small tests/docs only. Never overlap Core work in shared files or refactors.
- **QA and Release Auditor:** independently verifies acceptance criteria and release evidence; does not treat local tests as hosted proof.
- **Technical Reporting Analyst:** measured reporting, source reliability, data definitions, and explicitly bounded interpretations.
- **Lead Marketing and Growth:** positioning, message ledger, audience research, and approval-gated outreach. No external contact without Theo/ProComps approval.
- **Theo:** founder decisions and explicit approvals. ProComps must approve marketing or contract-affecting activity.

## Current work-order position (recheck before dispatch)

The current registry/board shows no item ready for either developer lane. Do not manufacture Fast Lane work merely to keep the lane occupied.

| Area | Current position | Next action / dependency |
|---|---|---|
| WO-2026-006 reporting connections | PM, In Progress | Establish least-privilege authoritative source access and reliability telemetry; use the data dictionary and do not infer MRR from plan labels. |
| WO-2026-012 buyer standard | PM, Backlog | Define an evidence-based paid-buyer standard and Free-to-Pro conversion thesis; no pricing/plan change. |
| WO-2026-018 workspace language/journeys | PM, Backlog | Audit first, then split only isolated, reviewable fixes into new work orders. |
| WO-2026-026 activation follow-up | PM, In Progress | Maintain manual-first procedure and Message Ledger. No email has agent approval to send. Each recipient needs Theo’s final per-send approval. |
| WO-2026-003 funnel measurement | QA, Blocked | Theo must approve a minimal non-customer schedule/completed-game journey to create a real event; scorecard scope remains WO-011. |
| WO-2026-020 Free Solo Queue | QA, Blocked | Implementation has local evidence, but the hosted role/plan/tenant matrix needs isolated non-customer accounts or explicit approval for safe evidence collection. No migration/deployment assumption. |
| WO-2026-028 Pro purchase path | QA, Blocked | Theo must choose test mode or approve one capped live internal purchase/cancellation and provide isolated workspace plus redacted evidence access. |
| WO-2026-013 desktop live integration | Core, Blocked | Theo must select/approve the safe research direction. No provider setup, SDK, install/distribution, credentials, or spend. |
| WO-2026-023 additional workspaces | Core, Backlog | Needs Theo approval of tenant/RPC/auth design before development. |
| WO-2026-025 Discord `/scrim` | Core, Backlog | Reconcile stale dependency on WO-001 and obtain current approval/evidence before dispatch. Never configure Discord/provider secrets or public interaction URLs without approval. |
| WO-2026-014 buyer validation | Marketing, Blocked | Theo and ProComps must approve external contact before any outreach. |

Completed or conditionally accepted work includes WO-001, 004, 005, 007–011, 015–017, 019, 021–022, 024, 027, and 029. Conditional completion is not blanket production readiness. In particular, WO-016, WO-024, WO-009, and WO-011 retain explicitly accepted evidence/release boundaries; reopen only for a new defect or missing required release proof.

## Founder decisions presently most valuable

1. Approve a safe isolated hosted matrix for WO-020, or decide it should remain blocked.
2. For WO-028, select an isolated test-mode payment route or approve one capped, cancellable live internal purchase. This is required to substantiate the paid purchase/return journey.
3. For WO-003, approve or decline the minimal temporary non-customer activity journey that produces one real funnel event.
4. Decide whether to approve research only for WO-013’s desktop live-integration options.
5. If activation follow-up is to be sent, approve each specific recipient, final rendered copy, sender/reply address, destination workspace link, Discord contact/invite, and one-time send.

## Reporting and commercial evidence

Use `docs/operations/DATA_SOURCE_MAP_AND_METRICS_DICTIONARY.md` as the reporting definition. `public.scrim_games` and `stripe_webhook_events.received_at` are relevant sources. Stripe is authoritative for MRR; plan labels and webhook presence do not prove current revenue. A previously observed snapshot of $19.98 from two active Pro subscriptions is historical and must not be presented as current MRR without a fresh authoritative snapshot/reconciliation. Low-volume movement is not a trend.

## Customer activation and email materials

WO-026 documents the manual-first new-workspace follow-up process at `docs/operations/NEW_WORKSPACE_ACTIVATION_FOLLOW_UP.md`; positioning is governed by `docs/operations/MESSAGE_LEDGER.md`. Drafts exist under `docs/operations/drafts/`, including an Outlook-compatible personalised draft for Finals Gaming. They are drafts only: do not send, automate, or treat the Discord contact/invite as a product integration claim. Outlook Classic uses Word rendering, so use the `.eml` draft rather than pasting HTML; verify the exact recipient/link before Theo sends it manually.

## Required review output

For substantial reviews, use:

1. Executive summary
2. What changed since the previous review
3. What is genuinely working
4. What is incomplete, unverified or at risk
5. Top three recommended priorities
6. Decisions needed from Theo
7. Suggested next work item with a clear definition of done

When development work is identified, create or update a structured work order rather than merely recommending it. Keep a clear list of work orders ready for the appropriate developer lane.

## First run in the replacement chat

1. Read `AGENTS.md`, this handoff, the index, assignment board, template, and the latest relevant work-order evidence.
2. Reconcile status drift, especially any work order whose file heading conflicts with the registry or board; preserve history and do not rewrite conclusions without evidence.
3. Issue a concise Founder Daily Brief with the priority order, work by owner, blockers/risks/decisions, workspace changes, and next-agent readiness.
4. Ask Theo only for decisions that cannot be safely inferred or evidenced from the repository.
