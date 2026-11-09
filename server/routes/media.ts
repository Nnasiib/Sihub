import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';
import { matchesMediaContentType, validateMediaUpload } from '../mediaValidation';

const router = Router();
const uploadRoles = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER, Role.INSTRUCTOR, Role.STUDENT, Role.LEARNER, Role.STARTUP_FOUNDER] as const;
const bucket = process.env.S3_BUCKET ?? '';
const storage = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
    : undefined,
});

const ensureStorage = () => {
  if (!bucket) throw httpError(503, 'Private media storage is not configured');
};

router.get('/admin', requireAuth, requireRole(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN), asyncRoute(async (_req, res) => {
  ensureStorage();
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { verified: true, contentType: { in: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm'] } },
    orderBy: { createdAt: 'desc' }
  });
  const media = await Promise.all(mediaAssets.map(async asset => ({
    id: asset.id,
    originalName: asset.originalName,
    title: asset.title,
    description: asset.description,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    createdAt: asset.createdAt,
    previewUrl: await getSignedUrl(storage, new GetObjectCommand({
      Bucket: bucket,
      Key: asset.objectKey,
      ResponseContentType: asset.contentType,
      ResponseContentDisposition: 'inline'
    }), { expiresIn: 300 })
  })));
  res.json({ media });
}));

router.post('/presign', requireAuth, requireRole(...uploadRoles), asyncRoute(async (req, res) => {
  ensureStorage();
  const input = z.object({ filename: z.string().trim().min(1).max(255), contentType: z.string().min(1), byteSize: z.number().int().positive() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Unsupported media file');
  const validationError = validateMediaUpload(input.data.contentType, input.data.byteSize);
  if (validationError) throw httpError(validationError.status, validationError.message);
  const originalName = path.basename(input.data.filename).replace(/[\r\n\0]/g, '').slice(0, 255);
  const extension = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12);
  const objectKey = `private/${req.authUser!.id}/${randomUUID()}${extension}`;
  const asset = await prisma.mediaAsset.create({
    data: { objectKey, originalName, title: originalName, contentType: input.data.contentType, byteSize: input.data.byteSize, uploadedById: req.authUser!.id, verified: false }
  });
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: input.data.contentType, ContentLength: input.data.byteSize });
  const uploadUrl = await getSignedUrl(storage, command, { expiresIn: 300 });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'MEDIA_UPLOAD_START', entity: 'MediaAsset', entityId: asset.id } });
  res.status(201).json({ assetId: asset.id, uploadUrl, headers: { 'Content-Type': input.data.contentType } });
}));

router.post('/:assetId/complete', requireAuth, requireRole(...uploadRoles), asyncRoute(async (req, res) => {
  ensureStorage();
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.assetId } });
  if (!asset || (asset.uploadedById !== req.authUser!.id && !([Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN] as Role[]).includes(req.authUser!.role))) throw httpError(404, 'Upload not found');
  if (asset.verified) return res.json({ asset });
  const head = await storage.send(new HeadObjectCommand({ Bucket: bucket, Key: asset.objectKey }));
  if (head.ContentLength !== asset.byteSize || head.ContentType !== asset.contentType) throw httpError(400, 'Uploaded file metadata does not match the authorized upload');
  const object = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: asset.objectKey, Range: 'bytes=0-8191' }));
  if (!object.Body) throw httpError(400, 'Unable to verify uploaded file');
  const prefix = await object.Body.transformToByteArray();
  if (!await matchesMediaContentType(prefix, asset.contentType)) throw httpError(400, 'File content does not match an allowed media type');
  const verified = await prisma.mediaAsset.update({ where: { id: asset.id }, data: { verified: true, checksum: head.ChecksumSHA256 ?? null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'MEDIA_UPLOAD_VERIFIED', entity: 'MediaAsset', entityId: asset.id } });
  res.json({ asset: verified });
}));

