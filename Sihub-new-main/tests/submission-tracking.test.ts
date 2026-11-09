import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSubmissionTrackingInfo, submissionMatchesEmail } from '../server/submissionTracking.ts';

test('submission status lookup accepts the email field used by each public workflow', () => {
  assert.equal(submissionMatchesEmail({ email: 'Applicant@Example.test' }, 'applicant@example.test'), true);
  assert.equal(submissionMatchesEmail({ contactEmail: 'partner@example.test' }, 'partner@example.test'), true);
  assert.equal(submissionMatchesEmail({ founderEmail: 'founder@example.test' }, 'founder@example.test'), true);
  assert.equal(submissionMatchesEmail({ email: 'other@example.test' }, 'applicant@example.test'), false);
});

test('public submission tracking exposes status metadata without the submitted payload', () => {
  const tracked = publicSubmissionTrackingInfo({
    referenceCode: 'SIHUB-2026-1234',
    type: 'startup-pitch',
    status: 'PENDING',
    createdAt: new Date('2026-11-07T10:00:00Z')
  });

  assert.deepEqual(Object.keys(tracked).sort(), ['createdAt', 'referenceCode', 'status', 'type']);
});
