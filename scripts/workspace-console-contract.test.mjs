import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const shell = read("src/components/layout/DashboardLayout.tsx");
const styles = read("src/index.css");
const settings = read("src/pages/Settings.tsx");
const review = read("src/components/scrims/ScrimBlockView.tsx");
const coreHooks = [
  "src/hooks/useScrimGames.ts",
  "src/hooks/useScrimParticipants.ts",
  "src/hooks/useAvailability.ts",
  "src/hooks/useGameDrafts.ts",
  "src/hooks/useCoachFeedback.ts",
  "src/hooks/useCalendarEvents.ts",
].map(read);
const coreRoutes = [
  "src/App.tsx",
  "src/pages/Overview.tsx",
  "src/pages/Players.tsx",
  "src/pages/Scrims.tsx",
  "src/pages/Calendar.tsx",
  "src/pages/Settings.tsx",
  "src/components/layout/DashboardLayout.tsx",
  "src/components/scrims/ScrimBlockView.tsx",
].map(read);

test("workspace shell validates tenant accent and exposes analyst-console tokens", () => {
  assert.match(shell, /\^#\[0-9a-f\]\{6\}\$/i);
  assert.match(shell, /--team-accent/);
  assert.match(shell, /memberships\.length > 1/);
  assert.match(styles, /\.workspace-shell/);
  assert.match(styles, /--workspace-surface/);
  assert.match(styles, /--workspace-accent/);
  assert.match(styles, /--workspace-manual/);
  assert.match(styles, /--workspace-awaiting/);
  assert.match(styles, /--workspace-unavailable/);
});

test("core data hooks never return mock team records", () => {
  for (const source of coreHooks) {
    assert.doesNotMatch(source, /MOCK_|mock-(?:game|player|avail|draft|feedback)/i);
  }
});

test("review workspace lazy-loads real panels and hides unfinished analytics", () => {
  assert.match(review, /const GameOverviewTab = lazy/);
  assert.match(review, /const DraftView = lazy/);
  assert.match(review, /const CoachFeedback = lazy/);
  assert.doesNotMatch(
    review,
    /ExternalDataAnalytics|DamageAnalysisChart|LiveGameChart|GameTimeline|MOCK_SCRIM_META/,
  );
});

test("settings exposes only live account, access, and collector workflows", () => {
  assert.match(settings, /DesktopAppStatus/);
  assert.match(settings, /DesktopCollectorIntegration/);
  assert.match(settings, /InviteTeamMemberDialog/);
  assert.doesNotMatch(
    settings,
    /PRO PLAN|Manage Billing|View Invoices|Riot Games API|GRID Esports|Ambient Glow|Glassmorphism/,
  );
});

test("core authenticated routes contain no encoding corruption or undersized labels", () => {
  for (const source of coreRoutes) {
    assert.doesNotMatch(source, /Â|â€”|â€“|â€¦|â€¢|ðŸ/);
    assert.doesNotMatch(source, /text-\[(?:8|9|10|11)px\]/);
  }
});
