import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { AttendanceStatus, AssignmentSubmissionStatus, EnrollmentStatus, Prisma, PublicationStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';
import { publicExamQuestions, scoreExamAnswers, type ScoredQuestion } from '../educationScoring';

const router = Router();
const studentRoles = [Role.STUDENT, Role.LEARNER] as const;
const courseManagers = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER, Role.INSTRUCTOR] as const;
const approvers = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as const;

const departmentInput = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(180),
  headOfDepartment: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable()
});
const programInput = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(2).max(240),
  departmentId: z.string().min(1).optional().nullable(),
  durationWeeks: z.number().int().min(0).max(520),
  description: z.string().trim().min(1).max(10000),
  credits: z.number().int().min(0).max(1000),
  isActive: z.boolean().optional()
});
const cohortInput = z.object({
  code: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/),
  programId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxCapacity: z.number().int().min(0).max(100000),
  status: z.enum(['active', 'upcoming', 'graduated'])
}).refine(value => value.endDate >= value.startDate, { path: ['endDate'], message: 'End date must be on or after the start date.' });
const profileInput = z.object({
  phone: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(5000).optional(),
  regionalHub: z.string().trim().max(120).optional(),
  academicGoals: z.array(z.string().trim().min(1).max(500)).max(12).optional(),
  preferredLanguage: z.enum(['English', 'Somali']).optional(),
  emailNotifications: z.boolean().optional(),
  smsAlerts: z.boolean().optional()
});
const assignmentInput = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(20000),
  dueDate: z.coerce.date(),
  maxScore: z.number().int().min(1).max(100000),
  weightPercent: z.number().int().min(0).max(100)
});
const assignmentUpdateInput = assignmentInput.omit({ courseId: true }).partial();
const questionInput = z.object({
  id: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(4000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(10),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().max(4000).optional()
}).superRefine((question, context) => {
  if (question.correctAnswerIndex >= question.options.length) context.addIssue({ code: 'custom', message: 'Correct answer must reference one of the options.', path: ['correctAnswerIndex'] });
});
const examFields = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(240),
  durationMinutes: z.number().int().min(0).max(10000),
  scheduledDate: z.coerce.date().optional().nullable(),
  totalMarks: z.number().int().min(1).max(100000),
  passingMarks: z.number().int().min(0).max(100000),
  questions: z.array(questionInput).min(1).max(100)
});
const examInput = examFields.refine(value => value.passingMarks <= value.totalMarks, { path: ['passingMarks'], message: 'Passing marks cannot exceed total marks.' });
const examUpdateInput = examFields.omit({ courseId: true }).partial().refine(
  value => value.passingMarks === undefined || value.totalMarks === undefined || value.passingMarks <= value.totalMarks,
  { path: ['passingMarks'], message: 'Passing marks cannot exceed total marks.' }
);
const questionArray = z.array(questionInput).min(1).max(100);

const writeAudit = (actorId: string, action: string, entity: string, entityId?: string, metadata?: Prisma.InputJsonValue) =>
  prisma.auditLog.create({ data: { actorId, action, entity, entityId, metadata } });

const ensureCourseScope = async (courseId: string, userId: string, role: Role) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw httpError(404, 'Course not found');
  if (role === Role.INSTRUCTOR && course.instructorId !== userId) throw httpError(403, 'You may only manage your assigned courses');
  return course;
};

const ensureStudentEnrollment = async (studentId: string, courseId: string) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, courseId, status: EnrollmentStatus.APPROVED, course: { status: PublicationStatus.PUBLISHED } }
  });
  if (!enrollment) throw httpError(403, 'Approved course enrollment required');
  return enrollment;
};

const canManageCourse = (user: Express.Request['authUser'], courseId: string) => ensureCourseScope(courseId, user!.id, user!.role);
const instructorCourseFilter = (user: Express.Request['authUser']) => user!.role === Role.INSTRUCTOR ? { course: { instructorId: user!.id } } : {};

router.get('/catalog/departments', asyncRoute(async (_req, res) => {
  const departments = await prisma.academicDepartment.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { programs: true } } } });
  res.json({ departments });
}));

