import 'dotenv/config';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AssignmentSubmissionStatus, AttendanceStatus, Prisma, PublicationStatus, Role, SubmissionStatus } from '@prisma/client';
import { prisma } from '../server/db';

const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 130) || 'legacy-entry';
const cmsTypes: Record<string, string> = {
  sihub_demo_startups_v1: 'startup',
  sihub_demo_innovation_v1: 'innovation',
  sihub_demo_programs_v1: 'program',
  sihub_demo_events_v1: 'event',
  sihub_demo_opportunities_v1: 'opportunity',
  sihub_demo_partners_v1: 'partner',
  sihub_demo_news_v1: 'news',
  sihub_demo_community_members_v1: 'community-member',
  sihub_demo_forum_topics_v1: 'community-topic',
  sihub_demo_impact_v1: 'impact'
};
const submissionTypes: Record<string, string> = {
  sihub_demo_program_apps_v1: 'program-application',
  sihub_demo_opportunity_apps_v1: 'opportunity-application',
  sihub_demo_event_regs_v1: 'event-registration',
  sihub_demo_partner_inquiries_v1: 'partner-inquiry',
  sihub_demo_mentorship_reqs_v1: 'mentorship-request'
};

const parseBucket = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value) as unknown; } catch { return value; }
};
const rowsOf = (value: unknown) => Array.isArray(value) ? value.filter(row => row && typeof row === 'object') as Record<string, unknown>[] : [];
const normalizedStatus = (value: unknown): SubmissionStatus => {
  const status = String(value ?? '').toLowerCase();
  if (status === 'approved' || status === 'accepted') return SubmissionStatus.APPROVED;
  if (status === 'rejected' || status === 'declined') return SubmissionStatus.REJECTED;
  if (status === 'completed' || status === 'attended') return SubmissionStatus.COMPLETED;
  return SubmissionStatus.PENDING;
};

const resolveUser = async (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const normalized = value.trim();
    if (normalized.includes('@')) {
      const byEmail = await prisma.user.findUnique({ where: { email: normalized.toLowerCase() }, select: { id: true } });
      if (byEmail) return byEmail.id;
    }
    const byId = await prisma.user.findUnique({ where: { id: normalized }, select: { id: true } });
    if (byId) return byId.id;
    const byName = await prisma.user.findMany({ where: { fullName: normalized }, take: 2, select: { id: true } });
    if (byName.length === 1) return byName[0].id;
  }
  return null;
};

const resolveCourse = async (legacyId: unknown) => {
  if (typeof legacyId !== 'string' || !legacyId) return null;
  return prisma.course.findFirst({ where: { OR: [{ id: legacyId }, { legacyId }] }, select: { id: true } });
};

async function importCourses(value: unknown) {
  let imported = 0;
  for (const course of rowsOf(value)) {
    const legacyId = String(course.id ?? '');
    const title = String(course.title ?? '');
    if (!legacyId || !title || await prisma.course.findUnique({ where: { legacyId } })) continue;
    const slug = `${slugify(String(course.code ?? title))}-${slugify(legacyId).slice(-24)}`;
    const modules = rowsOf(course.modules);
    await prisma.course.create({
      data: {
        legacyId, slug, title: title.slice(0, 240), category: String(course.category ?? 'Uncategorized').slice(0, 100),
        description: String(course.description ?? '').slice(0, 10000), level: String(course.level ?? 'Unspecified').slice(0, 50),
        instructorName: String(course.instructorName ?? '').slice(0, 120) || null, status: PublicationStatus.DRAFT,
        payload: course as Prisma.InputJsonValue,
        modules: { create: modules.map((module, moduleIndex) => ({
          legacyId: String(module.id ?? '') || null,
          title: String(module.title ?? `Module ${moduleIndex + 1}`).slice(0, 240),
          position: Number.isInteger(module.order) ? Number(module.order) : moduleIndex,
          lessons: { create: rowsOf(module.lessons).map((lesson, lessonIndex) => ({
            legacyId: String(lesson.id ?? '') || null,
            title: String(lesson.title ?? `Lesson ${lessonIndex + 1}`).slice(0, 240),
            lessonType: String(lesson.type ?? 'reading').slice(0, 40),
            position: lessonIndex,
            durationMinutes: Number.isInteger(lesson.durationMinutes) ? Number(lesson.durationMinutes) : 0,
            textContent: String(lesson.textContent ?? '').slice(0, 100000) || null,
            assignmentPrompt: String(lesson.assignmentPrompt ?? '').slice(0, 20000) || null,
            payload: lesson as Prisma.InputJsonValue,
            status: PublicationStatus.DRAFT
          })) }
        })) }
      }
    });
    imported += 1;
  }
  return imported;
}

