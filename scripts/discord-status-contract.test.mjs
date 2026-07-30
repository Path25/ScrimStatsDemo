import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Discord distinguishes a connected server from active delivery", () => {
  const panel = read("src/components/integrations/DiscordScheduleIntegration.tsx");
  const support = read("docs/operations/DISCORD_DELIVERY_SUPPORT.md");

  assert.match(panel, /deliveryConfigured = subscriptions\.length > 0/);
  assert.match(panel, /Server connected — delivery not configured/);
  assert.match(panel, /Delivery active/);
  assert.match(support, /Server connected — delivery not configured/);
  assert.match(support, /Delivery active/);
});
