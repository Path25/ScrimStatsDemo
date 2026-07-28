import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const customerRoots = ["src", "public", "supabase/templates"];
const customerFiles = ["index.html", "supabase/functions/_shared/email.ts"];
const textExtensions = new Set([".css", ".html", ".json", ".svg", ".ts", ".tsx", ".txt"]);

function collect(directory) {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return collect(file);
    return textExtensions.has(file.slice(file.lastIndexOf(".")).toLowerCase()) ? [file] : [];
  });
}

// These sequences are not valid customer copy; they are the common UTF-8 bytes
// decoded as Windows-1252/Latin-1, plus a replacement character from bad input.
const mojibake = /\u00c2(?:[\u00a0-\u00bf]|\u00c2)|\u00c3[\u0080-\u00bf]|\u00e2[\u0080-\u00bf]{1,2}|\u00f0[\u0080-\u00bf]{1,3}|\ufffd/u;

test("all customer-facing text surfaces are valid UTF-8 copy", () => {
  const files = [...customerRoots.flatMap(collect), ...customerFiles];
  assert.ok(files.length > 20, "expected a broad customer-surface scan");

  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    assert.doesNotMatch(source, mojibake, `${relative(root, join(root, file))} contains encoding corruption`);
  }
});
