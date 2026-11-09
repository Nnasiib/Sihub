import { Router } from 'express';
import { EnrollmentStatus, Prisma, PublicationStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';

const router = Router();
const courseManagers = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER, Role.INSTRUCTOR] as const;
const approvers = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as const;
const courseInput = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(240),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(1).max(10000),
  level: z.string().trim().min(1).max(50),
  instructorName: z.string().trim().max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
const lessonInput = z.object({
  title: z.string().trim().min(2).max(240),
  lessonType: z.enum(['video', 'pdf', 'reading', 'assignment', 'quiz']),
  durationMinutes: z.number().int().min(0).max(10000).default(0),
  textContent: z.string().max(100000).optional(),
  assignmentPrompt: z.string().max(20000).optional(),
  mediaAssetId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const ensureCourseEditor = async (courseId: string, userId: string, role: Role) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw httpError(404, 'Course not found');
  if (role === Role.INSTRUCTOR && course.instructorId !== userId) throw httpError(403, 'You may only manage your assigned courses');
  return course;
};

const visibleLesson = (lesson: {
  id: string; title: string; lessonType: string; position: number; durationMinutes: number;
  textContent: string | null; assignmentPrompt: string | null; mediaAssetId: string | null;
  progress?: { completedAt: Date | null }[];
}) => ({
  id: lesson.id,
  title: lesson.title,
  type: lesson.lessonType,
  order: lesson.position,
  durationMinutes: lesson.durationMinutes,
  textContent: lesson.textContent,
  assignmentPrompt: lesson.assignmentPrompt,
  mediaAssetId: lesson.mediaAssetId,
  completed: Boolean(lesson.progress?.some(item => item.completedAt))
});

router.get('/courses', asyncRoute(async (_req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: PublicationStatus.PUBLISHED },
      select: {
        id: true, legacyId: true, slug: true, title: true, category: true, description: true, level: true, instructorName: true, payload: true, createdAt: true,
        modules: { orderBy: { position: 'asc' }, select: { id: true, title: true, position: true, lessons: { where: { status: PublicationStatus.PUBLISHED }, orderBy: { position: 'asc' }, select: { id: true, title: true, lessonType: true, durationMinutes: true, position: true } } } }
      },
      orderBy: { title: 'asc' }
    });
    res.json({ courses: courses.map(course => {
      const payload = course.payload && typeof course.payload === 'object' && !Array.isArray(course.payload)
        ? course.payload as Record<string, unknown>
        : {};
      const { modules: _modules, ...safeMetadata } = payload;
      return {
        ...safeMetadata,
        id: course.id,
        slug: course.slug,
        title: course.title,
        code: typeof safeMetadata.code === 'string' ? safeMetadata.code : course.slug.toUpperCase(),
        titleSo: typeof safeMetadata.titleSo === 'string' ? safeMetadata.titleSo : undefined,
        category: course.category,
        description: course.description,
        descriptionSo: typeof safeMetadata.descriptionSo === 'string' ? safeMetadata.descriptionSo : undefined,
        level: course.level,
        instructorName: course.instructorName ?? (typeof safeMetadata.instructorName === 'string' ? safeMetadata.instructorName : ''),
        instructorTitle: typeof safeMetadata.instructorTitle === 'string' ? safeMetadata.instructorTitle : '',
        durationWeeks: typeof safeMetadata.durationWeeks === 'number' ? safeMetadata.durationWeeks : 0,
        hoursPerWeek: typeof safeMetadata.hoursPerWeek === 'number' ? safeMetadata.hoursPerWeek : 0,
        deliveryMode: typeof safeMetadata.deliveryMode === 'string' ? safeMetadata.deliveryMode : 'Online',
        capacity: typeof safeMetadata.capacity === 'number' ? safeMetadata.capacity : 0,
        enrolledCount: typeof safeMetadata.enrolledCount === 'number' ? safeMetadata.enrolledCount : 0,
        thumbnailUrl: typeof safeMetadata.thumbnailUrl === 'string' ? safeMetadata.thumbnailUrl : '',
        prerequisites: Array.isArray(safeMetadata.prerequisites) ? safeMetadata.prerequisites : [],
        learningOutcomes: Array.isArray(safeMetadata.learningOutcomes) ? safeMetadata.learningOutcomes : [],
        createdAt: course.createdAt.toISOString(),
        modules: course.modules.map(module => ({ id: module.id, title: module.title, order: module.position, lessons: module.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, type: lesson.lessonType, durationMinutes: lesson.durationMinutes, moduleId: module.id })) })),
        modulesCount: course.modules.length
      };
    }) });
  } catch {
    res.json({ courses: [] });
  }
}));

