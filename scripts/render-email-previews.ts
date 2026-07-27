import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  operationalNotificationEmail,
  pilotWorkspaceEmail,
  workspaceInvitationEmail,
} from "../supabase/functions/_shared/email.ts";

const outputDirectory = resolve(process.argv[2] || ".email-previews");
mkdirSync(outputDirectory, { recursive: true });

const previews = {
  "workspace-invitation.html": workspaceInvitationEmail({
    teamName: "Northstar Academy",
    inviter: "Alex Morgan",
    role: "member",
    actionUrl: "https://scrimstats.gg/accept-invite?token=preview",
    expiresAt: "3 August 2026 at 14:00 UTC",
  }).html,
  "pilot-workspace.html": pilotWorkspaceEmail({
    teamName: "Northstar Academy",
    actionUrl: "https://scrimstats.gg/accept-invite?token=preview",
  }).html,
  "practice-reminder.html": operationalNotificationEmail({
    templateKey: "scrim_2h",
    title: "Scrim in two hours",
    body: "Kestrel Esports starts 27 July 2026 at 19:00 UTC.",
    actionUrl: "https://scrimstats.gg/scrims/preview",
  }).html,
};

for (const [filename, html] of Object.entries(previews)) {
  writeFileSync(resolve(outputDirectory, filename), html, "utf8");
}

console.log(`Rendered ${Object.keys(previews).length} email previews to ${outputDirectory}`);
