import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pilotOps = read("supabase/functions/pilot-ops/index.ts");
const scorecard = read("src/components/operations/FounderFunnelScorecard.tsx");

test("founder funnel is operator-enforced and aggregate-only", () => {
  assert.match(pilotOps, /platform_operators[\s\S]*is_active/);
  assert.match(pilotOps, /action === "funnel_scorecard"/);
  assert.match(pilotOps, /unsupported_funnel_period/);
  assert.match(pilotOps, /get_founder_funnel_scorecard/);
  for (const key of ["account_registered", "workspace_created", "first_scheduled_block", "first_recorded_game", "workspace_activated", "first_paid_upgrade"]) assert.match(pilotOps, new RegExp(`"${key}"`));
  assert.match(pilotOps, /instrumentation_started_at/);
  assert.doesNotMatch(pilotOps, /workspace_funnel_events"\)\.select/);
  assert.doesNotMatch(scorecard, /tenant_id|actor_id|email|revenue/i);
});

test("founder funnel UI keeps truthful states and responsive aggregate presentation", () => {
  assert.match(scorecard, /No events recorded since instrumentation began/);
  assert.match(scorecard, /Loading measured funnel milestones/);
  assert.match(scorecard, /Funnel reporting is unavailable/);
  assert.match(scorecard, /Last 30 days/);
  assert.match(scorecard, /Last 90 days/);
  assert.match(scorecard, /sm:grid-cols-2 xl:grid-cols-3/);
});
