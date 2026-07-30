import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord dispatch supports current Supabase server keys without exposing configuration", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const shared = read("supabase/functions/_shared/collector.ts");

  assert.match(dispatch, /SUPABASE_SECRET_KEYS/);
  assert.match(dispatch, /SUPABASE_SERVICE_ROLE_KEY_or_SUPABASE_SECRET_KEYS\.default/);
  assert.match(dispatch, /console\.error\("Discord delivery is not configured"/);
  assert.doesNotMatch(dispatch, /error: .*missing/);
  assert.match(shared, /function serviceRoleKey\(\)/);
  assert.match(shared, /SUPABASE_SECRET_KEYS/);
});
