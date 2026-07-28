import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const collectorShared = read("supabase/functions/_shared/collector.ts");
const migration = read("supabase/migrations/20260728110000_collector_pro_entitlement_enforcement.sql");

test("Collector is a server-enforced Pro or Elite entitlement", () => {
  assert.match(collectorShared, /export async function collectorEntitled/);
  assert.match(collectorShared, /data\?\.subscription_tier === 'pro' \|\| data\?\.subscription_tier === 'elite'/);
  for (const path of [
    "supabase/functions/collector-pairing/index.ts",
    "supabase/functions/collector-pair/index.ts",
    "supabase/functions/collector-status/index.ts",
    "supabase/functions/collector-ingest/index.ts",
  ]) {
    const source = read(path);
    assert.match(source, /collectorEntitled/);
    assert.match(source, /collector_plan_required/);
  }
});

test("database module state agrees with the Pro Collector contract", () => {
  assert.match(migration, /\(new\.id, 'collector', 'live', new\.subscription_tier::text in \('pro', 'elite'\), now\(\)\)/);
  assert.match(migration, /access\.module_key = 'collector'/);
  assert.match(migration, /Collector is available to Pro and Elite workspaces; Discord remains Elite-only/);
});
