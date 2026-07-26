import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const directory = new URL("../dist/assets/", import.meta.url);
const limits = { entry: 260 * 1024, route: 180 * 1024, vendor: 330 * 1024, chart: 450 * 1024 };
const failures = [];
for (const name of readdirSync(directory)) {
  if (!name.endsWith(".js")) continue;
  const bytes = statSync(join(directory.pathname.replace(/^\/([A-Z]:)/, "$1"), name)).size;
  const limit = name.startsWith("index-") ? limits.entry : name.includes("vendor-charts") || name.includes("LineChart") ? limits.chart : name.startsWith("vendor-") ? limits.vendor : limits.route;
  if (bytes > limit) failures.push(`${name}: ${(bytes / 1024).toFixed(1)} KiB exceeds ${(limit / 1024).toFixed(0)} KiB`);
}
if (failures.length) { console.error(`Bundle budget failed:\n${failures.join("\n")}`); process.exit(1); }
console.log("Bundle budgets passed.");
