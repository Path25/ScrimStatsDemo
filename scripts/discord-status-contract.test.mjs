import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord distinguishes connected configuration from released delivery", () => {
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");

  assert.match(panel, /deliveryConfigured = subscriptions\.length > 0/);
  assert.match(panel, /Connected - prompts off/);
  assert.match(panel, /Configured - test only/);
  assert.match(support, /Connected - prompts off/);
  assert.match(support, /Configured - test only/);
  assert.doesNotMatch(panel, /Delivery active/);
});