router.get('/catalog/programs', asyncRoute(async (_req, res) => {
  const programs = await prisma.academicProgram.findMany({ where: { isActive: true }, orderBy: { title: 'asc' }, include: { department: true, _count: { select: { cohorts: true, courses: true } } } });
  res.json({ programs });
}));

router.get('/catalog/cohorts', asyncRoute(async (_req, res) => {
  const cohorts = await prisma.academicCohort.findMany({ where: { status: { in: ['active', 'upcoming'] }, program: { isActive: true } }, orderBy: { startDate: 'asc' }, include: { program: { select: { id: true, code: true, title: true } }, _count: { select: { enrollments: true } } } });
  res.json({ cohorts });
}));

router.get('/admin/departments', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const departments = await prisma.academicDepartment.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { programs: true } } } });
  res.json({ departments });
}));

router.post('/admin/departments', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = departmentInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid department details');
  const department = await prisma.academicDepartment.create({ data: input.data });
  await writeAudit(req.authUser!.id, 'ACADEMIC_DEPARTMENT_CREATE', 'AcademicDepartment', department.id);
  res.status(201).json({ department });
}));

router.patch('/admin/departments/:id', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = departmentInput.partial().safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid department update');
  const department = await prisma.academicDepartment.update({ where: { id: req.params.id }, data: input.data });
  await writeAudit(req.authUser!.id, 'ACADEMIC_DEPARTMENT_UPDATE', 'AcademicDepartment', department.id);
  res.json({ department });
}));

router.delete('/admin/departments/:id', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const department = await prisma.academicDepartment.findUnique({ where: { id: req.params.id }, include: { _count: { select: { programs: true } } } });
  if (!department) throw httpError(404, 'Department not found');
  if (department._count.programs) throw httpError(409, 'Move or archive this department’s programs before deleting it');
  await prisma.academicDepartment.delete({ where: { id: department.id } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_DEPARTMENT_DELETE', 'AcademicDepartment', department.id);
  res.status(204).end();
}));

router.get('/admin/programs', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const programs = await prisma.academicProgram.findMany({ orderBy: { title: 'asc' }, include: { department: true, _count: { select: { cohorts: true, courses: true } } } });
  res.json({ programs });
}));

router.post('/admin/programs', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = programInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid academic program');
  const { departmentId, isActive, ...data } = input.data;
  const program = await prisma.academicProgram.create({ data: { ...data, isActive: isActive ?? true, department: departmentId ? { connect: { id: departmentId } } : undefined } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_PROGRAM_CREATE', 'AcademicProgram', program.id);
  res.status(201).json({ program });
}));

router.patch('/admin/programs/:id', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = programInput.partial().safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid academic program update');
  const { departmentId, ...data } = input.data;
  const program = await prisma.academicProgram.update({ where: { id: req.params.id }, data: { ...data, ...(departmentId !== undefined ? { department: departmentId ? { connect: { id: departmentId } } : { disconnect: true } } : {}) } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_PROGRAM_UPDATE', 'AcademicProgram', program.id);
  res.json({ program });
}));

router.delete('/admin/programs/:id', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const program = await prisma.academicProgram.update({ where: { id: req.params.id }, data: { isActive: false } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_PROGRAM_ARCHIVE', 'AcademicProgram', program.id);
  res.json({ program });
}));

router.get('/admin/cohorts', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const cohorts = await prisma.academicCohort.findMany({ orderBy: { startDate: 'desc' }, include: { program: true, _count: { select: { enrollments: true } } } });
  res.json({ cohorts });
}));

router.post('/admin/cohorts', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = cohortInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid academic cohort');
  const { programId, ...data } = input.data;
  const cohort = await prisma.academicCohort.create({ data: { ...data, program: { connect: { id: programId } } } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_COHORT_CREATE', 'AcademicCohort', cohort.id);
  res.status(201).json({ cohort });
}));

router.patch('/admin/cohorts/:id', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = cohortInput.partial().safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid academic cohort update');
  const { programId, ...data } = input.data;
  const cohort = await prisma.academicCohort.update({ where: { id: req.params.id }, data: { ...data, ...(programId ? { program: { connect: { id: programId } } } : {}) } });
  await writeAudit(req.authUser!.id, 'ACADEMIC_COHORT_UPDATE', 'AcademicCohort', cohort.id);
  res.json({ cohort });
}));