router.post('/enrollments', requireAuth, requireRole(Role.STUDENT, Role.LEARNER), asyncRoute(async (req, res) => {
  const input = z.object({ courseId: z.string().min(1), motivation: z.string().trim().min(20).max(5000) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Provide a course and at least 20 characters explaining your motivation');
  const course = await prisma.course.findFirst({ where: { id: input.data.courseId, status: PublicationStatus.PUBLISHED } });
  if (!course) throw httpError(404, 'Course not found');
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: req.authUser!.id, courseId: course.id } },
    create: { studentId: req.authUser!.id, courseId: course.id, motivation: input.data.motivation },
    update: { motivation: input.data.motivation, status: EnrollmentStatus.PENDING, rejectionReason: null, reviewerId: null, reviewedAt: null }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'ENROLLMENT_REQUEST', entity: 'Enrollment', entityId: enrollment.id } });
  res.status(201).json({ enrollment });
}));

router.get('/me/enrollments', requireAuth, requireRole(Role.STUDENT, Role.LEARNER), asyncRoute(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: req.authUser!.id },
    orderBy: { appliedAt: 'desc' },
    include: { course: { select: { id: true, title: true, slug: true, category: true, status: true } }, cohort: { select: { id: true, code: true, status: true } } }
  });
  res.json({ enrollments });
}));

router.get('/me/courses', requireAuth, requireRole(Role.STUDENT, Role.LEARNER), asyncRoute(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: req.authUser!.id, status: EnrollmentStatus.APPROVED, course: { status: PublicationStatus.PUBLISHED } },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { status: PublicationStatus.PUBLISHED },
                orderBy: { position: 'asc' },
                include: { progress: { where: { enrollment: { studentId: req.authUser!.id } }, select: { completedAt: true } } }
              }
            }
          }
        }
      }
    }
  });
  res.json({ courses: enrollments.map(enrollment => ({
    enrollmentId: enrollment.id,
    status: enrollment.status,
    course: {
      id: enrollment.course.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      category: enrollment.course.category,
      description: enrollment.course.description,
      modules: enrollment.course.modules.map(module => ({
        id: module.id,
        title: module.title,
        order: module.position,
        lessons: module.lessons.map(visibleLesson)
      }))
    }
  })) });
}));

router.get('/lessons/:lessonId', requireAuth, requireRole(Role.STUDENT, Role.LEARNER), asyncRoute(async (req, res) => {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: req.params.lessonId,
      status: PublicationStatus.PUBLISHED,
      module: { course: { status: PublicationStatus.PUBLISHED, enrollments: { some: { studentId: req.authUser!.id, status: EnrollmentStatus.APPROVED } } } }
    },
    select: { id: true, title: true, lessonType: true, position: true, durationMinutes: true, textContent: true, assignmentPrompt: true, mediaAssetId: true, payload: false }
  });
  if (!lesson) throw httpError(404, 'Lesson not found or unavailable');
  res.json({ lesson: visibleLesson(lesson) });
}));

router.post('/progress', requireAuth, requireRole(Role.STUDENT, Role.LEARNER), asyncRoute(async (req, res) => {
  const input = z.object({ lessonId: z.string().min(1), completed: z.boolean() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid progress update');
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.data.lessonId,
      status: PublicationStatus.PUBLISHED,
      module: { course: { status: PublicationStatus.PUBLISHED, enrollments: { some: { studentId: req.authUser!.id, status: EnrollmentStatus.APPROVED } } } }
    },
    select: { id: true, module: { select: { courseId: true } } }
  });
  if (!lesson) throw httpError(404, 'Lesson not found or unavailable');
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: req.authUser!.id, courseId: lesson.module.courseId } } });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) throw httpError(403, 'Approved course enrollment required');
  const progress = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    create: { enrollmentId: enrollment.id, lessonId: lesson.id, completedAt: input.data.completed ? new Date() : null },
    update: { completedAt: input.data.completed ? new Date() : null }
  });
  res.json({ progress });
}));

router.get('/manage/courses', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const where = req.authUser!.role === Role.INSTRUCTOR ? { instructorId: req.authUser!.id } : {};
  const courses = await prisma.course.findMany({ where, include: { modules: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } } }, orderBy: { updatedAt: 'desc' } });
  res.json({ courses });
}));

