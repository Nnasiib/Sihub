import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';

type Course = { id: string; title: string; status: string };
type Student = { id: string; fullName: string; email: string };
type Assignment = { id: string; courseId: string; title: string; description: string; dueDate: string; maxScore: number; status: string };
type AssignmentSubmission = { id: string; content: string; attachmentAssetId: string | null; score: number | null; feedback: string | null; status: string; assignment: { id: string; title: string; maxScore: number; courseId: string }; student: { fullName: string } };
type Exam = { id: string; courseId: string; title: string; status: string };
type Attendance = { id: string; topic: string; status: string; sessionDate: string; course: { title: string }; student: { fullName: string } };

export const TeacherPortal: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [courseId, setCourseId] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDue, setAssignmentDue] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examQuestions, setExamQuestions] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (preferredCourseId = courseId) => {
    setLoading(true);
    try {
      const courseResult = await apiGet<{ courses: Course[] }>('/api/education/manage/courses');
      const selectedId = preferredCourseId || courseResult.courses[0]?.id || '';
      setCourses(courseResult.courses);
      setCourseId(selectedId);
      if (!selectedId) {
        setStudents([]); setAssignments([]); setSubmissions([]); setExams([]); setAttendance([]);
        setError(''); return;
      }
      const [studentResult, assignmentResult, submissionResult, examResult, attendanceResult] = await Promise.all([
        apiGet<{ students: Student[] }>(`/api/education/manage/course-students?courseId=${encodeURIComponent(selectedId)}`),
        apiGet<{ assignments: Assignment[] }>(`/api/education/manage/assignments?courseId=${encodeURIComponent(selectedId)}`),
        apiGet<{ submissions: AssignmentSubmission[] }>(`/api/education/manage/assignment-submissions?courseId=${encodeURIComponent(selectedId)}`),
        apiGet<{ exams: Exam[] }>(`/api/education/manage/exams?courseId=${encodeURIComponent(selectedId)}`),
        apiGet<{ records: Attendance[] }>(`/api/education/manage/attendance?courseId=${encodeURIComponent(selectedId)}`)
      ]);
      setStudents(studentResult.students);
      setAssignments(assignmentResult.assignments);
      setSubmissions(submissionResult.submissions);
      setExams(examResult.exams);
      setAttendance(attendanceResult.records);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load instructor records.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(''); }, []);

  const perform = async (operation: () => Promise<unknown>) => {
    try { setError(''); await operation(); await load(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'The update failed.'); }
  };

  const openAttachment = async (assetId: string) => {
    try {
      const result = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(assetId)}/download`);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to open this student attachment.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Instructor workspace</span><h1 className="mt-1 text-2xl font-extrabold text-slate-900">Teaching and coursework</h1><p className="mt-1 text-xs text-slate-600">Only courses assigned to your authenticated account are available.</p></div>
        <select value={courseId} onChange={event => void load(event.target.value)} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"><option value="">Select course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
      </header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {loading && <p className="text-xs text-slate-500">Loading course records…</p>}
      {!loading && !courses.length && <p className="border-y border-slate-200 py-8 text-center text-sm text-slate-500">No courses are assigned to your account.</p>}
      {!!courseId && <>
        <section className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={event => { event.preventDefault(); void perform(() => apiPost('/api/education/manage/assignments', { courseId, title: assignmentTitle, description: assignmentDescription, dueDate: new Date(assignmentDue).toISOString(), maxScore: 100, weightPercent: 0 })); }} className="space-y-2 border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Create assignment draft</h2><input required value={assignmentTitle} onChange={event => setAssignmentTitle(event.target.value)} placeholder="Assignment title" className="w-full rounded border border-slate-300 p-2 text-xs" /><textarea required value={assignmentDescription} onChange={event => setAssignmentDescription(event.target.value)} placeholder="Instructions" className="w-full rounded border border-slate-300 p-2 text-xs" /><input required type="datetime-local" value={assignmentDue} onChange={event => setAssignmentDue(event.target.value)} className="rounded border border-slate-300 p-2 text-xs" /><button className="rounded bg-indigo-700 px-3 py-2 text-[10px] font-bold text-white">Save draft</button>
          </form>
          <form onSubmit={event => { event.preventDefault(); void perform(async () => { const questions = JSON.parse(examQuestions) as unknown; await apiPost('/api/education/manage/exams', { courseId, title: examTitle, durationMinutes: 0, totalMarks: 100, passingMarks: 60, questions }); }); }} className="space-y-2 border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Create exam draft</h2><input required value={examTitle} onChange={event => setExamTitle(event.target.value)} placeholder="Exam title" className="w-full rounded border border-slate-300 p-2 text-xs" /><textarea required rows={5} value={examQuestions} onChange={event => setExamQuestions(event.target.value)} placeholder='[{"id":"q1","question":"Question text","options":["A","B"],"correctAnswerIndex":0}]' aria-label="Exam questions JSON" className="w-full rounded border border-slate-300 p-2 font-mono text-[10px]" /><button className="rounded bg-indigo-700 px-3 py-2 text-[10px] font-bold text-white">Save draft</button>
          </form>
        </section>
        <section className="space-y-2"><h2 className="text-sm font-bold text-slate-900">Assignments and review</h2>{assignments.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3 text-xs"><span className="text-slate-900">{item.title} · due {new Date(item.dueDate).toLocaleDateString()} · {item.status}</span>{['DRAFT', 'REJECTED'].includes(item.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/assignments/${item.id}/submit`))} className="text-indigo-700">Submit for approval</button>}</article>)}</section>
        <section className="space-y-2"><h2 className="text-sm font-bold text-slate-900">Submissions to grade</h2>{submissions.map(item => <article key={item.id} className="grid gap-3 border border-slate-200 bg-white p-3 text-xs md:grid-cols-[1fr_auto]"><div><strong className="text-slate-900">{item.student.fullName} · {item.assignment.title}</strong><p className="mt-1 whitespace-pre-wrap text-slate-600">{item.content}</p><p className="mt-1 text-slate-500">{item.status}{item.score !== null ? ` · ${item.score}/${item.assignment.maxScore}` : ''}</p>{item.attachmentAssetId && <button onClick={() => void openAttachment(item.attachmentAssetId!)} className="mt-1 font-semibold text-indigo-700">Open student attachment</button>}</div><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const status = String(data.get('status')); const score = String(data.get('score')); void perform(() => apiPatch(`/api/education/manage/assignment-submissions/${item.id}/grade`, { ...(score ? { score: Number(score) } : {}), feedback: String(data.get('feedback') || ''), status })); }} className="flex flex-wrap items-start gap-1"><select name="status" defaultValue="GRADED" aria-label="Submission decision" className="rounded border border-slate-300 p-1"><option value="GRADED">Grade</option><option value="RESUBMIT_REQUESTED">Request revision</option></select><input name="score" type="number" min="0" max={item.assignment.maxScore} defaultValue={item.score ?? ''} aria-label="Score" className="w-20 rounded border border-slate-300 p-1" /><input name="feedback" placeholder="Feedback" className="w-36 rounded border border-slate-300 p-1" /><button className="font-bold text-indigo-700">Save</button></form></article>)}</section>
        <section className="space-y-2"><h2 className="text-sm font-bold text-slate-900">Exams</h2>{exams.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3 text-xs"><span>{item.title} · {item.status}</span>{['DRAFT', 'REJECTED'].includes(item.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/exams/${item.id}/submit`))} className="text-indigo-700">Submit for approval</button>}</article>)}</section>
        <section className="space-y-2"><h2 className="text-sm font-bold text-slate-900">Record attendance</h2><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void perform(() => apiPost('/api/education/manage/attendance', { courseId, sessionDate: new Date(String(data.get('sessionDate'))).toISOString(), topic: String(data.get('topic')), studentId: String(data.get('studentId')), status: String(data.get('status')).toUpperCase() })); }} className="flex flex-wrap gap-2 border border-slate-200 bg-white p-3"><select required name="studentId" className="rounded border border-slate-300 p-2 text-xs"><option value="">Student</option>{students.map(student => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select><input required type="date" name="sessionDate" className="rounded border border-slate-300 p-2 text-xs" /><input required name="topic" placeholder="Topic" className="rounded border border-slate-300 p-2 text-xs" /><select name="status" className="rounded border border-slate-300 p-2 text-xs"><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></select><button className="rounded bg-indigo-700 px-3 py-2 text-[10px] font-bold text-white">Save</button></form>{attendance.map(item => <p key={item.id} className="text-[10px] text-slate-500">{item.student.fullName} · {item.status} · {item.topic} · {new Date(item.sessionDate).toLocaleDateString()}</p>)}</section>
      </>}
    </div>
  );
};