router.get('/profile', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.authUser!.id }, select: { id: true, fullName: true, email: true } }),
    prisma.studentProfile.findUnique({ where: { userId: req.authUser!.id } })
  ]);
  res.json({ user, profile });
}));

router.patch('/profile', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const input = profileInput.safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid student profile update');
  const profile = await prisma.studentProfile.upsert({ where: { userId: req.authUser!.id }, create: { userId: req.authUser!.id, ...input.data }, update: input.data });
  await writeAudit(req.authUser!.id, 'STUDENT_PROFILE_UPDATE', 'StudentProfile', profile.id);
  res.json({ profile });
}));

router.get('/me/assignments', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: req.authUser!.id, status: EnrollmentStatus.APPROVED, course: { status: PublicationStatus.PUBLISHED } }, select: { courseId: true } });
  const assignments = await prisma.assignment.findMany({ where: { status: PublicationStatus.PUBLISHED, courseId: { in: enrollments.map(item => item.courseId) } }, orderBy: { dueDate: 'asc' }, include: { course: { select: { id: true, title: true } }, submissions: { where: { studentId: req.authUser!.id } } } });
  res.json({ assignments });
}));

router.post('/assignments/:assignmentId/submissions', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const input = z.object({ content: z.string().trim().min(1).max(50000), attachmentAssetId: z.string().min(1).optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Provide assignment work before submitting');
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
  if (!assignment || assignment.status !== PublicationStatus.PUBLISHED) throw httpError(404, 'Assignment not found');
  await ensureStudentEnrollment(req.authUser!.id, assignment.courseId);
  if (input.data.attachmentAssetId) {
    const asset = await prisma.mediaAsset.findFirst({ where: { id: input.data.attachmentAssetId, verified: true, uploadedById: req.authUser!.id } });
    if (!asset) throw httpError(400, 'Attachment must be a verified upload owned by your account');
  }
  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: req.authUser!.id } },
    create: { assignmentId: assignment.id, studentId: req.authUser!.id, ...input.data },
    update: { ...input.data, submittedAt: new Date(), status: AssignmentSubmissionStatus.SUBMITTED, score: null, feedback: null, gradedById: null, gradedAt: null }
  });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_SUBMITTED', 'AssignmentSubmission', submission.id);
  res.status(201).json({ submission });
}));

router.get('/manage/assignments', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const where: Prisma.AssignmentWhereInput = { ...instructorCourseFilter(req.authUser) };
  if (typeof req.query.courseId === 'string') where.courseId = req.query.courseId;
  const assignments = await prisma.assignment.findMany({ where, orderBy: { dueDate: 'asc' }, include: { course: { select: { id: true, title: true, instructorId: true } }, _count: { select: { submissions: true } } } });
  res.json({ assignments });
}));

router.get('/manage/course-students', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const courseId = z.string().min(1).safeParse(req.query.courseId);
  if (!courseId.success) throw httpError(400, 'A course is required');
  await canManageCourse(req.authUser, courseId.data);
  const enrollments = await prisma.enrollment.findMany({ where: { courseId: courseId.data, status: EnrollmentStatus.APPROVED }, select: { student: { select: { id: true, fullName: true, email: true } } }, orderBy: { appliedAt: 'asc' } });
  res.json({ students: enrollments.map(item => item.student) });
}));

router.post('/manage/assignments', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = assignmentInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid assignment details');
  await canManageCourse(req.authUser, input.data.courseId);
  const assignment = await prisma.assignment.create({ data: { ...input.data, createdById: req.authUser!.id } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_CREATE', 'Assignment', assignment.id);
  res.status(201).json({ assignment });
}));

router.patch('/manage/assignments/:assignmentId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = assignmentUpdateInput.safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid assignment update');
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
  if (!existing) throw httpError(404, 'Assignment not found');
  await canManageCourse(req.authUser, existing.courseId);
  const assignment = await prisma.assignment.update({ where: { id: existing.id }, data: { ...input.data, status: PublicationStatus.DRAFT } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_UPDATE', 'Assignment', assignment.id);
  res.json({ assignment });
}));

