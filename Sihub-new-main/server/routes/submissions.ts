import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { Prisma, PublicationStatus, Role, SubmissionStatus } from '@prisma/client';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db';
import { requireAuth, requireRole, SESSION_COOKIE, hashToken } from '../security';
import { asyncRoute, httpError } from '../utils';
import { canTransitionSubmission, matchesVisitorPassCode, publicVisitorPassInfo, publicVisitorTrackingInfo } from '../visitorTracking';
import { publicSubmissionContent } from '../submissionPublishing';
import { publicSubmissionTrackingInfo, submissionMatchesEmail } from '../submissionTracking';

const router = Router();
const visitorRouter = Router();
const reviewRoles = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as Role[];
const supportedTypes = new Set(['program-application', 'opportunity-application', 'event-registration', 'startup-pitch', 'partner-inquiry', 'mentorship-request', 'community-topic', 'visitor-request', 'contact-message']);
const submissionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const visitorTrackingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const submissionTrackingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const requiredByType: Record<string, string[]> = {
    'program-application': ['programId', 'fullName', 'email', 'proposalBrief'],
    'opportunity-application': ['opportunityId', 'fullName', 'email', 'proposal'],
    'event-registration': ['eventId', 'eventTitle', 'fullName', 'email'],
    'startup-pitch': ['name', 'founderName', 'founderEmail', 'problemStatement', 'solution'],
    'partner-inquiry': ['organizationName', 'contactPerson', 'contactEmail', 'proposalDetails'],
    'mentorship-request': ['mentorId', 'menteeName', 'email', 'topic'],
    'community-topic': ['title', 'content', 'author'],
    'visitor-request': ['fullName', 'email', 'requestedDate', 'hubLocation'],
    'contact-message': ['name', 'email', 'message']
};
const payloadSchema = (type: string) => z.record(z.string().trim().min(1).max(100), z.unknown()).superRefine((payload, context) => {
  for (const key of requiredByType[type] ?? []) {
    const value = payload[key];
    if (typeof value !== 'string' || value.trim().length === 0) context.addIssue({ code: 'custom', message: `${key} is required`, path: [key] });
  }
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      if (value.length > 20000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) context.addIssue({ code: 'custom', message: `${key} contains invalid text`, path: [key] });
      if (key.toLowerCase().includes('email') && !z.string().email().safeParse(value.trim()).success) context.addIssue({ code: 'custom', message: `${key} must be a valid email`, path: [key] });
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) context.addIssue({ code: 'custom', message: `${key} must be finite`, path: [key] });
    } else if (typeof value === 'boolean' || value === null) {
      continue;
    } else if (Array.isArray(value)) {
      if (value.length > 100 || value.some(item => typeof item !== 'string' || item.length > 1000)) context.addIssue({ code: 'custom', message: `${key} must be a short list of text values`, path: [key] });
    } else {
      context.addIssue({ code: 'custom', message: `${key} must be a scalar value or text list`, path: [key] });
    }
  }
});
const referencedContent: Record<string, { type: string; idKey: string; titleKey: string }> = {
  'program-application': { type: 'program', idKey: 'programId', titleKey: 'programTitle' },
  'opportunity-application': { type: 'opportunity', idKey: 'opportunityId', titleKey: 'opportunityTitle' },
  'event-registration': { type: 'event', idKey: 'eventId', titleKey: 'eventTitle' },
  'mentorship-request': { type: 'mentor', idKey: 'mentorId', titleKey: 'mentorName' }
};

router.get('/mine', requireAuth, asyncRoute(async (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  if (type && !supportedTypes.has(type)) throw httpError(400, 'Unsupported submission filter');
  const submissions = await prisma.submission.findMany({ where: { submitterId: req.authUser!.id, ...(type ? { type } : {}) }, orderBy: { createdAt: 'desc' } });
  res.json({ submissions });
}));

router.get('/mentor/requests', requireAuth, requireRole(Role.MENTOR), asyncRoute(async (req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { type: 'mentorship-request', payload: { path: ['mentorUserId'], equals: req.authUser!.id } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ submissions });
}));

router.patch('/mentor/requests/:id', requireAuth, requireRole(Role.MENTOR), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), meetingLink: z.string().url().refine(value => new URL(value).protocol === 'https:').optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid mentorship response');
  const existing = await prisma.submission.findFirst({ where: { id: req.params.id, type: 'mentorship-request', status: SubmissionStatus.PENDING, payload: { path: ['mentorUserId'], equals: req.authUser!.id } } });
  if (!existing) throw httpError(404, 'Mentorship request not found');
  const previous = existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload) ? existing.payload as Prisma.InputJsonObject : {};
  const updated = await prisma.submission.update({ where: { id: existing.id }, data: { status: input.data.decision, reviewerId: req.authUser!.id, reviewedAt: new Date(), payload: { ...previous, ...(input.data.meetingLink ? { meetingLink: input.data.meetingLink } : {}) } } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `MENTORSHIP_${input.data.decision}`, entity: 'Submission', entityId: updated.id, metadata: { referenceCode: updated.referenceCode } } });
  res.json({ submission: updated });
}));

