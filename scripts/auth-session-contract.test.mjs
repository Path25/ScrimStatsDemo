import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("auth initialization has one session source and cannot overwrite a fresh login", () => {
  const auth = read("src/contexts/AuthContext.tsx");

  assert.match(auth, /onAuthStateChange/);
  assert.doesNotMatch(auth, /auth\.getSession\(\)/);
  assert.doesNotMatch(auth, /setTimeout/);
  assert.match(auth, /setSession\(data\.session\)/);
  assert.match(auth, /setUser\(data\.user\)/);
});

test("sign-in redirects only after the authenticated user reaches context", () => {
  const signIn = read("src/pages/SignIn.tsx");

  assert.match(signIn, /redirectAfterSignIn/);
  assert.match(signIn, /if \(!redirectAfterSignIn \|\| !user\) return/);
  assert.match(signIn, /setRedirectAfterSignIn\(true\)/);
});
