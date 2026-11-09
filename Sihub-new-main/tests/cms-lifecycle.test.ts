import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import type { AddressInfo } from 'node:net';
import { Role } from '@prisma/client';
import { createCmsRouter } from '../server/routes/cms';
import { errorHandler } from '../server/utils';

const records = new Map<string, Record<string, unknown>>();
let nextId = 0;
const revisions = new Map<string, Record<string, unknown>>();
let nextRevisionId = 0;

const matches = (entry: Record<string, unknown>, where: Record<string, unknown> = {}) =>
  Object.entries(where).every(([key, value]) => entry[key] === value);

const database = {
  cmsEntry: {
    findMany: async ({ where }: { where?: Record<string, unknown> }) => [...records.values()].filter(entry => matches(entry, where)),
    findUnique: async ({ where }: { where: Record<string, unknown> }) => [...records.values()].find(entry => matches(entry, where)) ?? null,
    findFirst: async ({ where }: { where: Record<string, unknown> }) => [...records.values()].find(entry => matches(entry, where)) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const now = new Date();
      const entry = { id: `test-entry-${++nextId}`, ...data, deletedAt: null, createdAt: now, updatedAt: now, publishedAt: null };
      records.set(String(entry.id), entry);
      return entry;
    },
    update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const entry = [...records.values()].find(item => matches(item, where));
      if (!entry) throw new Error('Record not found');
      const updated: Record<string, unknown> = { ...entry, ...data, updatedAt: new Date() };
      records.set(String(updated.id), updated);
      return updated;
    }
  },
  cmsRevision: {
    count: async ({ where }: { where?: Record<string, unknown> }) => [...revisions.values()].filter(revision => matches(revision, where)).length,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const revision = { id: `test-revision-${++nextRevisionId}`, ...data, createdAt: new Date() };
      revisions.set(String(revision.id), revision);
      return revision;
    },
    findMany: async ({ where }: { where?: Record<string, unknown> }) => [...revisions.values()].filter(revision => matches(revision, where)).sort((left, right) => Number(right.revisionNumber) - Number(left.revisionNumber)),
    findFirst: async ({ where }: { where?: Record<string, unknown> }) => [...revisions.values()].find(revision => matches(revision, where)) ?? null
  },
  auditLog: { create: async () => ({}) }
};

const authenticateAdmin: RequestHandler = (req, _res, next) => {
  req.authUser = { id: 'test-admin', email: 'admin@example.test', fullName: 'Test Admin', role: Role.ADMIN, isActive: true };
  next();
};

