import assert from "node:assert/strict";
import test from "node:test";

import { resolveWorkspaceAccess } from "../src/lib/workspace-access.ts";

const membership = (id: string) => ({ id });

test("unresolved membership state stays loading and never opens creation", () => {
  const access = resolveWorkspaceAccess({
    userId: "user-b",
    resolvedUserId: "user-a",
    authLoading: false,
    membershipLoading: false,
    memberships: [membership("tenant-a")],
    activeTenantId: "tenant-a",
    error: null,
  });

  assert.equal(access.isLoading, true);
  assert.equal(access.hasNoTenant, false);
  assert.equal(access.tenant, null);
  assert.deepEqual(access.memberships, []);
});

test("membership query failure is unavailable rather than membership-free", () => {
  const access = resolveWorkspaceAccess({
    userId: "user-a",
    resolvedUserId: "user-a",
    authLoading: false,
    membershipLoading: false,
    memberships: [],
    activeTenantId: null,
    error: "We could not load your team access. Please try again.",
  });

  assert.equal(access.isLoading, false);
  assert.equal(access.hasNoTenant, false);
  assert.equal(access.requiresWorkspaceSelection, false);
  assert.match(access.error || "", /could not load/i);
});

test("only a confirmed empty membership result opens creation", () => {
  const access = resolveWorkspaceAccess({
    userId: "user-a",
    resolvedUserId: "user-a",
    authLoading: false,
    membershipLoading: false,
    memberships: [],
    activeTenantId: null,
    error: null,
  });

  assert.equal(access.hasNoTenant, true);
  assert.equal(access.requiresWorkspaceSelection, false);
});

test("multiple memberships without a valid selection open the selector", () => {
  const access = resolveWorkspaceAccess({
    userId: "user-a",
    resolvedUserId: "user-a",
    authLoading: false,
    membershipLoading: false,
    memberships: [membership("tenant-a"), membership("tenant-b")],
    activeTenantId: null,
    error: null,
  });

  assert.equal(access.hasNoTenant, false);
  assert.equal(access.requiresWorkspaceSelection, true);
});

test("a server-confirmed active membership resolves the workspace", () => {
  const access = resolveWorkspaceAccess({
    userId: "user-a",
    resolvedUserId: "user-a",
    authLoading: false,
    membershipLoading: false,
    memberships: [membership("tenant-a"), membership("tenant-b")],
    activeTenantId: "tenant-b",
    error: null,
  });

  assert.equal(access.requiresWorkspaceSelection, false);
  assert.equal(access.tenant?.id, "tenant-b");
});
