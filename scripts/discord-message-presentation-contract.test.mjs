import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord messages use one recipient-local schedule time and a cache-fresh safe link", () => {
  const dispatch = read("supabase/functions/discord-dispatch/index.ts");

  assert.match(dispatch, /function discordTime\(payload: Record<string, unknown>\)/);
  assert.match(dispatch, /<t:\$\{Math\.floor\(instant \/ 1_000\)\}:F>/);
  assert.match(dispatch, /"Time to be confirmed"/);
  assert.match(dispatch, /\?source=discord/);
  assert.doesNotMatch(dispatch, /Ã|Â/);
});

test("Scrim links retain generic ScrimStats Open Graph metadata", () => {
  const html = read("index.html");

  assert.match(html, /property="og:title" content="ScrimStats by ProComps \| Performance workspace for League teams"/);
  assert.match(html, /property="og:image" content="https:\/\/scrimstats\.gg\/og\.png"/);
  assert.doesNotMatch(html, /scrim_id|opponent_name|scheduled_time/);
});
