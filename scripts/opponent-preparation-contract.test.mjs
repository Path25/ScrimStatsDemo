import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const migration = read(
  "supabase/migrations/20260803204749_elite_opponent_preparation.sql",
);
const design = read("docs/agent-work-orders/WO-2026-036-PHASE-1-DESIGN.md");

const publicRpcNames = [
  "get_opponent_preparation_playbook",
  "get_opponent_preparation_breadcrumbs",
  "create_opponent_preparation_playbook",
  "update_opponent_preparation_draft",
  "link_opponent_preparation_evidence",
  "unlink_opponent_preparation_evidence",
  "link_opponent_preparation_action",
  "unlink_opponent_preparation_action",
  "approve_opponent_preparation_revision",
  "create_opponent_preparation_revision",
  "link_opponent_preparation_review",
  "unlink_opponent_preparation_review",
  "archive_opponent_preparation_playbook",
  "restore_opponent_preparation_playbook",
];

test("opponent preparation starts fail-closed and requires exact Elite staff access", () => {
  assert.match(migration, /'opponent_preparation',\s*'planned',\s*false/);
  assert.match(migration, /tenant\.subscription_tier::text = 'elite'/);
  assert.match(migration, /array\['owner', 'admin'\]::public\.tenant_role\[\]/);
  assert.match(migration, /access\.release_state = 'live'/);
  assert.match(migration, /access\.is_enabled is true/);
  assert.match(migration, /public\.collector_entitlement_active\(/);
  assert.doesNotMatch(
    migration,
    /'opponent_preparation',\s*'live',\s*true/,
  );
});

test("private workflow tables deny direct application-role access", () => {
  const tableNames = [
    "opponent_preparation_playbooks",
    "opponent_preparation_revisions",
    "opponent_preparation_evidence_links",
    "opponent_preparation_action_links",
    "opponent_preparation_review_links",
    "opponent_preparation_events",
  ];

  for (const tableName of tableNames) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${tableName} force row level security`),
    );
  }

  assert.match(
    migration,
    /revoke all on table[\s\S]*public\.opponent_preparation_playbooks,[\s\S]*public\.opponent_preparation_events\s+from public, anon, authenticated/,
  );

  assert.doesNotMatch(
    migration,
    /grant (?:select|insert|update|delete|all)[^;]*opponent_preparation_[^;]*to authenticated/i,
  );
});

test("public mutations are shaped security-definer RPCs with explicit grants", () => {
  for (const rpcName of publicRpcNames) {
    assert.match(
      migration,
      new RegExp(
        `create or replace function public\\.${rpcName}\\([\\s\\S]*?security definer[\\s\\S]*?set search_path = ''`,
      ),
    );
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${rpcName}\\(`),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${rpcName}\\(`),
    );
  }
});

test("revision history is immutable, versioned, and provenance constrained", () => {
  assert.match(migration, /prevent_approved_opponent_preparation_revision_change/);
  assert.match(migration, /Approved opponent preparation revisions are immutable/);
  assert.match(migration, /Opponent preparation changed; refresh and try again/);
  assert.match(migration, /source_type in \(\s*'scouting_evidence',\s*'preparation_brief',\s*'draft_playbook',\s*'declared_insufficient'/);
  assert.match(migration, /evidence\.lifecycle_state = 'active'/);
  assert.match(migration, /brief\.status in \('published', 'archived'\)/);
  assert.match(migration, /scrim\.review_status = 'complete'/);
  assert.doesNotMatch(migration, /leaguepedia|https?:\/\/|external_source|provider_payload/i);
});

test("breadcrumbs are staff-scoped, bounded, and restricted to known canonical contexts", () => {
  assert.match(migration, /create or replace function public\.get_opponent_preparation_breadcrumbs/);
  assert.match(migration, /cardinality\(p_context_ids\) > 100/);
  assert.match(migration, /p_context_type not in \(\s*'action', 'scrim', 'preparation_brief', 'draft_playbook'\s*\)/);
  assert.match(migration, /security\.require_opponent_preparation_staff\(p_tenant_id\)/);
  assert.match(migration, /action_link\.action_id = any\(p_context_ids\)/);
  assert.match(migration, /review_link\.scrim_id = any\(p_context_ids\)/);
  assert.match(migration, /evidence_link\.source_id = any\(p_context_ids\)/);
});

test("the accepted design keeps Phase 1 staff-only and external-source free", () => {
  assert.match(design, /Elite Owner and Admin/);
  assert.match(design, /Elite Member and Viewer:[^\n]*no WO-2026-036 projection/);
  assert.match(design, /Free and Pro roles:[^\n]*no WO-2026-036 data or controls/);
  assert.match(design, /does not use Leaguepedia, provider feeds, public URLs, embeds, scraping/);
  assert.match(design, /Review not recorded/);
  assert.match(design, /Missing rows, loading failures, non-`live` state, or `is_enabled = false` deny access/);
});
