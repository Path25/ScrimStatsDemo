import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const collectorShared = read("supabase/functions/_shared/collector.ts");
const migration = read("supabase/migrations/20260728211332_collector_pro_entitlement_enforcement.sql");

test("Collector is a server-enforced Pro or Elite entitlement", () => {
  assert.match(collectorShared, /export async function collectorEntitled/);
  assert.match(collectorShared, /\['pro', 'elite'\]\.includes\(data\.subscription_tier\)/);
  assert.match(collectorShared, /subscription_past_due_started_at/);
  assert.match(collectorShared, /7 \* 24 \* 60 \* 60_000/);
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

test("Integrations does not present Collector as active for Free workspaces", () => {
  const integrations = read("src/pages/Integrations.tsx");
  const profileControl = read("src/components/integrations/CaptureProfileControl.tsx");
  const settings = read("src/pages/Settings.tsx");
  const moduleBadge = read("src/components/workspace/ModuleStateBadge.tsx");
  assert.match(integrations, /hasCollectorAccess=\{hasDesktopAccess\}/);
  assert.match(integrations, /Boolean\(tenant\?\.collectorEntitled\)/);
  assert.match(integrations, /enabled=\{hasDesktopAccess && modules\.collector\.enabled\}/);
  assert.match(integrations, /unavailableLabel="Pro feature"/);
  assert.match(profileControl, /requiresCollector && !hasCollectorAccess \? "Pro feature"/);
  assert.match(profileControl, /Game Capture is included with Pro/);
  assert.match(settings, /Boolean\(tenant\?\.collectorEntitled\)/);
  assert.match(moduleBadge, /enabled = true/);
  assert.match(moduleBadge, /!enabled \? unavailableLabel/);
});
