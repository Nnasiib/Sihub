import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const envExample = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const prismaSchema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
const migrationLock = readFileSync(new URL('../prisma/migrations/migration_lock.toml', import.meta.url), 'utf8');

test('database template defines one safe URL for each Prisma datasource setting', () => {
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const declarations = envExample.split(/\r?\n/).filter(line => line.startsWith(`${key}=`));
    assert.equal(declarations.length, 1, `${key} must be declared exactly once`);

    const value = declarations[0].slice(key.length + 1).replace(/^"|"$/g, '');
    const url = new URL(value);
    assert.equal(url.protocol, 'postgresql:');
    assert.equal(url.hostname, 'localhost');
    assert.equal(url.username, 'sihub');
    assert.equal(url.password, 'replace-me');
  }

  assert.match(prismaSchema, /url\s*=\s*env\("DATABASE_URL"\)/);
  assert.match(prismaSchema, /directUrl\s*=\s*env\("DIRECT_URL"\)/);
});

test('every checked-in Prisma migration directory contains a non-empty SQL migration', () => {
  const migrationRoot = new URL('../prisma/migrations/', import.meta.url);
  const expectedMigrations = [
    '20261104000000_initial',
    '20261104010000_password_reset_tokens',
    '20261104020000_schema_alignment',
    '20261107120000_education_records',
    '20261107150000_community_reactions',
    '20261107160000_media_asset_metadata'
  ];
  const actualMigrations = readdirSync(migrationRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  assert.deepEqual(actualMigrations, expectedMigrations);
  for (const migration of expectedMigrations) {
    const migrationFile = new URL(`${migration}/migration.sql`, migrationRoot);
    assert.ok(existsSync(migrationFile), `${migration} must contain migration.sql`);
    assert.ok(readFileSync(migrationFile, 'utf8').trim().length > 0, `${migration} SQL must not be empty`);
  }
  assert.match(migrationLock, /^provider\s*=\s*"postgresql"\s*$/m);
});