visitorRouter.get('/track/:code', visitorTrackingLimiter, asyncRoute(async (req, res) => {
  const email = z.string().trim().email().max(254).safeParse(req.query.email);
  if (!email.success) throw httpError(404, 'Visit request not found');
  const submission = await prisma.submission.findFirst({ where: { type: 'visitor-request', referenceCode: req.params.code } });
  const payload = submission?.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};
  if (!submission || typeof payload.email !== 'string' || payload.email.trim().toLowerCase() !== email.data.toLowerCase()) {
    throw httpError(404, 'Visit request not found');
  }
  res.json({ request: publicVisitorTrackingInfo(submission) });
}));

visitorRouter.get('/pass/:passNumber', visitorTrackingLimiter, asyncRoute(async (req, res) => {
  const passNumber = z.string().trim().min(12).max(120).safeParse(req.params.passNumber);
  const code = z.string().trim().min(16).max(64).safeParse(req.query.code);
  if (!passNumber.success || !code.success || !passNumber.data.startsWith('PASS-')) throw httpError(404, 'Visitor pass not found');

  const submission = await prisma.submission.findFirst({
    where: { type: 'visitor-request', status: SubmissionStatus.APPROVED, referenceCode: passNumber.data.slice('PASS-'.length) }
  });
  const payload = submission?.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};
  const pass = payload.visitorPass && typeof payload.visitorPass === 'object' && !Array.isArray(payload.visitorPass)
    ? payload.visitorPass as Record<string, unknown>
    : {};
  if (!submission || pass.passNumber !== passNumber.data || typeof pass.securityClearanceCode !== 'string' || !matchesVisitorPassCode(code.data, pass.securityClearanceCode)) {
    throw httpError(404, 'Visitor pass not found');
  }

  res.json({ pass: publicVisitorPassInfo(submission) });
}));

router.get('/track/:referenceCode', submissionTrackingLimiter, asyncRoute(async (req, res) => {
  const email = z.string().trim().email().max(254).safeParse(req.query.email);
  if (!email.success) throw httpError(404, 'Submission not found');
  const submission = await prisma.submission.findUnique({ where: { referenceCode: req.params.referenceCode }, select: { referenceCode: true, type: true, status: true, createdAt: true, payload: true } });
  const payload = submission?.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};
  if (!submission || !submissionMatchesEmail(payload, email.data)) throw httpError(404, 'Submission not found');
  res.json({ submission: publicSubmissionTrackingInfo(submission) });
}));

router.post('/:type', submissionLimiter, asyncRoute(async (req, res) => {
  const type = req.params.type;
  if (!supportedTypes.has(type)) throw httpError(404, 'Submission type not supported');
  const input = z.object({ payload: payloadSchema(type) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Submission details are invalid or incomplete');
  const payload = Object.fromEntries(Object.entries(input.data.payload).map(([key, value]) => [key, typeof value === 'string' && key.toLowerCase().includes('email') ? value.trim().toLowerCase() : value])) as Prisma.InputJsonObject;
  const rawSession = req.cookies?.[SESSION_COOKIE];
  let submitterId: string | undefined;
  if (rawSession) {
    const session = await prisma.session.findUnique({ where: { id: hashToken(rawSession) }, select: { userId: true, expiresAt: true, user: { select: { isActive: true } } } });
    if (session && session.expiresAt > new Date() && session.user.isActive) submitterId = session.userId;
  }
  const reference = referencedContent[type];
  if (reference) {
    const referencedId = String(payload[reference.idKey]);
    const contentEntry = await prisma.cmsEntry.findFirst({
      where: {
        type: reference.type,
        status: PublicationStatus.PUBLISHED,
        deletedAt: null,
        OR: [{ id: referencedId }, { legacyId: referencedId }, { content: { path: ['id'], equals: referencedId } }]
      },
      select: { id: true, title: true, content: true }
    });
    if (!contentEntry) throw httpError(404, 'The selected SiHub item is no longer available');
    if (payload[reference.titleKey] !== contentEntry.title) throw httpError(409, 'The selected item changed. Refresh the page and submit again.');
    if (type === 'event-registration') {
      const eventContent = contentEntry.content && typeof contentEntry.content === 'object' && !Array.isArray(contentEntry.content)
        ? contentEntry.content as Record<string, unknown>
        : {};
      const activeStatuses = [SubmissionStatus.PENDING, SubmissionStatus.APPROVED, SubmissionStatus.COMPLETED];
      const duplicate = await prisma.submission.findFirst({ where: {
        type,
        status: { in: activeStatuses },
        AND: [
          { payload: { path: ['eventId'], equals: referencedId } },
          { payload: { path: ['email'], equals: payload.email as string } }
        ]
      }, select: { id: true } });
      if (duplicate) throw httpError(409, 'This email already has an active registration for the event');
      const capacity = typeof eventContent.capacity === 'number' ? eventContent.capacity : 0;
      if (capacity > 0) {
        const registrationCount = await prisma.submission.count({ where: {
          type,
          status: { in: activeStatuses },
          payload: { path: ['eventId'], equals: referencedId }
        } });
        if (registrationCount >= capacity) throw httpError(409, 'This event has reached its registration capacity');
      }
    }
  }
  if (type === 'startup-pitch' && payload.pitchDeckAssetId !== undefined) {
    if (typeof payload.pitchDeckAssetId !== 'string' || !submitterId) throw httpError(400, 'A verified signed-in founder upload is required for a pitch deck');
    const deck = await prisma.mediaAsset.findFirst({ where: { id: payload.pitchDeckAssetId, uploadedById: submitterId, contentType: 'application/pdf', verified: true } });
    if (!deck) throw httpError(400, 'Pitch deck must be a verified PDF uploaded by your account');
  }
  const prefix = type === 'visitor-request' ? 'VIST' : 'SIHUB';
  const referenceCode = `${prefix}-${new Date().getFullYear()}-${randomBytes(8).toString('hex').toUpperCase()}`;
  const submission = await prisma.submission.create({ data: { type, payload, submitterId, referenceCode } });
  res.status(201).json({ submission: { id: submission.id, type: submission.type, status: submission.status, referenceCode: submission.referenceCode, createdAt: submission.createdAt } });
}));

export const adminSubmissionsRouter = Router();
adminSubmissionsRouter.get('/', requireAuth, requireRole(...reviewRoles), asyncRoute(async (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  if (type && !supportedTypes.has(type)) throw httpError(400, 'Unsupported submission filter');
  const entries = await prisma.submission.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { submitter: { select: { id: true, fullName: true, email: true, role: true } } }
  });
  res.json({ submissions: entries });
}));