async function importCms(type: string, value: unknown) {
  const rawRows = Array.isArray(value) ? rowsOf(value) : type === 'impact' && value && typeof value === 'object' ? [value as Record<string, unknown>] : [];
  let imported = 0;
  for (const [index, record] of rawRows.entries()) {
    const title = String(record.title ?? record.name ?? `${type} ${index + 1}`).slice(0, 240);
    const slug = slugify(String(record.id ?? title));
    if (await prisma.cmsEntry.findUnique({ where: { type_slug: { type, slug } } })) continue;
    await prisma.cmsEntry.create({ data: {
      type, slug, title,
      summary: String(record.summary ?? record.description ?? record.tagline ?? '').slice(0, 10000) || null,
      content: record as Prisma.InputJsonValue,
      status: PublicationStatus.DRAFT
    } });
    imported += 1;
  }
  return imported;
}

async function importSubmissions(type: string, sourceKey: string, value: unknown) {
  let imported = 0;
  for (const [index, record] of rowsOf(value).entries()) {
    const stableId = String(record.referenceCode ?? record.id ?? `${sourceKey}-${index}`);
    const referenceCode = String(record.referenceCode ?? `LEGACY-${createHash('sha256').update(`${sourceKey}:${stableId}`).digest('hex').slice(0, 20).toUpperCase()}`);
    if (await prisma.submission.findUnique({ where: { referenceCode } })) continue;
    const submitterId = await resolveUser(record.email, record.applicantEmail, record.contactEmail, record.founderEmail, record.menteeEmail, record.userId, record.studentId);
    const payload = { ...record, legacySource: sourceKey } as Prisma.InputJsonObject;
    await prisma.submission.create({
      data: {
        referenceCode,
        type,
        status: normalizedStatus(record.status),
        payload,
        submitterId,
        reviewedAt: record.reviewedAt ? new Date(String(record.reviewedAt)) : null
      }
    });
    imported += 1;
  }
  return imported;
}

async function importVisitorRequests(value: unknown, passesValue: unknown) {
  const passes = new Map(rowsOf(passesValue).map(pass => [String(pass.requestId ?? ''), pass]));
  let imported = 0;
  for (const request of rowsOf(value)) {
    const legacyRef = String(request.referenceCode ?? '');
    const referenceCode = legacyRef || `LEGACY-VISIT-${createHash('sha256').update(JSON.stringify(request)).digest('hex').slice(0, 20).toUpperCase()}`;
    if (await prisma.submission.findUnique({ where: { referenceCode } })) continue;
    const pass = passes.get(String(request.id ?? ''));
    const payload = { ...request, ...(pass ? { visitorPass: pass } : {}), legacySource: 'sihub_demo_visit_requests_v1' } as Prisma.InputJsonObject;
    await prisma.submission.create({
      data: {
        referenceCode, type: 'visitor-request', status: normalizedStatus(request.status), payload,
        submitterId: await resolveUser(request.email),
        reviewedAt: request.reviewedAt ? new Date(String(request.reviewedAt)) : null
      }
    });
    imported += 1;
  }
  return imported;
}

