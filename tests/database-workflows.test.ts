import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';

const integrationDatabaseUrl = process.env.SIHUB_INTEGRATION_DATABASE_URL;

test('local database persists authentication, CMS, education, and visitor workflows', { skip: !integrationDatabaseUrl }, async context => {
  if (!integrationDatabaseUrl) return;
  const parsedDatabaseUrl = new URL(integrationDatabaseUrl);
  if (!['localhost', '127.0.0.1', '::1'].includes(parsedDatabaseUrl.hostname) || !/_test(?:$|\?)/.test(parsedDatabaseUrl.pathname.slice(1))) {
    throw new Error('SIHUB_INTEGRATION_DATABASE_URL must point to a loopback database whose name ends in _test.');
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = integrationDatabaseUrl;
  process.env.DIRECT_URL = integrationDatabaseUrl;
  process.env.SESSION_SECRET = 'integration-test-only-session-secret-never-use-in-production';

  const [{ app }, { prisma }, { Role }, { hashPassword }] = await Promise.all([
    import('../server/app'),
    import('../server/db'),
    import('@prisma/client'),
    import('../server/auth/password')
  ]);
  const suffix = randomUUID();
  const ownerEmail = `integration-owner-${suffix}@example.test`;
  const studentEmail = `integration-student-${suffix}@example.test`;
  const ownerPassword = 'Integration-owner-password-123!';
  const studentPassword = 'Integration-student-password-123!';
  const courseSlug = `integration-course-${suffix}`;
  const pageSlug = `integration-page-${suffix}`;
  const ownedUserIds: string[] = [];
  const submissionReferences: string[] = [];
  const cmsEntryIds: string[] = [];
  const courseIds: string[] = [];

  const owner = await prisma.user.create({
    data: { email: ownerEmail, fullName: 'Integration Owner', passwordHash: await hashPassword(ownerPassword), role: Role.OWNER }
  });
  ownedUserIds.push(owner.id);

  let server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  let baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const createClient = () => {
    const cookies = new Map<string, string>();
    const cookieHeader = () => [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    const saveCookies = (response: Response) => {
      for (const header of response.headers.getSetCookie()) {
        const pair = header.split(';', 1)[0];
        const separator = pair.indexOf('=');
        if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
    };

    return async (path: string, init: RequestInit = {}) => {
      const method = (init.method ?? 'GET').toUpperCase();
      const headers = new Headers(init.headers);
      if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { headers: cookieHeader() ? { cookie: cookieHeader() } : {} });
        saveCookies(csrfResponse);
        const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
        headers.set('x-csrf-token', csrfToken);
      }
      if (cookieHeader()) headers.set('cookie', cookieHeader());
      const response = await fetch(`${baseUrl}${path}`, { ...init, method, headers });
      saveCookies(response);
      const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
      return { response, body };
    };
  };

  const ownerRequest = createClient();
  const studentRequest = createClient();

  context.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    try {
      await prisma.submission.deleteMany({ where: { referenceCode: { in: submissionReferences } } });
      await prisma.cmsEntry.deleteMany({ where: { id: { in: cmsEntryIds } } });
      await prisma.certificate.deleteMany({ where: { courseId: { in: courseIds } } });
      await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
      await prisma.auditLog.deleteMany({ where: { actorId: { in: ownedUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: ownedUserIds } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  const ownerLogin = await ownerRequest('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email: ownerEmail, password: ownerPassword })
  });
  assert.equal(ownerLogin.response.status, 200);
  const ownerSession = await ownerRequest('/api/auth/me');
  assert.equal(ownerSession.response.status, 200);
  assert.equal(ownerSession.body.user.role, 'OWNER');

  const registration = await studentRequest('/api/auth/register', {
    method: 'POST', body: JSON.stringify({ email: studentEmail, fullName: 'Integration Student', password: studentPassword })
  });
  assert.equal(registration.response.status, 201);
  const studentId = registration.body.user.id as string;
  ownedUserIds.push(studentId);
  assert.equal((await studentRequest('/api/auth/me')).body.user.role, 'STUDENT');
  assert.equal((await studentRequest('/api/admin/users')).response.status, 403);

  const createdPage = await ownerRequest('/api/cms/admin', {
    method: 'POST',
    body: JSON.stringify({ type: 'page', slug: pageSlug, title: 'Integration page', content: { heading: 'First version' } })
  });
  assert.equal(createdPage.response.status, 201);
  const pageId = createdPage.body.entry.id as string;
  cmsEntryIds.push(pageId);
  const editedPage = await ownerRequest(`/api/cms/admin/${pageId}`, {
    method: 'PATCH', body: JSON.stringify({ content: { heading: 'Published version' } })
  });
  assert.equal(editedPage.response.status, 200);
  assert.equal((await ownerRequest(`/api/cms/admin/${pageId}/revisions`)).body.revisions.length, 1);
  for (const status of ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED']) {
    const result = await ownerRequest(`/api/cms/admin/${pageId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    assert.equal(result.response.status, 200);
  }
  const publicPage = await ownerRequest(`/api/cms/page/${pageSlug}`);
  assert.equal(publicPage.body.entry.content.heading, 'Published version');
  const pageRevisions = await ownerRequest(`/api/cms/admin/${pageId}/revisions`);
  const originalRevision = pageRevisions.body.revisions[pageRevisions.body.revisions.length - 1];
  const restoredRevision = await ownerRequest(`/api/cms/admin/${pageId}/revisions/${originalRevision.id}/restore`, { method: 'POST' });
  assert.equal(restoredRevision.response.status, 200);
  assert.equal(restoredRevision.body.entry.content.heading, 'First version');
  assert.equal((await ownerRequest(`/api/cms/admin/${pageId}`, { method: 'DELETE' })).response.status, 204);
  const restoredPage = await ownerRequest(`/api/cms/admin/${pageId}/restore`, { method: 'POST' });
  assert.equal(restoredPage.response.status, 200);
  assert.equal(restoredPage.body.entry.status, 'DRAFT');

  const createdCourse = await ownerRequest('/api/education/manage/courses', {
    method: 'POST',
    body: JSON.stringify({ slug: courseSlug, title: 'Integration course', category: 'Test', description: 'Local persistence integration test', level: 'Beginner' })
  });
  assert.equal(createdCourse.response.status, 201);
  const courseId = createdCourse.body.course.id as string;
  courseIds.push(courseId);
  const createdModule = await ownerRequest(`/api/education/manage/courses/${courseId}/modules`, {
    method: 'POST', body: JSON.stringify({ title: 'Module 1', position: 0 })
  });
  assert.equal(createdModule.response.status, 201);
  const moduleId = createdModule.body.module.id as string;
  const createdLesson = await ownerRequest(`/api/education/manage/modules/${moduleId}/lessons`, {
    method: 'POST', body: JSON.stringify({ title: 'Lesson 1', lessonType: 'reading', textContent: 'Persistent lesson content.' })
  });
  assert.equal(createdLesson.response.status, 201);
  const lessonId = createdLesson.body.lesson.id as string;
  for (const step of [
    [`/api/education/manage/lessons/${lessonId}/submit`, 'POST', undefined],
    [`/api/education/manage/lessons/${lessonId}/review`, 'PATCH', { decision: 'APPROVED' }],
    [`/api/education/manage/lessons/${lessonId}/publish`, 'POST', undefined],
    [`/api/education/manage/courses/${courseId}/submit`, 'POST', undefined],
    [`/api/education/manage/courses/${courseId}/review`, 'PATCH', { decision: 'APPROVED' }],
    [`/api/education/manage/courses/${courseId}/publish`, 'POST', undefined]
  ] as const) {
    const [path, method, body] = step;
    const result = await ownerRequest(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(result.response.status, 200, `${method} ${path}: ${JSON.stringify(result.body)}`);
  }

  const enrollment = await studentRequest('/api/education/enrollments', {
    method: 'POST', body: JSON.stringify({ courseId, motivation: 'This is a local integration test enrollment.' })
  });
  assert.equal(enrollment.response.status, 201);
  const enrollmentId = enrollment.body.enrollment.id as string;
  const approvedEnrollment = await ownerRequest(`/api/education/manage/enrollments/${enrollmentId}`, {
    method: 'PATCH', body: JSON.stringify({ decision: 'APPROVED' })
  });
  assert.equal(approvedEnrollment.response.status, 200);
  const learning = await studentRequest('/api/education/me/courses');
  assert.equal(learning.response.status, 200);
  assert.equal(learning.body.courses[0].course.modules[0].lessons[0].title, 'Lesson 1');
  const progress = await studentRequest('/api/education/progress', {
    method: 'POST', body: JSON.stringify({ lessonId, completed: true })
  });
  assert.equal(progress.response.status, 200);
  assert.ok(progress.body.progress.completedAt);

  const assignment = await ownerRequest('/api/education/manage/assignments', {
    method: 'POST',
    body: JSON.stringify({ courseId, title: 'Integration assignment', description: 'Complete the local test assignment.', dueDate: '2026-12-01T00:00:00.000Z', maxScore: 100, weightPercent: 0 })
  });
  assert.equal(assignment.response.status, 201);
  const assignmentId = assignment.body.assignment.id as string;
  assert.equal((await ownerRequest(`/api/education/manage/assignments/${assignmentId}/submit`, { method: 'POST' })).response.status, 200);
  assert.equal((await ownerRequest(`/api/education/manage/assignments/${assignmentId}/review`, { method: 'PATCH', body: JSON.stringify({ decision: 'APPROVED' }) })).response.status, 200);
  assert.equal((await ownerRequest(`/api/education/manage/assignments/${assignmentId}/publish`, { method: 'POST' })).response.status, 200);
  const assignmentList = await studentRequest('/api/education/me/assignments');
  assert.equal(assignmentList.response.status, 200);
  const assignmentSubmission = await studentRequest(`/api/education/assignments/${assignmentId}/submissions`, {
    method: 'POST', body: JSON.stringify({ content: 'Persisted integration answer.' })
  });
  assert.equal(assignmentSubmission.response.status, 201);
  const grade = await ownerRequest(`/api/education/manage/assignment-submissions/${assignmentSubmission.body.submission.id}/grade`, {
    method: 'PATCH', body: JSON.stringify({ score: 90, feedback: 'Integration feedback.', status: 'GRADED' })
  });
  assert.equal(grade.response.status, 200);

  const exam = await ownerRequest('/api/education/manage/exams', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      title: 'Integration exam',
      durationMinutes: 10,
      totalMarks: 60,
      passingMarks: 40,
      questions: [{ id: 'q1', question: 'Select the correct answer.', options: ['Correct', 'Incorrect'], correctAnswerIndex: 0 }]
    })
  });
  assert.equal(exam.response.status, 201);
  const examId = exam.body.exam.id as string;
  const invalidExamUpdate = await ownerRequest(`/api/education/manage/exams/${examId}`, {
    method: 'PATCH', body: JSON.stringify({ totalMarks: 30 })
  });
  assert.equal(invalidExamUpdate.response.status, 400);
  assert.equal((await ownerRequest(`/api/education/manage/exams/${examId}/submit`, { method: 'POST' })).response.status, 200);
  assert.equal((await ownerRequest(`/api/education/manage/exams/${examId}/review`, { method: 'PATCH', body: JSON.stringify({ decision: 'APPROVED' }) })).response.status, 200);
  assert.equal((await ownerRequest(`/api/education/manage/exams/${examId}/publish`, { method: 'POST' })).response.status, 200);
  const publicExam = await studentRequest('/api/education/me/exams');
  assert.equal(publicExam.response.status, 200);
  assert.equal('correctAnswerIndex' in publicExam.body.exams[0].questions[0], false);
  const examAttempt = await studentRequest(`/api/education/exams/${examId}/attempt`, {
    method: 'POST', body: JSON.stringify({ answers: { q1: 0 } })
  });
  assert.equal(examAttempt.response.status, 200);
  assert.equal(examAttempt.body.result.score, 60);

  const attendance = await ownerRequest('/api/education/manage/attendance', {
    method: 'POST',
    body: JSON.stringify({ courseId, sessionDate: '2026-11-07T00:00:00.000Z', topic: 'Integration session', studentId, status: 'PRESENT' })
  });
  assert.equal(attendance.response.status, 201);
  const certificate = await ownerRequest('/api/education/manage/certificates', {
    method: 'POST', body: JSON.stringify({ studentId, courseId, grade: 'Completed' })
  });
  assert.equal(certificate.response.status, 201);
  const certificateCheck = await ownerRequest(`/api/education/certificates/verify/${certificate.body.certificate.certificateNumber}`);
  assert.equal(certificateCheck.response.status, 200);
  assert.equal(certificateCheck.body.certificate.student.fullName, 'Integration Student');

  const topic = await ownerRequest('/api/cms/admin', {
    method: 'POST',
    body: JSON.stringify({ type: 'community-topic', slug: `integration-topic-${suffix}`, title: 'Integration topic', content: { title: 'Integration topic', author: 'Integration Student' } })
  });
  assert.equal(topic.response.status, 201);
  const topicId = topic.body.entry.id as string;
  cmsEntryIds.push(topicId);
  for (const status of ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED']) {
    const result = await ownerRequest(`/api/cms/admin/${topicId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    assert.equal(result.response.status, 200);
  }
  const reaction = await studentRequest(`/api/community/topics/${topicId}/reactions`, { method: 'POST' });
  assert.equal(reaction.response.status, 200);
  assert.equal(reaction.body.count, 1);
  assert.equal((await studentRequest(`/api/community/topics/${topicId}/reactions`, { method: 'DELETE' })).body.count, 0);

  const eventEntry = await ownerRequest('/api/cms/admin', {
    method: 'POST',
    body: JSON.stringify({ type: 'event', slug: `integration-event-${suffix}`, title: 'Integration event', content: { capacity: 1 } })
  });
  assert.equal(eventEntry.response.status, 201);
  const eventId = eventEntry.body.entry.id as string;
  cmsEntryIds.push(eventId);
  for (const status of ['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED']) {
    const result = await ownerRequest(`/api/cms/admin/${eventId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    assert.equal(result.response.status, 200);
  }
  const eventRegistration = await studentRequest('/api/submissions/event-registration', {
    method: 'POST',
    body: JSON.stringify({ payload: { eventId, eventTitle: 'Integration event', fullName: 'Integration Student', email: studentEmail } })
  });
  assert.equal(eventRegistration.response.status, 201);
  submissionReferences.push(eventRegistration.body.submission.referenceCode as string);
  const overCapacityRegistration = await studentRequest('/api/submissions/event-registration', {
    method: 'POST',
    body: JSON.stringify({ payload: { eventId, eventTitle: 'Integration event', fullName: 'Another Attendee', email: `another-${suffix}@example.test` } })
  });
  assert.equal(overCapacityRegistration.response.status, 409);
  const eventApproval = await ownerRequest(`/api/admin/submissions/${eventRegistration.body.submission.id}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' })
  });
  assert.equal(eventApproval.response.status, 200);
  const eventCheckIn = await ownerRequest(`/api/admin/submissions/${eventRegistration.body.submission.id}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' })
  });
  assert.equal(eventCheckIn.response.status, 200);

  const unavailableStorage = await ownerRequest('/api/media/presign', {
    method: 'POST', body: JSON.stringify({ filename: 'test.png', contentType: 'image/png', byteSize: 100 })
  });
  assert.equal(unavailableStorage.response.status, 503);

  const visitorRequest = await studentRequest('/api/submissions/visitor-request', {
    method: 'POST',
    body: JSON.stringify({ payload: { fullName: 'Integration Visitor', email: studentEmail, requestedDate: '2026-12-01', hubLocation: 'Integration Test Hub' } })
  });
  assert.equal(visitorRequest.response.status, 201);
  const visitorReference = visitorRequest.body.submission.referenceCode as string;
  submissionReferences.push(visitorReference);
  const visitorReview = await ownerRequest(`/api/admin/submissions/${visitorRequest.body.submission.id}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'APPROVED', reviewData: { assignedHost: 'Integration Desk' } })
  });
  assert.equal(visitorReview.response.status, 200);
  const tracking = await studentRequest(`/api/visitor/track/${visitorReference}?email=${encodeURIComponent(studentEmail)}`);
  assert.equal(tracking.response.status, 200);
  const issuedPass = tracking.body.request.payload.visitorPass;
  assert.ok(issuedPass.passNumber);
  const verification = await studentRequest(`/api/visitor/pass/${encodeURIComponent(issuedPass.passNumber)}?code=${encodeURIComponent(issuedPass.securityClearanceCode)}`);
  assert.equal(verification.response.status, 200);
  assert.equal(verification.body.pass.fullName, 'Integration Visitor');
  assert.equal('securityClearanceCode' in verification.body.pass, false);

  const contact = await studentRequest('/api/submissions/contact-message', {
    method: 'POST', body: JSON.stringify({ payload: { name: 'Integration Student', email: studentEmail, message: 'Local integration workflow.' } })
  });
  assert.equal(contact.response.status, 201);
  submissionReferences.push(contact.body.submission.referenceCode as string);
  const rejectedContact = await ownerRequest(`/api/admin/submissions/${contact.body.submission.id}`, {
    method: 'PATCH', body: JSON.stringify({ status: 'REJECTED', reason: 'Integration review note.' })
  });
  assert.equal(rejectedContact.response.status, 200);
  const ownContacts = await studentRequest('/api/submissions/mine?type=contact-message');
  assert.equal(ownContacts.body.submissions[0].payload.rejectionReason, 'Integration review note.');

  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  assert.equal((await ownerRequest('/api/auth/me')).body.user.role, 'OWNER');
  const persistedCourses = await studentRequest('/api/education/me/courses');
  assert.equal(persistedCourses.response.status, 200);
  assert.equal(persistedCourses.body.courses[0].course.id, courseId);

  const logout = await ownerRequest('/api/auth/logout', { method: 'POST' });
  assert.equal(logout.response.status, 204);
  assert.equal((await ownerRequest('/api/auth/me')).response.status, 401);
});