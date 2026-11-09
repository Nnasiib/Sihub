import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-only-session-secret-that-is-never-used-outside-tests';
process.env.DATABASE_URL = 'postgresql://test:replace-me@localhost:5432/test?schema=public';
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.S3_ENDPOINT = 'https://storage.example.test';

const { app } = await import('../server/app');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

after(() => {
  server.closeAllConnections();
  server.close();
});

test('security policy permits configured fonts and S3 traffic without allowing arbitrary origins', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const policy = response.headers.get('content-security-policy') ?? '';

  assert.equal(response.status, 200);
  assert.match(policy, /style-src[^;]*https:\/\/fonts\.googleapis\.com/);
  assert.match(policy, /font-src[^;]*https:\/\/fonts\.gstatic\.com/);
  assert.match(policy, /connect-src[^;]*https:\/\/\*\.amazonaws\.com/);
  assert.match(policy, /connect-src[^;]*https:\/\/storage\.example\.test/);
  assert.match(policy, /script-src 'self'/);
  assert.doesNotMatch(policy, /connect-src[^;]*https:;/);
});