import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Discord browser paths enforce Elite below the browser", () => {
  for (const path of ["supabase/functions/discord-install/index.ts", "supabase/functions/discord-channels/index.ts", "supabase/functions/discord-config/index.ts"]) {
    const source = read(path);
    assert.match(source, /subscription_tier/);
    assert.match(source, /"elite"/);
    assert.match(source, /managerMembership/);
  }
  const config = read("supabase/functions/discord-config/index.ts");
  assert.match(config, /schedule_created.*schedule_cancelled.*practice_reminder/);
  assert.doesNotMatch(config, /availability_reminder|collector_reminder/);
});

test("Discord reminder scheduling stays within the approved Elite promise", () => {
  const scheduler = read("supabase/functions/discord-schedule-reminders/index.ts");
  assert.match(scheduler, /\.eq\("event_type", "practice_reminder"\)/);
  assert.doesNotMatch(scheduler, /availability_reminder|collector_reminder/);
});
