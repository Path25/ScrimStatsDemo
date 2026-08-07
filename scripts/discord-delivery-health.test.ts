import assert from "node:assert/strict";
import test from "node:test";

import { discordDeliveryHealthState } from "../supabase/functions/_shared/discord-health.ts";

test("Discord delivery health prioritises workspace connection and configuration", () => {
  assert.equal(discordDeliveryHealthState(null, 0, null), "setup_required");
  assert.equal(discordDeliveryHealthState("revoked", 0, { status: "delivered", attempt_count: 1 }), "disconnected");
  assert.equal(discordDeliveryHealthState("active", 0, { status: "failed", attempt_count: 5 }), "connected");
  assert.equal(discordDeliveryHealthState("active", 1, null), "configured");
});

test("Discord delivery health distinguishes queued, retrying, failed, and delivered evidence", () => {
  assert.equal(discordDeliveryHealthState("active", 1, { status: "pending", attempt_count: 0 }), "queued");
  assert.equal(discordDeliveryHealthState("active", 1, { status: "processing", attempt_count: 1 }), "retrying");
  assert.equal(discordDeliveryHealthState("active", 1, { status: "failed", attempt_count: 5 }), "failed");
  assert.equal(discordDeliveryHealthState("active", 1, { status: "delivered", attempt_count: 1 }), "delivered");
  assert.equal(discordDeliveryHealthState("active", 1, { status: "cancelled", attempt_count: 0 }), "configured");
});
