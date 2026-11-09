import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePasswordResetToken, isPasswordResetTokenUsable, matchesPasswordResetToken } from '../server/auth/passwordReset';

test('valid reset tokens are accepted', () => {
  const { rawToken, tokenHash } = generatePasswordResetToken();
  const record = { tokenHash, expiresAt: new Date(Date.now() + 60_000), usedAt: null };

  assert.equal(record.tokenHash.length > 0, true);
  assert.equal(rawToken.length > 0, true);
  assert.equal(isPasswordResetTokenUsable(record), true);
});

test('expired reset tokens are rejected', () => {
  const { tokenHash } = generatePasswordResetToken();
  const record = { tokenHash, expiresAt: new Date(Date.now() - 60_000), usedAt: null };

  assert.equal(isPasswordResetTokenUsable(record), false);
});

test('reused reset tokens are rejected', () => {
  const { tokenHash } = generatePasswordResetToken();
  const record = { tokenHash, expiresAt: new Date(Date.now() + 60_000), usedAt: new Date() };

  assert.equal(isPasswordResetTokenUsable(record), false);
});

test('invalid reset tokens do not match the stored hash', () => {
  const { rawToken, tokenHash } = generatePasswordResetToken();
  const record = { tokenHash: `${tokenHash}X`, expiresAt: new Date(Date.now() + 60_000), usedAt: null };

  assert.equal(matchesPasswordResetToken(rawToken, record), false);
  assert.notEqual(record.tokenHash, tokenHash);
  assert.equal(isPasswordResetTokenUsable(record), true);
});
