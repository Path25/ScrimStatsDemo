import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const workspace = read("src/pages/CollectorWorkspace.tsx");
const navigation = read("src/components/layout/DashboardLayout.tsx");
const integrations = read("src/pages/Integrations.tsx");
const settings = read("src/pages/Settings.tsx");

test("Game Capture is one visible product workflow rather than a native-only collector route", () => {
  assert.match(navigation, /title: "Game Capture", href: "\/collector"/);
  assert.doesNotMatch(navigation, /title: "Game Capture"[^\n]+nativeOnly/);
  assert.match(workspace, /title="Game Capture"/);
  assert.match(workspace, /Connect this computer/);
  assert.match(workspace, /Capture this block/);
  assert.doesNotMatch(workspace, /Arm recording|Native workspace|secured Windows process|native collector bridge/);
});

test("manager pairing is created and consumed on the Game Capture page", () => {
  assert.match(workspace, /supabase\.functions\.invoke\("collector-pairing"/);
  assert.match(workspace, /await pairWithCode\(data\.pairing_code\)/);
  assert.match(workspace, /Ask a team manager for a connection code/);
});

test("duplicate setup surfaces now direct users back to Game Capture", () => {
  assert.match(integrations, /Open Game Capture/);
  assert.match(settings, /Open Game Capture/);
  assert.doesNotMatch(integrations, /DesktopCollectorIntegration/);
  assert.doesNotMatch(settings, /DesktopCollectorIntegration/);
});

test("end-user guidance explains capture and privacy without API terminology", () => {
  const guide = read("src/components/capture/HowCaptureWorks.tsx");
  assert.match(guide, /Choose your block/);
  assert.match(guide, /Play normally/);
  assert.match(guide, /Leave both apps open/);
  assert.match(guide, /does not record your[\s\S]+screen, microphone, or other applications/);
  assert.doesNotMatch(guide, /API|telemetry|loopback|process/);
});

test("the unsigned beta download is explicit and independently verifiable", () => {
  assert.match(workspace, /Download unsigned beta/);
  assert.match(workspace, /Unsigned testing release/);
  assert.match(workspace, /Unknown publisher warning/);
  assert.match(workspace, /B1FAE384703C4B3903273A0FB9069B8526BBED71477F4FA6816511A234C211B4/);
  assert.match(workspace, /game-capture-v0\.6\.0-beta/);
});