const app = express();
app.use(express.json());
app.use('/api/cms', createCmsRouter(database as never, authenticateAdmin));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/cms`;

after(() => {
  server.closeAllConnections();
  server.close();
  records.clear();
});

test('CMS create, edit, publish, unpublish, soft-delete, and restore persist through APIs', async () => {
  const createdResponse = await fetch(`${baseUrl}/admin`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'page', slug: 'about', title: 'About title', summary: 'About summary', content: { heading: 'Original heading' } })
  });
  assert.equal(createdResponse.status, 201);
  const { entry: created } = await createdResponse.json() as { entry: { id: string; status: string } };
  assert.equal(created.status, 'DRAFT');

  const editResponse = await fetch(`${baseUrl}/admin/${created.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Updated About title', content: { heading: 'Updated heading' } })
  });
  assert.equal(editResponse.status, 200);
  const { entry: edited } = await editResponse.json() as { entry: { title: string; content: { heading: string }; status: string } };
  assert.equal(edited.title, 'Updated About title');
  assert.equal(edited.content.heading, 'Updated heading');
  assert.equal(edited.status, 'DRAFT');
  const revisionResponse = await fetch(`${baseUrl}/admin/${created.id}/revisions`);
  const { revisions: savedRevisions } = await revisionResponse.json() as { revisions: { id: string; title: string; content: { heading: string } }[] };
  assert.equal(savedRevisions.length, 1);
  assert.equal(savedRevisions[0].title, 'About title');
  assert.equal(savedRevisions[0].content.heading, 'Original heading');

  for (const status of ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED']) {
    const response = await fetch(`${baseUrl}/admin/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status })
    });
    assert.equal(response.status, 200, `expected transition to ${status}`);
  }

  const publicResponse = await fetch(`${baseUrl}/page/about`);
  assert.equal(publicResponse.status, 200);
  const { entry: published } = await publicResponse.json() as { entry: { title: string; content: { heading: string } } };
  assert.equal(published.title, 'Updated About title');
  assert.equal(published.content.heading, 'Updated heading');

  const unpublishResponse = await fetch(`${baseUrl}/admin/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'DRAFT' })
  });
  assert.equal(unpublishResponse.status, 200);
  assert.equal((await fetch(`${baseUrl}/page`)).status, 200);
  assert.deepEqual((await (await fetch(`${baseUrl}/page`)).json() as { entries: unknown[] }).entries, []);

  for (const status of ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED']) {
    const response = await fetch(`${baseUrl}/admin/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status })
    });
    assert.equal(response.status, 200);
  }

  const deleteResponse = await fetch(`${baseUrl}/admin/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 204);
  assert.deepEqual((await (await fetch(`${baseUrl}/page`)).json() as { entries: unknown[] }).entries, []);
  const adminList = await (await fetch(`${baseUrl}/admin`)).json() as { entries: { id: string; deletedAt: string | null }[] };
  assert.equal(adminList.entries[0].id, created.id);
  assert.ok(adminList.entries[0].deletedAt);

  const restoreResponse = await fetch(`${baseUrl}/admin/${created.id}/restore`, { method: 'POST' });
  assert.equal(restoreResponse.status, 200);
  const { entry: restored } = await restoreResponse.json() as { entry: { status: string; deletedAt: string | null } };
  assert.equal(restored.status, 'DRAFT');
  assert.equal(restored.deletedAt, null);
  assert.equal(records.size, 1);
  const finalRevision = await (await fetch(`${baseUrl}/admin/${created.id}/revisions`)).json() as { revisions: { id: string }[] };
  const restoreRevisionResponse = await fetch(`${baseUrl}/admin/${created.id}/revisions/${finalRevision.revisions[0].id}/restore`, { method: 'POST' });
  assert.equal(restoreRevisionResponse.status, 200);
  const { entry: revisionRestored } = await restoreRevisionResponse.json() as { entry: { title: string; status: string } };
  assert.equal(revisionRestored.title, 'Updated About title');
  assert.equal(revisionRestored.status, 'DRAFT');
  assert.ok(revisions.size >= 3);
  revisions.clear();
});

test('navigation API persists nested submenus and rejects unsafe destinations', async () => {
  const categories = [{
    key: 'programmes',
    label: 'Programmes',
    view: 'programs',
    url: '/programs',
    subItems: [{
      key: 'digital-skills',
      label: 'Digital Skills',
      view: 'programs',
      url: '/programs?track=digital-skills',
      subItems: [{ key: 'advanced', label: 'Advanced Track', view: 'courses', url: '/institute?level=advanced' }]
    }]
  }];
  const response = await fetch(`${baseUrl}/navigation`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ categories })
  });
  assert.equal(response.status, 200);
  const { entryId } = await response.json() as { entryId: string };
  const published = await (await fetch(`${baseUrl}/navigation`)).json() as { categories: { subItems: { subItems: { key: string }[] }[] }[] };
  assert.equal(published.categories[0].subItems[0].subItems[0].key, 'advanced');

  const unsafeResponse = await fetch(`${baseUrl}/navigation`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ categories: [{ ...categories[0], url: 'javascript:alert(1)' }] })
  });
  assert.equal(unsafeResponse.status, 400);
  records.delete(entryId);
});
