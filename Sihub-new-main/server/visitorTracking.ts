import { timingSafeEqual } from 'node:crypto';

export const canTransitionSubmission = (currentStatus: string, nextStatus: string, type: string) => {
  if (currentStatus === 'PENDING') return nextStatus === 'APPROVED' || nextStatus === 'REJECTED';
  return ['visitor-request', 'event-registration'].includes(type) && currentStatus === 'APPROVED' && nextStatus === 'COMPLETED';
};

export const matchesVisitorPassCode = (providedCode: string, storedCode: string) => {
  const provided = Buffer.from(providedCode);
  const stored = Buffer.from(storedCode);
  return provided.length === stored.length && timingSafeEqual(provided, stored);
};

export const publicVisitorPassInfo = (submission: { referenceCode: string; payload: unknown }) => {
  const payload = submission.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};
  const pass = payload.visitorPass && typeof payload.visitorPass === 'object' && !Array.isArray(payload.visitorPass)
    ? payload.visitorPass as Record<string, unknown>
    : null;
  if (!pass || typeof pass.passNumber !== 'string') return null;

  return {
    referenceCode: submission.referenceCode,
    passNumber: pass.passNumber,
    fullName: typeof payload.fullName === 'string' ? payload.fullName : '',
    organization: typeof payload.organization === 'string' ? payload.organization : '',
    hubLocation: typeof payload.hubLocation === 'string' ? payload.hubLocation : '',
    requestedDate: typeof payload.requestedDate === 'string' ? payload.requestedDate : '',
    timeSlot: typeof payload.timeSlot === 'string' ? payload.timeSlot : '',
    assignedHost: typeof pass.assignedHost === 'string' ? pass.assignedHost : '',
    issuedAt: typeof pass.issuedAt === 'string' ? pass.issuedAt : ''
  };
};

export const publicVisitorTrackingInfo = (submission: {
  referenceCode: string;
  status: string;
  createdAt: Date;
  payload: unknown;
}) => {
  const payload = submission.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};
  const pass = payload.visitorPass && typeof payload.visitorPass === 'object' && !Array.isArray(payload.visitorPass)
    ? payload.visitorPass as Record<string, unknown>
    : null;

  return {
    referenceCode: submission.referenceCode,
    status: submission.status,
    createdAt: submission.createdAt,
    payload: {
      fullName: payload.fullName,
      organization: payload.organization,
      hubLocation: payload.hubLocation,
      requestedDate: payload.requestedDate,
      timeSlot: payload.timeSlot,
      assignedHost: payload.assignedHost,
      visitorPass: pass ? {
        passNumber: pass.passNumber,
        assignedHost: pass.assignedHost,
        securityClearanceCode: pass.securityClearanceCode,
        issuedAt: pass.issuedAt
      } : null
    }
  };
};