router.post('/manage/assignments/:assignmentId/submit', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
  if (!existing) throw httpError(404, 'Assignment not found');
  await canManageCourse(req.authUser, existing.courseId);
  if (existing.status !== PublicationStatus.DRAFT && existing.status !== PublicationStatus.REJECTED) throw httpError(409, 'Assignment cannot be submitted from its current state');
  const assignment = await prisma.assignment.update({ where: { id: existing.id }, data: { status: PublicationStatus.PENDING_APPROVAL } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_SUBMIT', 'Assignment', assignment.id);
  res.json({ assignment });
}));

router.patch('/manage/assignments/:assignmentId/review', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid assignment review');
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
  if (!existing || existing.status !== PublicationStatus.PENDING_APPROVAL) throw httpError(409, 'Assignment is not pending review');
  const assignment = await prisma.assignment.update({ where: { id: existing.id }, data: { status: input.data.decision } });
  await writeAudit(req.authUser!.id, `ASSIGNMENT_${input.data.decision}`, 'Assignment', assignment.id);
  res.json({ assignment });
}));

router.post('/manage/assignments/:assignmentId/publish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const existing = await prisma.assignment.findUnique({ where: { id: req.params.assignmentId } });
  if (!existing || existing.status !== PublicationStatus.APPROVED) throw httpError(409, 'Assignment must be approved before publishing');
  const assignment = await prisma.assignment.update({ where: { id: existing.id }, data: { status: PublicationStatus.PUBLISHED } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_PUBLISH', 'Assignment', assignment.id);
  res.json({ assignment });
}));

router.delete('/manage/assignments/:assignmentId', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const assignment = await prisma.assignment.update({ where: { id: req.params.assignmentId }, data: { status: PublicationStatus.ARCHIVED } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_ARCHIVE', 'Assignment', assignment.id);
  res.json({ assignment });
}));

router.get('/manage/assignment-submissions', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const where: Prisma.AssignmentSubmissionWhereInput = req.authUser!.role === Role.INSTRUCTOR ? { assignment: { course: { instructorId: req.authUser!.id } } } : {};
  if (typeof req.query.assignmentId === 'string') where.assignmentId = req.query.assignmentId;
  if (typeof req.query.status === 'string' && Object.values(AssignmentSubmissionStatus).includes(req.query.status as AssignmentSubmissionStatus)) where.status = req.query.status as AssignmentSubmissionStatus;
  const submissions = await prisma.assignmentSubmission.findMany({ where, orderBy: { submittedAt: 'desc' }, include: { assignment: { include: { course: { select: { id: true, title: true } } } }, student: { select: { id: true, fullName: true, email: true } }, gradedBy: { select: { id: true, fullName: true } } } });
  res.json({ submissions });
}));

router.patch('/manage/assignment-submissions/:submissionId/grade', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = z.object({ score: z.number().int().min(0).optional(), feedback: z.string().max(10000), status: z.enum(['GRADED', 'RESUBMIT_REQUESTED']).default('GRADED') }).superRefine((value, context) => {
    if (value.status === 'GRADED' && value.score === undefined) context.addIssue({ code: 'custom', message: 'A score is required when grading a submission.', path: ['score'] });
  }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid grade details');
  const existing = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.submissionId }, include: { assignment: true } });
  if (!existing) throw httpError(404, 'Assignment submission not found');
  await canManageCourse(req.authUser, existing.assignment.courseId);
  if (input.data.score !== undefined && input.data.score > existing.assignment.maxScore) throw httpError(400, 'Score cannot exceed the assignment maximum');
  const submission = await prisma.assignmentSubmission.update({ where: { id: existing.id }, data: {
    score: input.data.status === 'GRADED' ? input.data.score! : null,
    feedback: input.data.feedback,
    status: input.data.status,
    gradedById: input.data.status === 'GRADED' ? req.authUser!.id : null,
    gradedAt: input.data.status === 'GRADED' ? new Date() : null
  } });
  await writeAudit(req.authUser!.id, 'ASSIGNMENT_GRADE', 'AssignmentSubmission', submission.id);
  res.json({ submission });
}));

