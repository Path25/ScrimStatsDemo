import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord distinguishes connected configuration from released delivery", () => {
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");

  assert.match(panel, /deliveryConfigured = subscriptions\.length > 0/);
  assert.match(panel, /Connected - prompts off/);
  assert.match(panel, /Configured - pilot access/);
  assert.match(support, /Connected - prompts off/);
  assert.match(support, /Configured - pilot access/);
  assert.doesNotMatch(panel, /Delivery active/);
});
