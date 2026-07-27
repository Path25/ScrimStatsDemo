import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260725123744_tenant_riot_credentials.sql", import.meta.url),
  "utf8",
);
const integrationFunction = readFileSync(
  new URL("../supabase/functions/riot-integration/index.ts", import.meta.url),
  "utf8",
);
const syncFunction = readFileSync(
  new URL("../supabase/functions/soloq-sync-v2/index.ts", import.meta.url),
  "utf8",
);
const component = readFileSync(
  new URL("../src/components/integrations/RiotApiIntegration.tsx", import.meta.url),
  "utf8",
);
const opponentMigration = readFileSync(
  new URL("../supabase/migrations/20260725124554_opponent_soloq_tracking.sql", import.meta.url),
  "utf8",
);
const opponentSync = readFileSync(
  new URL("../supabase/functions/opponent-soloq-sync/index.ts", import.meta.url),
  "utf8",
);
const opponentDialog = readFileSync(
  new URL("../src/components/scouting/OpponentSoloQDialog.tsx", import.meta.url),
  "utf8",
);
const collectorIngest = readFileSync(
  new URL("../supabase/functions/collector-ingest/index.ts", import.meta.url),
  "utf8",
);

test("tenant Riot keys are encrypted and browser roles cannot mutate or decrypt them", () => {
  assert.match(migration, /vault\.create_secret/);
  assert.match(migration, /vault\.decrypted_secrets/);
  assert.match(migration, /revoke all on public\.tenant_riot_integrations from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.tenant_riot_integrations to authenticated/);
  assert.match(migration, /grant execute on function public\.get_tenant_riot_api_key\(uuid\)\s+to service_role/);
});

test("credential changes require an authenticated workspace manager", () => {
  assert.match(integrationFunction, /authenticatedUser\(req\)/);
  assert.match(integrationFunction, /managerMembership\(user\.id, input\.tenantId\)/);
  assert.doesNotMatch(integrationFunction, /console\.log\([^)]*apiKey/);
  assert.match(integrationFunction, /store_tenant_riot_api_key/);
});

test("Solo Queue sync requires the workspace Riot key without a platform fallback", () => {
  assert.match(syncFunction, /get_tenant_riot_api_key/);
  assert.doesNotMatch(syncFunction, /Deno\.env\.get\('RIOT_API_KEY'\)/);
  assert.match(syncFunction, /Configure a valid workspace Riot API key in Integrations first/);
  assert.match(syncFunction, /tenant_riot_integrations/);
});

test("the integration UI never reads or renders stored key material", () => {
  assert.match(component, /encrypted in\s+Supabase Vault/);
  assert.match(component, /key_hint/);
  assert.doesNotMatch(component, /integration\.api_key/);
  assert.match(component, /Development keys expire every 24 hours/);
});

test("opponent Solo Queue records remain tenant-scoped and server-written", () => {
  assert.match(opponentMigration, /foreign key \(opponent_team_id, tenant_id\)/);
  assert.match(opponentMigration, /user_belongs_to_tenant\(tenant_id\)/);
  assert.match(opponentMigration, /revoke all on public\.opponent_soloq_recent_matches from public, anon, authenticated/);
  assert.match(opponentSync, /managerMembership\(user\.id, tenantId\)/);
  assert.match(opponentSync, /get_tenant_riot_api_key/);
});

test("opponent scouting exposes truthful rank and recent game context", () => {
  assert.match(opponentDialog, /Latest|Recent 20/);
  assert.match(opponentDialog, /Awaiting sync/);
  assert.match(opponentDialog, /No ranked matches cached/);
  assert.doesNotMatch(opponentDialog, /estimated|prediction|win probability/i);
});

test("paired desktop collectors can securely refresh their scheduled blocks and roster", () => {
  assert.match(collectorIngest, /deviceFromRequest\(req\)/);
  assert.match(collectorIngest, /body\.action === 'configuration'/);
  assert.match(collectorIngest, /\.eq\('tenant_id', device\.tenant_id\)/);
  assert.match(collectorIngest, /\.in\('status', \['scheduled', 'in_progress'\]\)/);
  assert.doesNotMatch(collectorIngest, /body\.tenant_id/);
});