router.get('/manage/exams', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const where: Prisma.ExamWhereInput = { ...instructorCourseFilter(req.authUser) };
  if (typeof req.query.courseId === 'string') where.courseId = req.query.courseId;
  const exams = await prisma.exam.findMany({ where, orderBy: { createdAt: 'desc' }, include: { course: { select: { id: true, title: true } }, _count: { select: { results: true } } } });
  res.json({ exams });
}));

router.post('/manage/exams', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = examInput.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid exam details');
  await canManageCourse(req.authUser, input.data.courseId);
  const exam = await prisma.exam.create({ data: { ...input.data, questions: input.data.questions as Prisma.InputJsonValue, createdById: req.authUser!.id } });
  await writeAudit(req.authUser!.id, 'EXAM_CREATE', 'Exam', exam.id);
  res.status(201).json({ exam });
}));

router.patch('/manage/exams/:examId', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = examUpdateInput.safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid exam update');
  const existing = await prisma.exam.findUnique({ where: { id: req.params.examId } });
  if (!existing) throw httpError(404, 'Exam not found');
  await canManageCourse(req.authUser, existing.courseId);
  if ((input.data.passingMarks ?? existing.passingMarks) > (input.data.totalMarks ?? existing.totalMarks)) {
    throw httpError(400, 'Passing marks cannot exceed total marks.');
  }
  const exam = await prisma.exam.update({ where: { id: existing.id }, data: { ...input.data, ...(input.data.questions ? { questions: input.data.questions as Prisma.InputJsonValue } : {}), status: PublicationStatus.DRAFT } });
  await writeAudit(req.authUser!.id, 'EXAM_UPDATE', 'Exam', exam.id);
  res.json({ exam });
}));

router.post('/manage/exams/:examId/submit', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const existing = await prisma.exam.findUnique({ where: { id: req.params.examId } });
  if (!existing) throw httpError(404, 'Exam not found');
  await canManageCourse(req.authUser, existing.courseId);
  if (existing.status !== PublicationStatus.DRAFT && existing.status !== PublicationStatus.REJECTED) throw httpError(409, 'Exam cannot be submitted from its current state');
  const exam = await prisma.exam.update({ where: { id: existing.id }, data: { status: PublicationStatus.PENDING_APPROVAL } });
  await writeAudit(req.authUser!.id, 'EXAM_SUBMIT', 'Exam', exam.id);
  res.json({ exam });
}));

router.patch('/manage/exams/:examId/review', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ decision: z.enum(['APPROVED', 'REJECTED']) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid exam review');
  const existing = await prisma.exam.findUnique({ where: { id: req.params.examId } });
  if (!existing || existing.status !== PublicationStatus.PENDING_APPROVAL) throw httpError(409, 'Exam is not pending review');
  const exam = await prisma.exam.update({ where: { id: existing.id }, data: { status: input.data.decision } });
  await writeAudit(req.authUser!.id, `EXAM_${input.data.decision}`, 'Exam', exam.id);
  res.json({ exam });
}));

router.post('/manage/exams/:examId/publish', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const existing = await prisma.exam.findUnique({ where: { id: req.params.examId } });
  if (!existing || existing.status !== PublicationStatus.APPROVED) throw httpError(409, 'Exam must be approved before publishing');
  const exam = await prisma.exam.update({ where: { id: existing.id }, data: { status: PublicationStatus.PUBLISHED } });
  await writeAudit(req.authUser!.id, 'EXAM_PUBLISH', 'Exam', exam.id);
  res.json({ exam });
}));

router.delete('/manage/exams/:examId', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const existing = await prisma.exam.findUnique({ where: { id: req.params.examId } });
  if (!existing) throw httpError(404, 'Exam not found');
  const exam = await prisma.exam.update({ where: { id: existing.id }, data: { status: PublicationStatus.ARCHIVED } });
  await writeAudit(req.authUser!.id, 'EXAM_ARCHIVE', 'Exam', exam.id);
  res.json({ exam });
}));

