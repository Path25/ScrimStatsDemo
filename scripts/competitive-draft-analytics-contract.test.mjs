import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260725220511_competitive_draft_analytics.sql", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../src/hooks/useCompetitiveDraftAnalytics.ts", import.meta.url),
  "utf8",
);
const panels = readFileSync(
  new URL("../src/components/analytics/CompetitiveAnalyticsPanels.tsx", import.meta.url),
  "utf8",
);

test("draft analytics is tenant-authorized and explicitly granted", () => {
  assert.match(migration, /public\.user_belongs_to_tenant\(p_tenant_id\)/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke all on function public\.get_competitive_draft_analytics[\s\S]+from public, anon/);
  assert.match(migration, /grant execute on function public\.get_competitive_draft_analytics[\s\S]+to authenticated/);
});

test("draft analytics declares samples, exclusions and provenance", () => {
  for (const contract of [
    "qualifying_games",
    "excluded_games",
    "games_with_team_picks",
    "games_with_role_matchups",
    "games_with_bans",
    "collector_games",
    "manual_games",
  ]) {
    assert.match(migration, new RegExp(contract));
  }
  assert.doesNotMatch(migration, /prediction|performance_score|adherence_score/i);
});

test("active analytics route uses the RPC rather than fabricated fixtures", () => {
  assert.match(hook, /supabase\.rpc\("get_competitive_draft_analytics"/);
  assert.doesNotMatch(hook, /mock|fixture|Math\.random/i);
});

test("analytics panels surface small samples and unavailable evidence honestly", () => {
  assert.match(panels, /Small sample/);
  assert.match(panels, /SourceBadge source="collector"/);
  assert.match(panels, /SourceBadge source="manual"/);
  assert.match(panels, /No qualifying ban captures/);
  assert.match(panels, /awaiting taxonomy coverage/);
  assert.doesNotMatch(panels, /overall score|predicted win|recommendation/i);
});
