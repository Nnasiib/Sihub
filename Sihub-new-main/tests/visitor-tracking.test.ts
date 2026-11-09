import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionSubmission, matchesVisitorPassCode, publicVisitorPassInfo, publicVisitorTrackingInfo } from '../server/visitorTracking.ts';

test('visitor requests can be checked in only after approval', () => {
  assert.equal(canTransitionSubmission('PENDING', 'APPROVED', 'visitor-request'), true);
  assert.equal(canTransitionSubmission('PENDING', 'REJECTED', 'visitor-request'), true);
  assert.equal(canTransitionSubmission('PENDING', 'COMPLETED', 'visitor-request'), false);
  assert.equal(canTransitionSubmission('PENDING', 'COMPLETED', 'event-registration'), false);
  assert.equal(canTransitionSubmission('APPROVED', 'COMPLETED', 'visitor-request'), true);
  assert.equal(canTransitionSubmission('APPROVED', 'COMPLETED', 'event-registration'), true);
  assert.equal(canTransitionSubmission('APPROVED', 'REJECTED', 'visitor-request'), false);
  assert.equal(canTransitionSubmission('COMPLETED', 'APPROVED', 'visitor-request'), false);
  assert.equal(canTransitionSubmission('APPROVED', 'COMPLETED', 'program-application'), false);
});

test('public visitor tracking returns only the fields needed to identify the pass', () => {
  const request = publicVisitorTrackingInfo({
    referenceCode: 'VIST-2026-1234',
    status: 'APPROVED',
    createdAt: new Date('2026-11-07T10:00:00Z'),
    payload: {
      fullName: 'Test Visitor',
      email: 'private@example.test',
      phone: '+252000000',
      organization: 'Test Organization',
      hubLocation: 'Mogadishu HQ',
      requestedDate: '2026-11-08',
      timeSlot: 'Morning',
      customDetails: 'Private request details',
      adminNotes: 'Internal notes',
      visitorPass: { passNumber: 'PASS-1', securityClearanceCode: 'CLEAR-1', issuedAt: '2026-11-07T10:00:00Z', internal: 'private' }
    }
  });

  assert.deepEqual(Object.keys(request.payload).sort(), ['assignedHost', 'fullName', 'hubLocation', 'organization', 'requestedDate', 'timeSlot', 'visitorPass'].sort());
  assert.deepEqual(Object.keys(request.payload.visitorPass!).sort(), ['assignedHost', 'passNumber', 'securityClearanceCode', 'issuedAt'].sort());
  assert.equal('email' in request.payload, false);
  assert.equal('customDetails' in request.payload, false);
  assert.equal('adminNotes' in request.payload, false);
});

test('visitor pass verification compares codes and returns only public pass details', () => {
  const submission = {
    referenceCode: 'VIST-2026-1234567890ABCDEF',
    payload: {
      fullName: 'Test Visitor',
      email: 'private@example.test',
      organization: 'Test Organization',
      hubLocation: 'Mogadishu HQ',
      requestedDate: '2026-11-08',
      timeSlot: 'Morning',
      visitorPass: {
        passNumber: 'PASS-VIST-2026-1234567890ABCDEF',
        securityClearanceCode: 'CLEAR-1234567890',
        assignedHost: 'SiHub Desk',
        issuedAt: '2026-11-07T10:00:00Z'
      }
    }
  };

  assert.equal(matchesVisitorPassCode('CLEAR-1234567890', 'CLEAR-1234567890'), true);
  assert.equal(matchesVisitorPassCode('CLEAR-1234567891', 'CLEAR-1234567890'), false);
  assert.deepEqual(publicVisitorPassInfo(submission), {
    referenceCode: 'VIST-2026-1234567890ABCDEF',
    passNumber: 'PASS-VIST-2026-1234567890ABCDEF',
    fullName: 'Test Visitor',
    organization: 'Test Organization',
    hubLocation: 'Mogadishu HQ',
    requestedDate: '2026-11-08',
    timeSlot: 'Morning',
    assignedHost: 'SiHub Desk',
    issuedAt: '2026-11-07T10:00:00Z'
  });
  assert.equal('email' in (publicVisitorPassInfo(submission) ?? {}), false);
  assert.equal('securityClearanceCode' in (publicVisitorPassInfo(submission) ?? {}), false);
});