router.patch('/:assetId/metadata', requireAuth, requireRole(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN), asyncRoute(async (req, res) => {
  const input = z.object({ title: z.string().trim().min(1).max(200).optional(), description: z.string().max(5000).optional() }).refine(value => Object.keys(value).length > 0).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Provide a valid media title or description');
  const existing = await prisma.mediaAsset.findUnique({ where: { id: req.params.assetId } });
  if (!existing || !existing.verified) throw httpError(404, 'Verified media asset not found');
  const asset = await prisma.mediaAsset.update({ where: { id: existing.id }, data: input.data });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'MEDIA_METADATA_UPDATE', entity: 'MediaAsset', entityId: asset.id } });
  res.json({ asset: { id: asset.id, title: asset.title, description: asset.description, originalName: asset.originalName } });
}));

router.get('/:assetId/public', asyncRoute(async (req, res) => {
  ensureStorage();
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.assetId } });
  if (!asset || !asset.verified || (!asset.contentType.startsWith('image/') && !asset.contentType.startsWith('video/'))) throw httpError(404, 'Media not found');

  const publishedReference = await prisma.cmsEntry.findFirst({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
      content: { path: ['mediaAssetIds'], array_contains: [asset.id] }
    },
    select: { id: true }
  });
  if (!publishedReference) throw httpError(404, 'Media not found');

  const mediaUrl = await getSignedUrl(storage, new GetObjectCommand({
    Bucket: bucket,
    Key: asset.objectKey,
    ResponseContentType: asset.contentType,
    ResponseContentDisposition: 'inline'
  }), { expiresIn: 300 });
  res.redirect(302, mediaUrl);
}));

router.delete('/:assetId', requireAuth, requireRole(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN), asyncRoute(async (req, res) => {
  ensureStorage();
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.assetId }, include: { lessons: { select: { id: true } }, assignmentAttachments: { select: { id: true } } } });
  if (!asset) throw httpError(404, 'Media asset not found');

  const cmsReference = await prisma.cmsEntry.findFirst({
    where: { content: { path: ['mediaAssetIds'], array_contains: [asset.id] } },
    select: { id: true }
  });
  const submissionReference = await prisma.submission.findFirst({ where: { payload: { path: ['pitchDeckAssetId'], equals: asset.id } }, select: { id: true } });
  if (asset.lessons.length || asset.assignmentAttachments.length || cmsReference || submissionReference) throw httpError(409, 'Media asset is still referenced by published content, coursework, or a submission');

  await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: asset.objectKey }));
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'MEDIA_DELETE', entity: 'MediaAsset', entityId: asset.id } });
  res.status(204).end();
}));

router.get('/:assetId/download', requireAuth, asyncRoute(async (req, res) => {
  ensureStorage();
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: req.params.assetId },
    include: {
      lessons: {
        include: {
          module: {
            include: {
              course: {
                include: {
                  enrollments: {
                    where: { studentId: req.authUser!.id, status: 'APPROVED' },
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      },
      assignmentAttachments: { include: { assignment: { select: { course: { select: { instructorId: true } } } } } }
    }
  });
  if (!asset || !asset.verified) throw httpError(404, 'Media not found');
  const staff = ([Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as Role[]).includes(req.authUser!.role);
  const owner = asset.uploadedById === req.authUser!.id;
  const courseAccess = ([Role.STUDENT, Role.LEARNER] as Role[]).includes(req.authUser!.role) && asset.lessons.some(lesson => lesson.status === 'PUBLISHED' && lesson.module.course.status === 'PUBLISHED' && lesson.module.course.enrollments.length > 0);
  const instructorAssignmentAccess = req.authUser!.role === Role.INSTRUCTOR && asset.assignmentAttachments.some(item => item.assignment.course.instructorId === req.authUser!.id);
  if (!staff && !owner && !courseAccess && !instructorAssignmentAccess) throw httpError(404, 'Media not found');
  const inlineMedia = req.query.inline === 'true' && (asset.contentType.startsWith('image/') || asset.contentType.startsWith('video/'));
  const disposition = inlineMedia ? 'inline' : `attachment; filename="${asset.originalName.replace(/["\\]/g, '')}"`;
  const downloadUrl = await getSignedUrl(storage, new GetObjectCommand({ Bucket: bucket, Key: asset.objectKey, ResponseContentDisposition: disposition, ...(inlineMedia ? { ResponseContentType: asset.contentType } : {}) }), { expiresIn: 60 });
  res.json({ url: downloadUrl, expiresIn: 60 });
}));

export default router;
