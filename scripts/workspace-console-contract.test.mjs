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
const customerCopy = [
  "src/pages/Landing.tsx",
  "src/pages/SignUp.tsx",
  "src/pages/CreateWorkspace.tsx",
  "src/pages/TrustPage.tsx",
  "src/pages/Integrations.tsx",
  "src/pages/Scouting.tsx",
  "src/pages/ScoutingTeamReport.tsx",
  "src/pages/Analytics.tsx",
  "src/pages/Draft.tsx",
  "src/pages/AcceptInvite.tsx",
  "src/pages/ForgotPassword.tsx",
  "src/pages/ResetPassword.tsx",
  "src/components/public/ProductProofFrame.tsx",
  "src/components/integrations/DiscordScheduleIntegration.tsx",
  "src/components/integrations/RiotApiIntegration.tsx",
  "src/components/analytics/TeamAnalyticsWorkspace.tsx",
  "src/components/scouting/OpponentSoloQDialog.tsx",
  "src/components/scouting/LeaguepediaDraftHistory.tsx",
].map(read).join("\n");

test("workspace shell validates tenant accent and exposes analyst-console tokens", () => {
  assert.match(shell, /\^#\[0-9a-f\]\{6\}\$/i);
  assert.match(shell, /--team-accent/);
  assert.match(shell, /memberships\.length > 1/);
  assert.match(shell, /bg-\[#111a23\]/);
  assert.match(shell, /z-\[60\]/);
  assert.match(shell, /text-\[#11e2d0\]/);
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

test("review workspace keeps game panels in one recoverable chunk and hides unfinished analytics", () => {
  assert.match(review, /import \{ GameOverviewTab \}/);
  assert.match(review, /import \{ DraftView \}/);
  assert.match(review, /import \{ CoachFeedback \}/);
  assert.doesNotMatch(review, /const GameOverviewTab = lazy/);
  assert.doesNotMatch(
    review,
    /ExternalDataAnalytics|DamageAnalysisChart|LiveGameChart|GameTimeline|MOCK_SCRIM_META/,
  );
});

test("settings links to the unified Game Capture workflow", () => {
  assert.match(settings, /DesktopAppStatus/);
  assert.match(settings, /Open Game Capture/);
  assert.doesNotMatch(settings, /DesktopCollectorIntegration/);
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

test("customer screens do not expose internal release or implementation language", () => {
  assert.doesNotMatch(
    customerCopy,
    /managed pilot|controlled beta|roadmap preview|forthcoming json|tenant-authorized|credential contract|import contract|release gate|before general availability/i,
  );
});