router.post('/manage/courses', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = courseInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid course details');
  const course = await prisma.course.create({
    data: {
      ...input.data,
      payload: input.data.payload as Prisma.InputJsonValue | undefined,
      instructorId: req.authUser!.role === Role.INSTRUCTOR ? req.authUser!.id : undefined,
      status: PublicationStatus.DRAFT
    }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_CREATE', entity: 'Course', entityId: course.id } });
  res.status(201).json({ course });
}));

router.patch('/manage/courses/:courseId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const existing = await ensureCourseEditor(req.params.courseId, req.authUser!.id, req.authUser!.role);
  if (existing.status === PublicationStatus.PENDING_APPROVAL || existing.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');
  const input = courseInput.partial().safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid course update');
  const data: Prisma.CourseUpdateInput = {
    ...(input.data.slug !== undefined ? { slug: input.data.slug } : {}),
    ...(input.data.title !== undefined ? { title: input.data.title } : {}),
    ...(input.data.category !== undefined ? { category: input.data.category } : {}),
    ...(input.data.description !== undefined ? { description: input.data.description } : {}),
    ...(input.data.level !== undefined ? { level: input.data.level } : {}),
    ...(input.data.instructorName !== undefined ? { instructorName: input.data.instructorName } : {}),
    ...(input.data.payload !== undefined ? { payload: input.data.payload as Prisma.InputJsonValue } : {})
  };
  const course = await prisma.course.update({ where: { id: req.params.courseId }, data: { ...data, status: PublicationStatus.DRAFT, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_UPDATE', entity: 'Course', entityId: course.id } });
  res.json({ course });
}));

router.delete('/manage/courses/:courseId', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) throw httpError(404, 'Course not found');
  const archived = await prisma.course.update({ where: { id: course.id }, data: { status: PublicationStatus.ARCHIVED, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_ARCHIVE', entity: 'Course', entityId: course.id } });
  res.json({ course: archived });
}));

router.post('/manage/courses/:courseId/submit', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const course = await ensureCourseEditor(req.params.courseId, req.authUser!.id, req.authUser!.role);
  if (course.status !== PublicationStatus.DRAFT && course.status !== PublicationStatus.REJECTED) throw httpError(409, 'Course cannot be submitted from its current state');
  const updated = await prisma.course.update({ where: { id: course.id }, data: { status: PublicationStatus.PENDING_APPROVAL } });
  res.json({ course: updated });
}));

router.patch('/manage/courses/:courseId/review', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reason: z.string().max(2000).optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid review decision');
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course || course.status !== PublicationStatus.PENDING_APPROVAL) throw httpError(409, 'Course is not pending review');
  const updated = await prisma.course.update({ where: { id: course.id }, data: { status: input.data.decision } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `COURSE_${input.data.decision}`, entity: 'Course', entityId: course.id, metadata: { reason: input.data.reason ?? null } } });
  res.json({ course: updated });
}));

router.post('/manage/courses/:courseId/publish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course || course.status !== PublicationStatus.APPROVED) throw httpError(409, 'Course must be approved before publishing');
  const updated = await prisma.course.update({ where: { id: course.id }, data: { status: PublicationStatus.PUBLISHED, publishedAt: new Date() } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_PUBLISHED', entity: 'Course', entityId: course.id } });
  res.json({ course: updated });
}));

