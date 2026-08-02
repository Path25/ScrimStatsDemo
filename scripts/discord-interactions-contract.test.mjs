import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord interaction source verifies signatures before command parsing or lookup", () => {
  const source = read("supabase/functions/discord-interactions/index.ts");
  const config = read("supabase/config.toml");
  assert.match(source, /X-Signature-Timestamp/);
  assert.match(source, /X-Signature-Ed25519/);
  assert.match(source, /DISCORD_PUBLIC_KEY/);
  assert.match(source, /name: "Ed25519"/);
  assert.match(source, /if \(!\(await verified\(request, rawBody\)\)\) return json/);
  assert.ok(source.indexOf("await verified(request, rawBody)") < source.indexOf("JSON.parse(rawBody)"));
  assert.match(source, /try \{\s+parsed = JSON\.parse\(rawBody\);\s+\} catch \{\s+return ephemeral\("This interaction is not available\."\);\s+\}/);
  assert.match(source, /typeof parsed !== "object" \|\| Array\.isArray\(parsed\)/);
  assert.match(source, /const parsedStartsAt = new Date\(startsAt\);/);
  assert.match(source, /Number\.isNaN\(parsedStartsAt\.getTime\(\)\)/);
  assert.match(source, /p_starts_at: parsedStartsAt\.toISOString\(\)/);
  assert.match(source, /interaction\.type === 1/);
  assert.match(source, /command\.name !== "scrim"/);
  assert.match(source, /flags: 64/);
  assert.match(config, /\[functions\.discord-interactions\]\s+verify_jwt = false/);
});

test("Discord interaction creation is service-only, tenant-safe, idempotent, and overlap-aware", () => {
  const migration = read("supabase/migrations/20260802173000_discord_interaction_scheduling.sql");
  const interaction = read("supabase/functions/discord-interactions/index.ts");
  assert.match(migration, /create table if not exists public\.discord_permitted_roles/);
  assert.match(migration, /create table if not exists public\.discord_interaction_receipts/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant select on table public\.discord_permitted_roles, public\.discord_interaction_receipts to authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.discord_permitted_roles, public\.discord_interaction_receipts to service_role/);
  assert.match(migration, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/);
  assert.match(migration, /tenant\.subscription_tier = 'elite'/);
  assert.match(migration, /feature\.release_state = 'live'/);
  assert.match(migration, /feature\.is_enabled = true/);
  assert.match(migration, /installation\.guild_id = p_guild_id/);
  assert.match(migration, /role\.role_id = any\(p_role_ids\)/);
  assert.match(migration, /jsonb_array_length\(p_roles\) > 20/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /interaction_id, tenant_id, guild_id, scrim_id/);
  assert.match(migration, /scrim\.starts_at < v_end_at/);
  assert.match(migration, /status in \('scheduled', 'in_progress'\)/);
  assert.match(migration, /revoke all on function public\.create_discord_scrim_block[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.create_discord_scrim_block[\s\S]*to service_role/);
  assert.match(interaction, /rpc\("create_discord_scrim_block"/);
  assert.doesNotMatch(interaction, /from\("scrims"\)\.insert/);
});

test("Only a workspace manager can discover and persist permitted Discord roles", () => {
  const roles = read("supabase/functions/discord-roles/index.ts");
  const config = read("supabase/functions/discord-config/index.ts");
  const hook = read("src/hooks/useDiscordIntegration.ts");
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  assert.match(roles, /authenticatedUser/);
  assert.match(roles, /managerMembership/);
  assert.match(roles, /discordEntitled/);
  assert.match(roles, /guilds\/\$\{installation\.guild_id\}\/roles/);
  assert.match(config, /action === "set_permitted_roles"/);
  assert.match(config, /replace_discord_permitted_roles/);
  assert.match(hook, /discord-roles/);
  assert.match(hook, /configurePermittedRoles/);
  assert.match(panel, /Who can use \/scrim/);
  assert.match(panel, /Save \/scrim roles/);
});
