import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const sourceRoot = join(root, "src");
const extensions = [".ts", ".tsx", ".js", ".jsx", ".css"];
const allFiles = [];
function walk(directory) { for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) walk(path); else if (extensions.includes(extname(path))) allFiles.push(normalize(path)); } }
walk(sourceRoot);

function resolveImport(from, specifier) {
  if (!(specifier.startsWith("@/") || specifier.startsWith("."))) return null;
  const base = specifier.startsWith("@/") ? join(sourceRoot, specifier.slice(2)) : resolve(dirname(from), specifier);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => join(base, `index${extension}`))];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) || null;
}

const reachable = new Set(); const pending = [join(sourceRoot, "main.tsx")];
for (const script of readdirSync(join(root, "scripts")).filter((name) => /\.test\.(?:mjs|ts)$/.test(name))) {
  const source = readFileSync(join(root, "scripts", script), "utf8");
  for (const match of source.matchAll(/["']((?:\.\.\/)?src\/[^"']+)["']/g)) {
    const referenced = match[1].startsWith("../") ? resolve(join(root, "scripts"), match[1]) : resolve(root, match[1]);
    if (existsSync(referenced) && statSync(referenced).isFile()) pending.push(referenced);
  }
}
const importPattern = /(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g;
while (pending.length) {
  const file = normalize(pending.pop()); if (reachable.has(file) || !existsSync(file)) continue; reachable.add(file);
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) { const dependency = resolveImport(file, match[1]); if (dependency && !reachable.has(normalize(dependency))) pending.push(dependency); }
}
const keep = new Set([normalize(join(sourceRoot, "vite-env.d.ts"))]);
const unreachable = allFiles.filter((file) => !reachable.has(file) && !keep.has(file)).map((file) => relative(root, file).replaceAll("\\", "/")).sort();
console.log(JSON.stringify({ sourceFiles: allFiles.length, reachable: reachable.size, unreachable: unreachable.length, files: unreachable }, null, 2));