router.post('/manage/courses/:courseId/unpublish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course || course.status !== PublicationStatus.PUBLISHED) throw httpError(409, 'Course is not published');
  const updated = await prisma.course.update({ where: { id: course.id }, data: { status: PublicationStatus.DRAFT, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_UNPUBLISHED', entity: 'Course', entityId: course.id } });
  res.json({ course: updated });
}));

router.post('/manage/courses/:courseId/modules', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const course = await ensureCourseEditor(req.params.courseId, req.authUser!.id, req.authUser!.role);
  if (course.status === PublicationStatus.PENDING_APPROVAL || course.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');
  const input = z.object({ title: z.string().trim().min(2).max(240), position: z.number().int().min(0) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid module details');
  const positions = await prisma.courseModule.aggregate({ where: { courseId: req.params.courseId }, _max: { position: true } });
  const module = await prisma.courseModule.create({ data: { courseId: req.params.courseId, ...input.data, position: Math.max(input.data.position, (positions._max.position ?? -1) + 1) } });
  if (course.status === PublicationStatus.PUBLISHED) await prisma.course.update({ where: { id: course.id }, data: { status: PublicationStatus.DRAFT, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_MODULE_CREATE', entity: 'CourseModule', entityId: module.id } });
  res.status(201).json({ module });
}));

router.patch('/manage/modules/:moduleId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = z.object({ title: z.string().trim().min(2).max(240).optional(), position: z.number().int().min(0).max(10000).optional() }).refine(value => Object.keys(value).length > 0).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid module update');
  const existing = await prisma.courseModule.findUnique({ where: { id: req.params.moduleId }, include: { course: true } });
  if (!existing) throw httpError(404, 'Course module not found');
  await ensureCourseEditor(existing.courseId, req.authUser!.id, req.authUser!.role);
  if (existing.course.status === PublicationStatus.PENDING_APPROVAL || existing.course.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');

  const module = await prisma.$transaction(async transaction => {
    const target = input.data.position;
    const occupied = target !== undefined && target !== existing.position
      ? await transaction.courseModule.findFirst({ where: { courseId: existing.courseId, position: target, id: { not: existing.id } } })
      : null;
    if (occupied) await transaction.courseModule.update({ where: { id: occupied.id }, data: { position: -1 } });
    const updated = await transaction.courseModule.update({ where: { id: existing.id }, data: input.data });
    if (occupied) await transaction.courseModule.update({ where: { id: occupied.id }, data: { position: existing.position } });
    await transaction.course.update({ where: { id: existing.courseId }, data: { status: PublicationStatus.DRAFT, publishedAt: null } });
    return updated;
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_MODULE_UPDATE', entity: 'CourseModule', entityId: module.id } });
  res.json({ module });
}));

router.delete('/manage/modules/:moduleId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const existing = await prisma.courseModule.findUnique({ where: { id: req.params.moduleId }, include: { course: true, _count: { select: { lessons: true } } } });
  if (!existing) throw httpError(404, 'Course module not found');
  await ensureCourseEditor(existing.courseId, req.authUser!.id, req.authUser!.role);
  if (existing.course.status === PublicationStatus.PENDING_APPROVAL || existing.course.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');
  if (existing._count.lessons) throw httpError(409, 'Modules with lesson history cannot be deleted');
  await prisma.$transaction([
    prisma.courseModule.delete({ where: { id: existing.id } }),
    prisma.course.update({ where: { id: existing.courseId }, data: { status: PublicationStatus.DRAFT, publishedAt: null } })
  ]);
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_MODULE_DELETE', entity: 'CourseModule', entityId: existing.id } });
  res.status(204).end();
}));

router.post('/manage/modules/:moduleId/lessons', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = lessonInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid lesson details');
  const module = await prisma.courseModule.findUnique({ where: { id: req.params.moduleId }, include: { course: true, lessons: { select: { position: true } } } });
  if (!module) throw httpError(404, 'Module not found');
  await ensureCourseEditor(module.courseId, req.authUser!.id, req.authUser!.role);
  if (module.course.status === PublicationStatus.PENDING_APPROVAL || module.course.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');
  if (input.data.mediaAssetId) {
    const asset = await prisma.mediaAsset.findFirst({ where: { id: input.data.mediaAssetId, verified: true } });
    if (!asset) throw httpError(400, 'Learning material is not a verified upload');
  }
  const position = module.lessons.length;
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: module.id,
      position,
      ...input.data,
      payload: input.data.payload as Prisma.InputJsonValue | undefined,
      status: PublicationStatus.DRAFT
    }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'LESSON_CREATE', entity: 'Lesson', entityId: lesson.id } });
  res.status(201).json({ lesson });
}));

router.patch('/manage/lessons/:lessonId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = lessonInput.partial().safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid lesson update');
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, include: { module: true } });
  if (!lesson) throw httpError(404, 'Lesson not found');
  const course = await ensureCourseEditor(lesson.module.courseId, req.authUser!.id, req.authUser!.role);
  if (course.status === PublicationStatus.PENDING_APPROVAL || course.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Course cannot be edited in its current state');
  if (lesson.status === PublicationStatus.PENDING_APPROVAL || lesson.status === PublicationStatus.ARCHIVED) throw httpError(409, 'Lesson cannot be edited in its current state');
  if (input.data.mediaAssetId) {
    const asset = await prisma.mediaAsset.findFirst({ where: { id: input.data.mediaAssetId, verified: true } });
    if (!asset) throw httpError(400, 'Learning material is not a verified upload');
  }
  const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      ...input.data,
      payload: input.data.payload as Prisma.InputJsonValue | undefined,
      status: PublicationStatus.DRAFT,
      publishedAt: null
    }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'LESSON_UPDATE', entity: 'Lesson', entityId: lesson.id } });
  res.json({ lesson: updated });
}));

