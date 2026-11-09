import React, { useEffect, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import { apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';

type Course = { id: string; title: string; category: string; description: string; level: string };
type Enrollment = { id: string; courseId: string; status: string; motivation: string; rejectionReason: string | null; course: { id: string; title: string; category: string; status: string }; cohort: { code: string } | null };
type Profile = { phone: string; bio: string; regionalHub: string; academicGoals: string[]; preferredLanguage: string; emailNotifications: boolean; smsAlerts: boolean };
type Assignment = { id: string; title: string; description: string; dueDate: string; maxScore: number; submissions: { id: string; content: string; attachmentAssetId: string | null; status: string; score: number | null; feedback: string | null }[] };
type Exam = { id: string; title: string; durationMinutes: number; totalMarks: number; questions: { id: string; question: string; options: string[] }[] };
type ExamResult = { id: string; score: number; totalMarks: number; percentage: number; grade: string; exam: { id: string; title: string; course: { title: string } } };
type Attendance = { id: string; sessionDate: string; topic: string; status: string; course: { title: string } };
type Certificate = { id: string; certificateNumber: string; grade: string; course: { title: string } };

export const StudentPortal: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [profile, setProfile] = useState<Profile>({ phone: '', bio: '', regionalHub: '', academicGoals: [], preferredLanguage: 'English', emailNotifications: true, smsAlerts: false });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [motivation, setMotivation] = useState<Record<string, string>>({});
  const [assignmentWork, setAssignmentWork] = useState<Record<string, string>>({});
  const [assignmentAttachments, setAssignmentAttachments] = useState<Record<string, string>>({});
  const [examAnswers, setExamAnswers] = useState<Record<string, Record<string, number>>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [courseResult, enrollmentResult, profileResult, assignmentResult, examResult, examResultsResult, attendanceResult, certificateResult] = await Promise.all([
        apiGet<{ courses: Course[] }>('/api/education/courses'),
        apiGet<{ enrollments: Enrollment[] }>('/api/education/me/enrollments'),
        apiGet<{ profile: Profile | null }>('/api/education/profile'),
        apiGet<{ assignments: Assignment[] }>('/api/education/me/assignments'),
        apiGet<{ exams: Exam[] }>('/api/education/me/exams'),
        apiGet<{ results: ExamResult[] }>('/api/education/me/exam-results'),
        apiGet<{ records: Attendance[] }>('/api/education/me/attendance'),
        apiGet<{ certificates: Certificate[] }>('/api/education/me/certificates')
      ]);
      setCourses(courseResult.courses);
      setEnrollments(enrollmentResult.enrollments);
      setMotivation(Object.fromEntries(enrollmentResult.enrollments.map(item => [item.courseId, item.motivation])));
      if (profileResult.profile) setProfile(profileResult.profile);
      setAssignments(assignmentResult.assignments);
      setAssignmentWork(Object.fromEntries(assignmentResult.assignments.flatMap(item => item.submissions[0] ? [[item.id, item.submissions[0].content]] : [])));
      setAssignmentAttachments(Object.fromEntries(assignmentResult.assignments.flatMap(item => item.submissions[0]?.attachmentAssetId ? [[item.id, item.submissions[0].attachmentAssetId]] : [])));
      setExams(examResult.exams);
      setExamResults(examResultsResult.results);
      setAttendance(attendanceResult.records);
      setCertificates(certificateResult.certificates);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load your education records.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const perform = async (operation: () => Promise<unknown>, message: string) => {
    try { setError(''); setNotice(''); await operation(); setNotice(message); await load(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'The update failed.'); }
  };

  const uploadAssignmentAttachment = async (assignmentId: string, file?: File) => {
    if (!file) return;
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type) || file.size <= 0 || file.size > 25 * 1024 * 1024) {
      setError('Choose a PDF, JPEG, PNG, or WebP file smaller than 25 MB.');
      return;
    }
    try {
      setError('');
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', { filename: file.name, contentType: file.type, byteSize: file.size });
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!response.ok) throw new Error('The attachment could not be uploaded.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);
      setAssignmentAttachments(current => ({ ...current, [assignmentId]: upload.assetId }));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Unable to upload the assignment attachment.');
    }
  };

  const openAttachment = async (assetId: string) => {
    try {
      const result = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(assetId)}/download`);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to open the assignment attachment.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5"><span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">SiHub Institute · Student Portal</span><h1 className="mt-1 text-3xl font-extrabold text-slate-900">My academic records</h1><p className="mt-2 text-sm text-slate-600">Course access, submissions, assessments and profile data load from your SiHub account.</p></header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}{notice && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}{loading && <p className="text-xs text-slate-500">Loading your records…</p>}
      <section className="grid gap-3 sm:grid-cols-3"><div className="border border-slate-200 bg-white p-4"><span className="text-xs text-slate-500">Course applications</span><strong className="mt-1 block text-2xl text-slate-900">{enrollments.length}</strong></div><div className="border border-slate-200 bg-white p-4"><span className="text-xs text-slate-500">Assignments</span><strong className="mt-1 block text-2xl text-slate-900">{assignments.length}</strong></div><div className="border border-slate-200 bg-white p-4"><span className="text-xs text-slate-500">Certificates</span><strong className="mt-1 block text-2xl text-slate-900">{certificates.length}</strong></div></section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">My course applications</h2>{enrollments.map(item => <article key={item.id} className="border border-slate-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{item.course.title}</strong><span className="text-[10px] font-bold uppercase text-cyan-700">{item.status}</span></div>{item.rejectionReason && <p className="mt-2 text-xs text-rose-700">{item.rejectionReason}</p>}</article>)}{!loading && !enrollments.length && <p className="text-xs text-slate-500">You have not applied to a course.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Published courses</h2>{courses.map(course => {
        const existing = enrollments.find(item => item.courseId === course.id);
        return <article key={course.id} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-900">{course.title}</strong><span className="text-[10px] text-slate-500">{course.category} · {course.level}</span></div><p className="mt-1 text-xs text-slate-600">{course.description}</p></div>{existing && existing.status !== 'REJECTED' ? <span className="self-center text-xs font-semibold text-slate-600">{existing.status}</span> : <form onSubmit={event => { event.preventDefault(); void perform(() => apiPost('/api/education/enrollments', { courseId: course.id, motivation: motivation[course.id] }), existing ? 'Updated application submitted for administrator review.' : 'Application submitted for administrator review.'); }} className="flex min-w-64 flex-col gap-2">{existing?.rejectionReason && <p className="text-xs text-rose-700">Previous decision: {existing.rejectionReason}</p>}<textarea required minLength={20} value={motivation[course.id] || ''} onChange={event => setMotivation(current => ({ ...current, [course.id]: event.target.value }))} placeholder="Why are you applying?" className="rounded border border-slate-300 p-2 text-xs" /><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">{existing ? 'Resubmit application' : 'Apply'}</button></form>}</article>;
      })}</section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Assignments</h2>
        {assignments.map(item => {
          const submission = item.submissions[0];
          const canResubmit = submission?.status === 'RESUBMIT_REQUESTED';
          return <article key={item.id} className="space-y-2 border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{item.title}</strong><span className="text-[10px] text-slate-500">Due {new Date(item.dueDate).toLocaleString()} · Max {item.maxScore}</span></div>
            <p className="text-xs text-slate-600">{item.description}</p>
            {submission && <div className="space-y-1 text-xs text-slate-700">
              <p>Status: {submission.status}{submission.score !== null ? ` · Score ${submission.score}` : ''}{submission.feedback ? ` · ${submission.feedback}` : ''}</p>
              {submission.attachmentAssetId && <button onClick={() => void openAttachment(submission.attachmentAssetId!)} className="inline-flex items-center gap-1 font-semibold text-cyan-700"><Download className="h-3.5 w-3.5" />View submitted attachment</button>}
            </div>}
            {(!submission || canResubmit) && <form onSubmit={event => { event.preventDefault(); void perform(() => apiPost(`/api/education/assignments/${item.id}/submissions`, { content: assignmentWork[item.id], attachmentAssetId: assignmentAttachments[item.id] || undefined }), 'Assignment submitted to your instructor.'); }} className="space-y-2">
              {canResubmit && <p className="text-xs font-semibold text-amber-700">Your instructor requested a revision. Update your work and submit it again.</p>}
              <textarea required minLength={1} value={assignmentWork[item.id] || ''} onChange={event => setAssignmentWork(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Your response" className="w-full rounded border border-slate-300 p-2 text-xs" />
              <label className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><FileUp className="h-4 w-4" />Attach PDF or image (optional)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => { void uploadAssignmentAttachment(item.id, event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} className="min-w-0 text-[10px]" /></label>
              {assignmentAttachments[item.id] && <span className="block text-[10px] text-emerald-700">Verified attachment selected.</span>}
              <button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">{canResubmit ? 'Resubmit assignment' : 'Submit assignment'}</button>
            </form>}
          </article>;
        })}
        {!loading && !assignments.length && <p className="text-xs text-slate-500">No published assignments for your approved courses.</p>}
      </section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Exams</h2>{exams.map(exam => { const result = examResults.find(item => item.exam.id === exam.id); return <article key={exam.id} className="space-y-3 border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">{exam.title}</h3>{exam.questions.map(question => <fieldset key={question.id} className="space-y-1"><legend className="text-xs font-semibold text-slate-800">{question.question}</legend>{question.options.map((option, index) => <label key={index} className="flex gap-2 text-xs text-slate-600"><input type="radio" name={`${exam.id}-${question.id}`} checked={examAnswers[exam.id]?.[question.id] === index} onChange={() => setExamAnswers(current => ({ ...current, [exam.id]: { ...current[exam.id], [question.id]: index } }))} />{option}</label>)}</fieldset>)}{result && <p className="text-xs font-semibold text-emerald-800">Latest result: {result.score}/{result.totalMarks} · {result.percentage}% · {result.grade}</p>}<button onClick={() => void perform(() => apiPost(`/api/education/exams/${exam.id}/attempt`, { answers: examAnswers[exam.id] || {} }), 'Exam submitted and scored.')} className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">{result ? 'Submit new attempt' : 'Submit exam'}</button></article>; })}{!loading && !exams.length && <p className="text-xs text-slate-500">No published exams for your approved courses.</p>}</section>
      <section className="grid gap-5 lg:grid-cols-2"><form onSubmit={event => { event.preventDefault(); void perform(() => apiPatch('/api/education/profile', profile), 'Profile saved to your SiHub account.'); }} className="space-y-2 border border-slate-200 bg-white p-4"><h2 className="text-sm font-bold text-slate-900">Student profile</h2><input value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} placeholder="Phone" className="w-full rounded border border-slate-300 p-2 text-xs" /><textarea value={profile.bio} onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))} placeholder="Biography" className="w-full rounded border border-slate-300 p-2 text-xs" /><input value={profile.regionalHub} onChange={event => setProfile(current => ({ ...current, regionalHub: event.target.value }))} placeholder="Regional hub" className="w-full rounded border border-slate-300 p-2 text-xs" /><label className="block text-xs text-slate-600">Preferred language<select value={profile.preferredLanguage} onChange={event => setProfile(current => ({ ...current, preferredLanguage: event.target.value }))} className="mt-1 block rounded border border-slate-300 p-2"><option>English</option><option>Somali</option></select></label><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Save profile</button></form><div className="space-y-3"><h2 className="text-sm font-bold text-slate-900">Attendance and certificates</h2>{attendance.map(item => <p key={item.id} className="border-b border-slate-200 py-2 text-xs text-slate-600">{item.course.title} · {item.topic} · {item.status} · {new Date(item.sessionDate).toLocaleDateString()}</p>)}{certificates.map(item => <article key={item.id} className="border border-emerald-200 bg-emerald-50 p-3 text-xs"><strong className="text-emerald-900">{item.course.title}</strong><p className="mt-1 font-mono text-emerald-800">{item.certificateNumber} · {item.grade}</p><a href={`/api/education/certificates/verify/${encodeURIComponent(item.certificateNumber)}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-emerald-800 underline">Verify certificate</a></article>)}</div></section>
    </main>
  );
};