router.get('/me/exams', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: req.authUser!.id, status: EnrollmentStatus.APPROVED, course: { status: PublicationStatus.PUBLISHED } }, select: { courseId: true } });
  const exams = await prisma.exam.findMany({ where: { status: PublicationStatus.PUBLISHED, courseId: { in: enrollments.map(item => item.courseId) } }, orderBy: { scheduledDate: 'asc' } });
  res.json({ exams: exams.map(exam => ({ ...exam, questions: publicExamQuestions(exam.questions as unknown as ScoredQuestion[]) })) });
}));

router.post('/exams/:examId/attempt', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const input = z.object({ answers: z.record(z.string(), z.number().int().min(0)) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid exam answers');
  const exam = await prisma.exam.findFirst({ where: { id: req.params.examId, status: PublicationStatus.PUBLISHED } });
  if (!exam) throw httpError(404, 'Exam not found');
  await ensureStudentEnrollment(req.authUser!.id, exam.courseId);
  const questions = exam.questions as unknown as ScoredQuestion[];
  const questionIds = new Set(questions.map(question => question.id));
  if (Object.keys(input.data.answers).some(id => !questionIds.has(id)) || questions.some(question => input.data.answers[question.id] === undefined || input.data.answers[question.id] >= question.options.length)) {
    throw httpError(400, 'Answer set does not match the published exam');
  }
  const score = scoreExamAnswers(questions, input.data.answers, exam.totalMarks);
  const result = await prisma.examResult.upsert({
    where: { examId_studentId: { examId: exam.id, studentId: req.authUser!.id } },
    create: { examId: exam.id, studentId: req.authUser!.id, score: score.score, totalMarks: exam.totalMarks, percentage: score.percentage, grade: score.grade, answers: input.data.answers as Prisma.InputJsonValue },
    update: { score: score.score, totalMarks: exam.totalMarks, percentage: score.percentage, grade: score.grade, answers: input.data.answers as Prisma.InputJsonValue, evaluatedAt: new Date(), evaluatedById: null }
  });
  await writeAudit(req.authUser!.id, 'EXAM_ATTEMPT_SUBMITTED', 'ExamResult', result.id);
  res.json({ result: { id: result.id, score: result.score, totalMarks: result.totalMarks, percentage: result.percentage, grade: result.grade, evaluatedAt: result.evaluatedAt } });
}));

router.get('/me/exam-results', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const results = await prisma.examResult.findMany({ where: { studentId: req.authUser!.id }, orderBy: { evaluatedAt: 'desc' }, include: { exam: { select: { id: true, title: true, course: { select: { id: true, title: true } } } } } });
  res.json({ results });
}));

router.get('/manage/exam-results', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const results = await prisma.examResult.findMany({ orderBy: { evaluatedAt: 'desc' }, include: { exam: { select: { id: true, title: true, course: { select: { id: true, title: true } } } }, student: { select: { id: true, fullName: true, email: true } } } });
  res.json({ results });
}));

router.get('/manage/attendance', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const where: Prisma.AttendanceRecordWhereInput = { ...instructorCourseFilter(req.authUser) };
  if (typeof req.query.courseId === 'string') where.courseId = req.query.courseId;
  const records = await prisma.attendanceRecord.findMany({ where, orderBy: { sessionDate: 'desc' }, include: { course: { select: { id: true, title: true } }, student: { select: { id: true, fullName: true, email: true } }, recordedBy: { select: { id: true, fullName: true } } } });
  res.json({ records });
}));

router.post('/manage/attendance', requireAuth, requireRole(...courseManagers), asyncRoute(async (req, res) => {
  const input = z.object({ courseId: z.string().min(1), sessionDate: z.coerce.date(), topic: z.string().trim().min(1).max(240), studentId: z.string().min(1), status: z.nativeEnum(AttendanceStatus) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid attendance record');
  await canManageCourse(req.authUser, input.data.courseId);
  await ensureStudentEnrollment(input.data.studentId, input.data.courseId);
  const record = await prisma.attendanceRecord.upsert({
    where: { courseId_sessionDate_studentId: { courseId: input.data.courseId, sessionDate: input.data.sessionDate, studentId: input.data.studentId } },
    create: { ...input.data, recordedById: req.authUser!.id },
    update: { topic: input.data.topic, status: input.data.status, recordedById: req.authUser!.id }
  });
  await writeAudit(req.authUser!.id, 'ATTENDANCE_RECORD', 'AttendanceRecord', record.id);
  res.status(201).json({ record });
}));

router.get('/me/attendance', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const records = await prisma.attendanceRecord.findMany({ where: { studentId: req.authUser!.id }, orderBy: { sessionDate: 'desc' }, include: { course: { select: { id: true, title: true } } } });
  res.json({ records });
}));