router.delete('/manage/lessons/:lessonId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, include: { module: true } });
  if (!lesson) throw httpError(404, 'Lesson not found');
  await ensureCourseEditor(lesson.module.courseId, req.authUser!.id, req.authUser!.role);
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { status: PublicationStatus.ARCHIVED, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'LESSON_ARCHIVE', entity: 'Lesson', entityId: lesson.id } });
  res.json({ lesson: updated });
}));

router.post('/manage/lessons/:lessonId/submit', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, include: { module: { include: { course: true } } } });
  if (!lesson) throw httpError(404, 'Lesson not found');
  await ensureCourseEditor(lesson.module.courseId, req.authUser!.id, req.authUser!.role);
  if (lesson.status !== PublicationStatus.DRAFT && lesson.status !== PublicationStatus.REJECTED) throw httpError(409, 'Lesson cannot be submitted from its current state');
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { status: PublicationStatus.PENDING_APPROVAL, rejectionReason: null } });
  res.json({ lesson: updated });
}));

router.patch('/manage/lessons/:lessonId/review', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reason: z.string().max(2000).optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid lesson review decision');
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson || lesson.status !== PublicationStatus.PENDING_APPROVAL) throw httpError(409, 'Lesson is not pending review');
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { status: input.data.decision, rejectionReason: input.data.decision === 'REJECTED' ? input.data.reason : null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `LESSON_${input.data.decision}`, entity: 'Lesson', entityId: lesson.id, metadata: { reason: input.data.reason ?? null } } });
  res.json({ lesson: updated });
}));

router.post('/manage/lessons/:lessonId/publish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson || lesson.status !== PublicationStatus.APPROVED) throw httpError(409, 'Lesson must be approved before publishing');
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { status: PublicationStatus.PUBLISHED, publishedAt: new Date() } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'LESSON_PUBLISHED', entity: 'Lesson', entityId: lesson.id } });
  res.json({ lesson: updated });
}));

router.post('/manage/lessons/:lessonId/unpublish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson || lesson.status !== PublicationStatus.PUBLISHED) throw httpError(409, 'Lesson is not published');
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { status: PublicationStatus.DRAFT, publishedAt: null } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'LESSON_UNPUBLISHED', entity: 'Lesson', entityId: lesson.id } });
  res.json({ lesson: updated });
}));

router.get('/manage/students', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const students = await prisma.user.findMany({ where: { role: Role.STUDENT, isActive: true }, select: { id: true, email: true, fullName: true }, orderBy: { fullName: 'asc' } });
  res.json({ students });
}));

router.get('/manage/enrollments', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({ include: { student: { select: { id: true, email: true, fullName: true } }, course: { select: { id: true, title: true } } }, orderBy: { appliedAt: 'desc' } });
  res.json({ enrollments });
}));

router.post('/manage/enrollments', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ studentId: z.string().min(1), courseId: z.string().min(1) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid student course assignment');
  const [student, course] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.data.studentId, role: Role.STUDENT, isActive: true } }),
    prisma.course.findFirst({ where: { id: input.data.courseId, status: PublicationStatus.PUBLISHED } })
  ]);
  if (!student || !course) throw httpError(404, 'Active student or published course not found');
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    create: { studentId: student.id, courseId: course.id, motivation: 'Assigned by SiHub education administration', status: EnrollmentStatus.APPROVED, reviewedAt: new Date(), reviewerId: req.authUser!.id },
    update: { status: EnrollmentStatus.APPROVED, reviewedAt: new Date(), reviewerId: req.authUser!.id, rejectionReason: null }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'COURSE_ASSIGNMENT', entity: 'Enrollment', entityId: enrollment.id, metadata: { studentId: student.id, courseId: course.id } } });
  res.status(201).json({ enrollment });
}));

router.patch('/manage/enrollments/:enrollmentId', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reason: z.string().max(2000).optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid enrollment decision');
  const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.enrollmentId } });
  if (!enrollment || enrollment.status !== EnrollmentStatus.PENDING) throw httpError(409, 'Enrollment is not pending review');
  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: input.data.decision, reviewedAt: new Date(), reviewerId: req.authUser!.id, rejectionReason: input.data.decision === 'REJECTED' ? input.data.reason : null }
  });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: `ENROLLMENT_${input.data.decision}`, entity: 'Enrollment', entityId: enrollment.id, metadata: { reason: input.data.reason ?? null } } });
  res.json({ enrollment: updated });
}));

export default router;
