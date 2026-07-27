import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  operationalNotificationEmail,
  pilotWorkspaceEmail,
  workspaceInvitationEmail,
} from "../supabase/functions/_shared/email.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("transactional emails share the premium ScrimStats frame and plain-text fallback", () => {
  const messages = [
    workspaceInvitationEmail({
      teamName: "Northstar Academy",
      inviter: "Alex Coach",
      role: "member",
      actionUrl: "https://scrimstats.gg/accept-invite?token=example",
      expiresAt: "3 August 2026 at 14:00 UTC",
    }),
    pilotWorkspaceEmail({ teamName: "Northstar Academy", actionUrl: "https://scrimstats.gg/accept-invite?token=pilot" }),
    operationalNotificationEmail({ templateKey: "scrim_2h", title: "Scrim in two hours", body: "Northstar Academy starts 27 July 2026 at 19:00 UTC.", actionUrl: "https://scrimstats.gg/scrims/example" }),
  ];

  for (const message of messages) {
    assert.match(message.html, /ScrimStats/);
    assert.match(message.html, /ProComps/);
    assert.match(message.html, /https:\/\/scrimstats\.gg\/ScrimStats%20logo\.png/);
    assert.match(message.html, /alt="ScrimStats by ProComps"/);
    assert.doesNotMatch(message.html, />SS<|ScrimStats <span/);
    assert.match(message.html, /#20d7c0/i);
    assert.match(message.html, /role="presentation"/);
    assert.match(message.html, /@media only screen and \(max-width:620px\)/);
    assert.match(message.text, /SCRIMSTATS \/ PROCOMPS/);
    assert.match(message.text, /https:\/\/scrimstats\.gg/);
    assert.ok(message.subject.length > 12);
  }
});

test("customer-supplied values are escaped in email markup", () => {
  const message = workspaceInvitationEmail({
    teamName: '<img src=x onerror="alert(1)">',
    inviter: "Coach & Owner",
    role: "admin",
    actionUrl: "https://scrimstats.gg/accept-invite?token=a&next=b",
    expiresAt: "Soon",
  });

  assert.doesNotMatch(message.html, /<img src=x/);
  assert.match(message.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(message.html, /Coach &amp; Owner/);
  assert.match(message.html, /token=a&amp;next=b/);
});

test("Supabase Auth templates are configured and preserve their secure action links", () => {
  const config = read("supabase/config.toml");
  const pastePack = read("docs/launch/SUPABASE_EMAIL_TEMPLATE_PASTE_PACK.md");
  const templates = ["confirmation", "recovery", "invite", "magic-link", "email-change"];

  for (const name of templates) {
    const source = read(`supabase/templates/${name}.html`);
    assert.match(source, /ScrimStats/);
    assert.match(source, /ProComps/);
    assert.match(source, /https:\/\/scrimstats\.gg\/ScrimStats%20logo\.png/);
    assert.match(source, /width="220" alt="ScrimStats by ProComps"/);
    assert.doesNotMatch(source, />SS<|ScrimStats <span/);
    assert.match(source, /{{ \.ConfirmationURL }}/);
    assert.match(source, /role="presentation"/);
    assert.match(source, /#20d7c0/i);
    assert.ok(pastePack.includes(source.trim()), `${name} must stay identical in the paste pack`);
  }

  assert.match(config, /\[auth\.email\.template\.confirmation\][\s\S]*confirmation\.html/);
  assert.match(config, /\[auth\.email\.template\.recovery\][\s\S]*recovery\.html/);
  assert.match(config, /\[auth\.email\.template\.invite\][\s\S]*invite\.html/);
  assert.match(config, /\[auth\.email\.template\.magic_link\][\s\S]*magic-link\.html/);
  assert.match(config, /\[auth\.email\.template\.email_change\][\s\S]*email-change\.html/);
});

test("all Resend delivery paths use the shared customer email system", () => {
  const invitations = read("supabase/functions/team-invitations/index.ts");
  const pilotOps = read("supabase/functions/pilot-ops/index.ts");
  const notifications = read("supabase/functions/notification-worker/index.ts");

  assert.match(invitations, /workspaceInvitationEmail/);
  assert.match(pilotOps, /pilotWorkspaceEmail/);
  assert.match(notifications, /operationalNotificationEmail/);
  assert.doesNotMatch(invitations, /font-family:Arial,sans-serif;max-width/);
  assert.doesNotMatch(pilotOps, /<p>Your managed-pilot workspace is ready/);
  assert.doesNotMatch(notifications, /<div style="font-family:Inter/);
});
