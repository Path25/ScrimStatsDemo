import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Scouting retains a default lazy-route export", () => {
  const scouting = read("src/pages/Scouting.tsx");
  const app = read("src/App.tsx");
  assert.match(scouting, /export default function Scouting\(\)/);
  assert.match(app, /const Scouting = lazy\(\(\) => import\("@\/pages\/Scouting"\)\)/);
  assert.match(app, /path="\/scouting" element={<PlanGate minimum="pro" feature="opponent scouting"><Scouting \/><\/PlanGate>}/);
});

test("client-error reporting has a bounded release and no free-form context", () => {
  const reporting = read("src/lib/error-reporting.ts");
  const boundary = read("src/components/error/ErrorBoundary.tsx");
  const api = read("api/client-error.ts");
  const vite = read("vite.config.ts");
  assert.match(vite, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(vite, /VERCEL_DEPLOYMENT_ID/);
  assert.match(vite, /"unattributed-production"/);
  assert.match(reporting, /release: __SCRIMSTATS_RELEASE__/);
  assert.doesNotMatch(reporting, /context:/);
  assert.match(boundary, /reportClientError\(error\)/);
  assert.doesNotMatch(boundary, /componentStack/);
  assert.doesNotMatch(api, /context:/);
  assert.doesNotMatch(api, /\.\.\.body/);
});