router.get('/manage/certificates', requireAuth, requireRole(...approvers), asyncRoute(async (_req, res) => {
  const certificates = await prisma.certificate.findMany({ orderBy: { issueDate: 'desc' }, include: { course: { select: { id: true, title: true } }, student: { select: { id: true, fullName: true, email: true } }, issuer: { select: { id: true, fullName: true } } } });
  res.json({ certificates });
}));

router.post('/manage/certificates', requireAuth, requireRole(...approvers), asyncRoute(async (req, res) => {
  const input = z.object({ studentId: z.string().min(1), courseId: z.string().min(1), grade: z.string().trim().min(1).max(40) }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid certificate request');
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: input.data.studentId,
      courseId: input.data.courseId,
      status: EnrollmentStatus.APPROVED,
      course: { status: PublicationStatus.PUBLISHED }
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                where: { status: PublicationStatus.PUBLISHED },
                include: { progress: { where: { completedAt: { not: null } }, select: { id: true } } }
              }
            }
          },
          assignments: { where: { status: PublicationStatus.PUBLISHED }, include: { submissions: { where: { studentId: input.data.studentId } } } },
          exams: { where: { status: PublicationStatus.PUBLISHED }, include: { results: { where: { studentId: input.data.studentId } } } }
        }
      }
    }
  });
  if (!enrollment) throw httpError(409, 'Approved course enrollment is required');
  const lessons = enrollment.course.modules.flatMap(module => module.lessons);
  if (!lessons.length || lessons.some(lesson => lesson.progress.length === 0)) throw httpError(409, 'All published lessons must be completed before issuing a certificate');
  const incompleteAssignments = enrollment.course.assignments.some(assignment => {
    const submission = assignment.submissions[0];
    return !submission || submission.status !== 'GRADED' || submission.score === null;
  });
  if (incompleteAssignments) throw httpError(409, 'All published assignments must be graded before issuing a certificate');
  const incompleteExams = enrollment.course.exams.some(exam => !exam.results[0] || exam.results[0].score < exam.passingMarks);
  if (incompleteExams) throw httpError(409, 'All published exams must be passed before issuing a certificate');
  const existing = await prisma.certificate.findUnique({ where: { courseId_studentId: { courseId: input.data.courseId, studentId: input.data.studentId } } });
  if (existing) return res.json({ certificate: existing });
  const certificate = await prisma.certificate.create({ data: { ...input.data, certificateNumber: `SIHUB-${new Date().getFullYear()}-${randomBytes(8).toString('hex').toUpperCase()}`, verificationHash: randomBytes(32).toString('hex'), issuerId: req.authUser!.id } });
  await writeAudit(req.authUser!.id, 'CERTIFICATE_ISSUED', 'Certificate', certificate.id);
  res.status(201).json({ certificate });
}));

router.get('/me/certificates', requireAuth, requireRole(...studentRoles), asyncRoute(async (req, res) => {
  const certificates = await prisma.certificate.findMany({ where: { studentId: req.authUser!.id }, orderBy: { issueDate: 'desc' }, include: { course: { select: { id: true, title: true } } } });
  res.json({ certificates });
}));

router.get('/certificates/verify/:certificateNumber', asyncRoute(async (req, res) => {
  const certificate = await prisma.certificate.findUnique({ where: { certificateNumber: req.params.certificateNumber }, select: { certificateNumber: true, issueDate: true, grade: true, course: { select: { title: true } }, student: { select: { fullName: true } } } });
  if (!certificate) throw httpError(404, 'Certificate not found');
  res.json({ certificate });
}));

export default router;