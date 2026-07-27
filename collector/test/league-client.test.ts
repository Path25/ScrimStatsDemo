import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLeagueLockfile } from '../src/league-client';

test('League lockfile parser accepts the local client credential format', () => {
  assert.deepEqual(parseLeagueLockfile('LeagueClient:1234:54321:secret:https'), {
    port: 54321, password: 'secret', protocol: 'https',
  });
});

test('League lockfile parser rejects invalid or non-loopback metadata', () => {
  assert.equal(parseLeagueLockfile('not-a-lockfile'), undefined);
  assert.equal(parseLeagueLockfile('LeagueClient:1234:70000:secret:https'), undefined);
  assert.equal(parseLeagueLockfile('LeagueClient:1234:54321:secret:ftp'), undefined);
});
