import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord messages use one recipient-local schedule time without embeds or mentions", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");
  const delivery = read("supabase/functions/_shared/discord-delivery.ts");

  assert.match(delivery, /function discordTime\(payload: Record<string, unknown>\)/);
  assert.match(delivery, /<t:\$\{Math\.floor\(instant \/ 1_000\)\}:F>/);
  assert.match(delivery, /"Time to be confirmed"/);
  assert.match(delivery, /const DISCORD_SUPPRESS_EMBEDS = 1 << 2;/);
  assert.match(delivery, /allowed_mentions: \{ parse: \[\] as string\[\] \},\s+flags: DISCORD_SUPPRESS_EMBEDS,/);
  assert.match(dispatch, /discordEventMessage\(event, appUrl\)/);
  assert.doesNotMatch(dispatch, /Ã|Â/);
});

test("Scrim links retain generic ScrimStats Open Graph metadata", () => {
  const html = read("index.html");

  assert.match(html, /property="og:title" content="ScrimStats by ProComps \| Performance workspace for League teams"/);
  assert.match(html, /property="og:image" content="https:\/\/scrimstats\.gg\/og\.png"/);
  assert.doesNotMatch(html, /scrim_id|opponent_name|scheduled_time/);
});
