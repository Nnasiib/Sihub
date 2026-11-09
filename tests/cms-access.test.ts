import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { AddressInfo } from 'node:net';
import type { Request, Response } from 'express';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-only-session-secret-that-is-never-used-outside-tests';
process.env.DATABASE_URL = 'postgresql://test:replace-me@localhost:5432/test?schema=public';
process.env.DIRECT_URL = process.env.DATABASE_URL;

const [{ default: authRoutes }, { default: cmsRoutes }, { default: mediaRoutes }, security, utils, prismaClient] = await Promise.all([
  import('../server/routes/auth'),
  import('../server/routes/cms'),
  import('../server/routes/media'),
  import('../server/security'),
  import('../server/utils'),
  import('@prisma/client')
]);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api', security.requireCsrf);
app.use('/api/cms', cmsRoutes);
app.use('/api/media', mediaRoutes);
app.use(utils.errorHandler);

const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}`;

after(() => {
  server.closeAllConnections();
  server.close();
});

const getCsrf = async () => {
  const response = await fetch(`${baseUrl}/api/auth/csrf`);
  const result = await response.json() as { csrfToken: string };
  return result.csrfToken;
};

test('unauthenticated CMS create and media delete requests are rejected before persistence', async () => {
  const csrfToken = await getCsrf();
  const headers = { 'content-type': 'application/json', 'x-csrf-token': csrfToken, cookie: `sihub_csrf=${csrfToken}` };

  const createResponse = await fetch(`${baseUrl}/api/cms/admin`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'page', slug: 'about', title: 'About', content: {} })
  });
  const deleteResponse = await fetch(`${baseUrl}/api/media/test-asset`, { method: 'DELETE', headers });
  const restoreResponse = await fetch(`${baseUrl}/api/cms/admin/test-entry/restore`, { method: 'POST', headers });
  const imageLibraryResponse = await fetch(`${baseUrl}/api/media/admin`);

  assert.equal(createResponse.status, 401);
  assert.equal(deleteResponse.status, 401);
  assert.equal(restoreResponse.status, 401);
  assert.equal(imageLibraryResponse.status, 401);
});

test('CMS staff role gate allows ADMIN and blocks STUDENT', () => {
  const guard = security.requireRole(prismaClient.Role.OWNER, prismaClient.Role.SUPER_ADMIN, prismaClient.Role.ADMIN);
  const invoke = (role: typeof prismaClient.Role[keyof typeof prismaClient.Role]) => new Promise<unknown>(resolve => {
    guard({ authUser: { role } } as Request, {} as Response, resolve);
  });

  return Promise.all([invoke(prismaClient.Role.ADMIN), invoke(prismaClient.Role.STUDENT)]).then(([adminError, studentError]) => {
    assert.equal(adminError, undefined);
    assert.equal((studentError as { status?: number }).status, 403);
  });
});
