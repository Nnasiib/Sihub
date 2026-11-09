import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPasswordHash } from '../server/auth/password';

test('Argon2id password hashes verify successfully', async () => {
  const password = 'a-long-test-password-only';
  const passwordHash = await hashPassword(password);

  assert.match(passwordHash, /^\$argon2id\$/);
  assert.equal(await verifyPasswordHash(passwordHash, password), true);
  assert.equal(await verifyPasswordHash(passwordHash, 'a-different-test-password'), false);
});

test('invalid stored password hashes fail verification without throwing', async () => {
  assert.equal(await verifyPasswordHash('not-a-password-hash', 'test-password'), false);
  assert.equal(await verifyPasswordHash('$argon2id$invalid', 'test-password'), false);
  assert.equal(await verifyPasswordHash(null, 'test-password'), false);
});