import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidPairingCode, normalizePairingCode } from '../src/pairing-code';

test('accepts generated base64url pairing codes containing underscores', () => {
  const code = 'abc_DEF-0123456789abc_DEF-0123456789abc_DEF';

  assert.equal(isValidPairingCode(code), true);
});

test('normalizes whitespace introduced when copying a pairing code', () => {
  const code = '  abc_DEF-0123456789abc_DEF-0123456789abc_DEF\r\n';

  assert.equal(normalizePairingCode(code), 'abc_DEF-0123456789abc_DEF-0123456789abc_DEF');
  assert.equal(isValidPairingCode(normalizePairingCode(code)), true);
});