adminSubmissionsRouter.patch('/:id', requireAuth, requireRole(...reviewRoles), asyncRoute(async (req, res) => {
  const input = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED']),
    reason: z.string().max(2000).optional(),
    reviewData: z.object({ assignedHost: z.string().trim().min(2).max(200).optional(), adminNotes: z.string().max(2000).optional() }).optional()
  }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid submission decision');
  const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
  if (!existing || !canTransitionSubmission(existing.status, input.data.status, existing.type)) throw httpError(409, 'Submission is not available for this decision');
  const previousPayload = existing.payload && typeof existing.payload === 'object' && !Array.isArray(existing.payload) ? existing.payload as Prisma.InputJsonObject : {};
  const visitorPass = existing.type === 'visitor-request' && input.data.status === 'APPROVED' ? {
    passNumber: `PASS-${existing.referenceCode}`,
    assignedHost: input.data.reviewData?.assignedHost ?? 'SiHub Visitor Desk',
    securityClearanceCode: `SIHUB-${randomBytes(8).toString('hex').toUpperCase()}`,
    issuedAt: new Date().toISOString()
  } : undefined;
  const reason = input.data.reason?.trim();
  const decisionNotes = existing.type !== 'visitor-request' && reason
    ? input.data.status === 'REJECTED'
      ? { rejectionReason: reason, decisionReason: reason }
      : { reviewerNotes: reason, adminFeedback: reason }
    : {};
  const payload = {
    ...previousPayload,
    ...(input.data.reviewData ?? {}),
    ...decisionNotes,
    ...(visitorPass ? { visitorPass } : {})
  } as Prisma.InputJsonObject;
  const updated = await prisma.submission.update({ where: { id: existing.id }, data: { status: input.data.status, reviewerId: req.authUser!.id, reviewedAt: new Date(), payload } });
  if (input.data.status === 'APPROVED' && (existing.type === 'community-topic' || existing.type === 'startup-pitch')) {
    const title = String(previousPayload.title ?? previousPayload.name ?? '');
    const slugBase = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'community-entry';
    const contentType = existing.type === 'community-topic' ? 'community-topic' : 'startup';
    const contentStatus: PublicationStatus = existing.type === 'community-topic' ? PublicationStatus.PUBLISHED : PublicationStatus.APPROVED;
    await prisma.cmsEntry.upsert({
      where: { type_slug: { type: contentType, slug: `${slugBase}-${existing.referenceCode.toLowerCase().slice(-8)}` } },
      create: {
        type: contentType,
        slug: `${slugBase}-${existing.referenceCode.toLowerCase().slice(-8)}`,
        title,
        summary: String(previousPayload.summary ?? previousPayload.tagline ?? previousPayload.content ?? '').slice(0, 10000) || null,
        content: publicSubmissionContent(existing.type, previousPayload, existing.referenceCode) as Prisma.InputJsonObject,
        status: contentStatus,
        authorId: existing.submitterId
      },
      update: {}
    });
  }
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `SUBMISSION_${input.data.status}`, entity: existing.type, entityId: existing.id, metadata: { referenceCode: existing.referenceCode, reason: input.data.reason ?? null } } });
  res.json({ submission: updated });
}));

export default router;
export { visitorRouter };
