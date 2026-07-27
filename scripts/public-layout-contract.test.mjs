import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicSources = [
  "src/pages/Landing.tsx",
  "src/pages/SignUp.tsx",
  "src/pages/CreateWorkspace.tsx",
  "src/pages/SignIn.tsx",
  "src/components/public/CapabilityRail.tsx",
  "src/components/public/PerformanceWorkflow.tsx",
  "src/components/public/ProductProofFrame.tsx",
  "src/components/public/PublicBodyCopy.tsx",
  "src/components/public/PublicSection.tsx",
  "src/components/public/PublicHeader.tsx",
  "src/components/public/PublicFooter.tsx",
  "src/components/public/PublicCta.tsx",
  "src/components/public/SectionLabel.tsx",
];

const load = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const sources = await Promise.all(publicSources.map(async (path) => [path, await load(path)]));
const css = await load("src/index.css");

function luminance(hex) {
  const values = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("public routes use readable typography and clean UTF-8 source", () => {
  for (const [path, source] of sources) {
    assert.doesNotMatch(source, /\u00c2|\ufffd|\u00e2[\u0080-\u20ac]/u, `${path} contains mojibake`);
  }

  for (const [path, source] of sources.filter(([path]) => path.startsWith("src/pages/"))) {
    assert.doesNotMatch(source, /text-xs/, `${path} uses 12px route copy`);
    assert.doesNotMatch(source, /text-\[(?:8|9|10|11|12)px\]/, `${path} contains undersized copy`);
    assert.doesNotMatch(source, /leading-\[0\.(?:7|8)\d*\]/, `${path} uses compressed line height`);
  }
});

test("semantic public content is not positioned behind decorative assets", () => {
  for (const [path, source] of sources) {
    assert.doesNotMatch(source, /absolute\s+-left-/, `${path} positions content outside its container`);
    assert.doesNotMatch(source, /absolute\s+-right-/, `${path} positions content outside its container`);
  }
});

test("landing leads with team performance and keeps consolidation as supporting proof", () => {
  const landing = sources.find(([path]) => path.endsWith("Landing.tsx"))?.[1] ?? "";
  assert.match(landing, /Everything your team needs/);
  assert.match(landing, /to compete at its best\./);
  assert.match(landing, /ProductProofFrame/);
  assert.match(landing, /workspace-preview-blurred\.webp/);
  assert.match(landing, /sheets,\s*Discord,\s*screenshots/);
  assert.doesNotMatch(landing, /CommandCentreStage|CapabilityModule|LiveWorkspaceStage/);
  assert.doesNotMatch(landing, /competitive operation|operational layers|Data integrity/i);
  assert.doesNotMatch(landing, /testimonial|pricing|LCS|win rate|Active Teams/i);
});

test("product proof supports a truthful placeholder and later responsive captures", () => {
  const proof = sources.find(([path]) => path.endsWith("ProductProofFrame.tsx"))?.[1] ?? "";
  assert.match(proof, /desktopSrc/);
  assert.match(proof, /mobileSrc/);
  assert.match(proof, /Private by design/);
  assert.match(proof, /team data is never displayed publicly/);
  assert.match(proof, /public-proof-veil/);
  assert.match(proof, /public-proof-scan/);
  assert.doesNotMatch(proof, /win rate|active players|games played|live workspace capture slot/i);
});

test("workflow combines practice lifecycle and source provenance", () => {
  const workflow = sources.find(([path]) => path.endsWith("PerformanceWorkflow.tsx"))?.[1] ?? "";
  assert.match(workflow, /Prepare/);
  assert.match(workflow, /Capture/);
  assert.match(workflow, /Review/);
  assert.match(workflow, /Automatically captured/);
  assert.match(workflow, /Manual/);
  assert.match(workflow, /Awaiting/);
  assert.match(workflow, /Unavailable/);
});

test("public palette provides enhanced body contrast and controlled spacing", () => {
  assert.match(css, /--public-bg:\s*#070b0f/);
  assert.match(css, /--public-muted:\s*#bac5cc/);
  assert.ok(contrast("#bac5cc", "#070b0f") >= 7, "public body contrast is below 7:1");
  assert.match(css, /\.public-section\s*\{[\s\S]*padding-block:\s*3rem/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*padding-block:\s*4\.5rem/);
  assert.match(css, /\.public-body-copy\s*\{[\s\S]*font-size:\s*1rem/);
});

test("font loading is local to the application bundle", async () => {
  const main = await load("src/main.tsx");
  const html = await load("index.html");
  assert.match(main, /@fontsource-variable\/instrument-sans/);
  assert.match(main, /@fontsource\/ibm-plex-mono\/latin-500\.css/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});

test("social previews use the dedicated ScrimStats launch card", async () => {
  const html = await load("index.html");
  const image = await readFile(new URL("../public/og.png", import.meta.url));

  assert.match(html, /property="og:image" content="https:\/\/scrimstats\.gg\/og\.png"/);
  assert.match(html, /name="twitter:image" content="https:\/\/scrimstats\.gg\/og\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.doesNotMatch(html, /rift_underlay\.png/);
  assert.equal(image.readUInt32BE(16), 1200, "social card width must be 1200px");
  assert.equal(image.readUInt32BE(20), 630, "social card height must be 630px");
});