async function importEducationCatalog(buckets: Record<string, unknown>) {
  let imported = 0;
  const departmentRows = rowsOf(parseBucket(buckets.sihub_demo_edu_departments_v1));
  for (const department of departmentRows) {
    const code = String(department.code ?? '');
    if (!code || await prisma.academicDepartment.findUnique({ where: { code } })) continue;
    await prisma.academicDepartment.create({ data: { id: String(department.id ?? undefined), code, name: String(department.name ?? code), headOfDepartment: String(department.headOfDepartment ?? '') || null, email: String(department.email ?? '') || null } });
    imported += 1;
  }
  const programRows = rowsOf(parseBucket(buckets.sihub_demo_edu_programs_v1));
  const programIds = new Map<string, string>();
  for (const program of programRows) {
    const code = String(program.code ?? '');
    if (!code) continue;
    let existing = await prisma.academicProgram.findUnique({ where: { code }, select: { id: true } });
    if (!existing) {
      const departmentName = String(program.department ?? '');
      const department = departmentName ? await prisma.academicDepartment.findFirst({ where: { name: departmentName }, select: { id: true } }) : null;
      existing = await prisma.academicProgram.create({ data: {
        id: String(program.id ?? undefined), code, title: String(program.title ?? code), departmentId: department?.id ?? null,
        durationWeeks: Number(program.durationWeeks) || 0, description: String(program.description ?? ''), credits: Number(program.credits) || 0,
        isActive: Boolean(program.isActive ?? true)
      }, select: { id: true } });
      imported += 1;
    }
    if (program.id) programIds.set(String(program.id), existing.id);
  }
  for (const cohort of rowsOf(parseBucket(buckets.sihub_demo_edu_cohorts_v1))) {
    const code = String(cohort.code ?? '');
    const programId = programIds.get(String(cohort.programId ?? '')) ?? String(cohort.programId ?? '');
    if (!code || await prisma.academicCohort.findUnique({ where: { code } }) || !await prisma.academicProgram.findUnique({ where: { id: programId } })) continue;
    await prisma.academicCohort.create({ data: {
      id: String(cohort.id ?? undefined), code, programId,
      startDate: new Date(String(cohort.startDate)), endDate: new Date(String(cohort.endDate)),
      maxCapacity: Number(cohort.maxCapacity) || 0, status: String(cohort.status ?? 'upcoming')
    } });
    imported += 1;
  }

  const profilesRaw = parseBucket(buckets.sihub_demo_student_profiles_v1);
  const profiles = Array.isArray(profilesRaw) ? rowsOf(profilesRaw) : profilesRaw && typeof profilesRaw === 'object' ? Object.values(profilesRaw as Record<string, unknown>).filter(value => value && typeof value === 'object') as Record<string, unknown>[] : [];
  for (const profile of profiles) {
    const userId = await resolveUser(profile.email, profile.studentId);
    if (!userId) continue;
    await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, phone: String(profile.phone ?? ''), bio: String(profile.bio ?? ''), regionalHub: String(profile.regionalHub ?? ''), academicGoals: Array.isArray(profile.academicGoals) ? profile.academicGoals.map(String) : [], preferredLanguage: String(profile.preferredLanguage ?? 'English'), emailNotifications: Boolean(profile.emailNotifications ?? true), smsAlerts: Boolean(profile.smsAlerts ?? false) },
      update: {}
    });
    imported += 1;
  }
  return imported;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const inputPath = process.argv.find(arg => arg !== '--apply' && !arg.startsWith('-'));
  if (!inputPath) throw new Error('Usage: npm run db:import-legacy -- /path/to/sihub-local-data.json [--apply]');
  const absolutePath = path.resolve(inputPath);
  const parsed = JSON.parse(await fs.readFile(absolutePath, 'utf8')) as Record<string, unknown>;
  const source = parsed.format === 'sihub-localstorage-export-v1' && parsed.buckets && typeof parsed.buckets === 'object'
    ? parsed.buckets as Record<string, unknown>
    : parsed;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Legacy export must contain an object of localStorage key/value pairs');
  const recordCount = Object.values(source).reduce<number>((total, raw) => {
    const value = parseBucket(raw);
    return total + (Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0);
  }, 0);
  if (!apply) {
    console.info(`Dry run: ${Object.keys(source).length} buckets and ${recordCount} candidate records found. No database connection or write was made.`);
    console.info('Review the export locally, then rerun with --apply against a safe local database to snapshot and import supported records.');
    return;
  }

  let snapshots = 0;
  let imported = 0;
  for (const [sourceKey, raw] of Object.entries(source)) {
    const checksum = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
    await prisma.legacySnapshot.upsert({
      where: { sourceKey_checksum: { sourceKey, checksum } },
      create: { sourceKey, checksum, payload: raw as Prisma.InputJsonValue },
      update: {}
    });
    snapshots += 1;
    const value = parseBucket(raw);
    if (sourceKey === 'sihub_demo_courses_v1') imported += await importCourses(value);
    else if (sourceKey === 'sihub_demo_visit_requests_v1') imported += await importVisitorRequests(value, parseBucket(source.sihub_demo_visitor_passes_v1));
    else if (submissionTypes[sourceKey]) imported += await importSubmissions(submissionTypes[sourceKey], sourceKey, value);
    else if (cmsTypes[sourceKey]) imported += await importCms(cmsTypes[sourceKey], value);
  }
  imported += await importEducationCatalog(source);
  console.info(`Preserved ${snapshots} source buckets and imported ${imported} safely reconciled course, CMS, submission, academic catalog, and profile records.`);
  console.info('Unmatched student identities and unsupported education records remain preserved in LegacySnapshot for manual reconciliation.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
