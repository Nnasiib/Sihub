import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSubmissionContent } from '../server/submissionPublishing.ts';

test('approved community submissions publish only public discussion fields', () => {
  const content = publicSubmissionContent('community-topic', {
    title: 'Water sensors', content: 'Discussion text', author: 'A. Founder', category: 'AgriTech', email: 'private@example.test'
  }, 'SIHUB-2026-1234');

  assert.deepEqual(content, { title: 'Water sensors', content: 'Discussion text', author: 'A. Founder', category: 'AgriTech' });
  assert.equal('email' in content, false);
});

test('approved startup pitches exclude private contact details and deck references from public CMS', () => {
  const content = publicSubmissionContent('startup-pitch', {
    name: 'Solar Works', tagline: 'Reliable energy', founderName: 'A. Founder', founderEmail: 'private@example.test', founderPhone: '+252000000',
    teamSize: 3, problemStatement: 'Power access', solution: 'Solar kits', pitchDeckAssetId: 'private-asset', location: 'Mogadishu'
  }, 'SIHUB-2026-1234');

  assert.equal(content.id, 'SIHUB-2026-1234');
  assert.equal(content.name, 'Solar Works');
  assert.equal('founderEmail' in content, false);
  assert.equal('founderPhone' in content, false);
  assert.equal('pitchDeckAssetId' in content, false);
});
