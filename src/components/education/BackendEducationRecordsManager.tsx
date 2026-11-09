import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiRequest, ApiError } from '../../services/apiClient';

type Department = { id: string; code: string; name: string };
type Program = { id: string; code: string; title: string; departmentId: string | null; isActive: boolean; durationWeeks: number; description: string; credits: number };
type Cohort = { id: string; code: string; programId: string; startDate: string; endDate: string; status: string; maxCapacity: number; _count: { enrollments: number } };
type Course = { id: string; title: string; status: string };
type Assignment = { id: string; courseId: string; title: string; description: string; dueDate: string; maxScore: number; weightPercent: number; status: string; course: { title: string } };
type AssignmentSubmission = { id: string; status: string; score: number | null; content: string; student: { fullName: string }; assignment: { title: string; maxScore: number } };
type Exam = { id: string; courseId: string; title: string; status: string; durationMinutes: number; totalMarks: number; passingMarks: number; questions: unknown; course: { title: string } };
type ExamResult = { id: string; score: number; totalMarks: number; grade: string; student: { fullName: string }; exam: { title: string } };
type Student = { id: string; fullName: string; email: string };

export const BackendEducationRecordsManager: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programDurationWeeks, setProgramDurationWeeks] = useState('');
  const [programCredits, setProgramCredits] = useState('');
  const [programDepartmentId, setProgramDepartmentId] = useState('');
  const [cohortCode, setCohortCode] = useState('');
  const [cohortProgramId, setCohortProgramId] = useState('');
  const [cohortStart, setCohortStart] = useState('');
  const [cohortEnd, setCohortEnd] = useState('');
  const [cohortCapacity, setCohortCapacity] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDue, setAssignmentDue] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examQuestions, setExamQuestions] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingExamQuestions, setEditingExamQuestions] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [certificateStudentId, setCertificateStudentId] = useState('');
  const [certificateCourseId, setCertificateCourseId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [departmentResult, programResult, cohortResult, courseResult, assignmentResult, submissionResult, examResult, resultResult, studentResult] = await Promise.all([
        apiGet<{ departments: Department[] }>('/api/education/admin/departments'),
        apiGet<{ programs: Program[] }>('/api/education/admin/programs'),
        apiGet<{ cohorts: Cohort[] }>('/api/education/admin/cohorts'),
        apiGet<{ courses: Course[] }>('/api/education/manage/courses'),
        apiGet<{ assignments: Assignment[] }>('/api/education/manage/assignments'),
        apiGet<{ submissions: AssignmentSubmission[] }>('/api/education/manage/assignment-submissions'),
        apiGet<{ exams: Exam[] }>('/api/education/manage/exams'),
        apiGet<{ results: ExamResult[] }>('/api/education/manage/exam-results'),
        apiGet<{ students: Student[] }>('/api/education/manage/students')
      ]);
      setDepartments(departmentResult.departments);
      setPrograms(programResult.programs);
      setCohorts(cohortResult.cohorts);
      setCourses(courseResult.courses);
      setAssignments(assignmentResult.assignments);
      setSubmissions(submissionResult.submissions);
      setExams(examResult.exams);
      setResults(resultResult.results);
      setStudents(studentResult.students);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load education records from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const perform = async (operation: () => Promise<unknown>) => {
    try {
      setError('');
      await operation();
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Education update failed.');
    }
  };

  const localDateTime = (date: string) => {
    const value = new Date(date);
    return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const saveDepartment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingDepartment) return;
    void perform(async () => {
      await apiPatch(`/api/education/admin/departments/${encodeURIComponent(editingDepartment.id)}`, { code: editingDepartment.code, name: editingDepartment.name });
      setEditingDepartment(null);
    });
  };

  const saveProgram = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProgram) return;
    void perform(async () => {
      await apiPatch(`/api/education/admin/programs/${encodeURIComponent(editingProgram.id)}`, {
        code: editingProgram.code,
        title: editingProgram.title,
        departmentId: editingProgram.departmentId,
        description: editingProgram.description,
        durationWeeks: editingProgram.durationWeeks,
        credits: editingProgram.credits
      });
      setEditingProgram(null);
    });
  };

  const saveAssignment = (event: React.FormEvent<HTMLFormElement>, assignment: Assignment) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(async () => {
      await apiPatch(`/api/education/manage/assignments/${encodeURIComponent(assignment.id)}`, {
        title: String(data.get('title')),
        description: String(data.get('description')),
        dueDate: new Date(String(data.get('dueDate'))).toISOString(),
        maxScore: Number(data.get('maxScore')),
        weightPercent: Number(data.get('weightPercent'))
      });
      setEditingAssignment(null);
    });
  };

  const saveExam = (event: React.FormEvent<HTMLFormElement>, exam: Exam) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void perform(async () => {
      await apiPatch(`/api/education/manage/exams/${encodeURIComponent(exam.id)}`, {
        title: String(data.get('title')),
        durationMinutes: Number(data.get('durationMinutes')),
        totalMarks: Number(data.get('totalMarks')),
        passingMarks: Number(data.get('passingMarks')),
        questions: JSON.parse(editingExamQuestions) as unknown
      });
      setEditingExam(null);
      setEditingExamQuestions('');
    });
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Persistent Education Records</span><h2 className="mt-1 text-xl font-extrabold text-white">Academic operations</h2><p className="mt-1 text-xs text-slate-400">Departments, cohorts, coursework, assessments, attendance and certificates are stored through protected APIs.</p></div>
        <button onClick={() => void load()} disabled={loading} className="rounded border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-50">Refresh</button>
      </header>
      {error && <p role="alert" className="border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      {loading && <p className="text-xs text-slate-400">Loading database records…</p>}

      <section className="grid gap-4 xl:grid-cols-3">
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await apiPost('/api/education/admin/departments', { code: departmentCode, name: departmentName }); setDepartmentCode(''); setDepartmentName(''); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-bold text-white">Add department</h3><input required value={departmentCode} onChange={event => setDepartmentCode(event.target.value)} placeholder="Code" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input required value={departmentName} onChange={event => setDepartmentName(event.target.value)} placeholder="Department name" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Create</button>
        </form>
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await apiPost('/api/education/admin/programs', { code: programCode, title: programTitle, departmentId: programDepartmentId || null, durationWeeks: Number(programDurationWeeks) || 0, description: programDescription, credits: Number(programCredits) || 0 }); setProgramCode(''); setProgramTitle(''); setProgramDescription(''); setProgramDurationWeeks(''); setProgramCredits(''); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-bold text-white">Add academic program</h3><input required value={programCode} onChange={event => setProgramCode(event.target.value)} placeholder="Code" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input required value={programTitle} onChange={event => setProgramTitle(event.target.value)} placeholder="Program title" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><textarea required value={programDescription} onChange={event => setProgramDescription(event.target.value)} placeholder="Program description" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-400">Duration (weeks)<input required type="number" min="0" value={programDurationWeeks} onChange={event => setProgramDurationWeeks(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></label><label className="text-[10px] text-slate-400">Credits<input required type="number" min="0" value={programCredits} onChange={event => setProgramCredits(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></label></div><select value={programDepartmentId} onChange={event => setProgramDepartmentId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">No department</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Create</button>
        </form>
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await apiPost('/api/education/admin/cohorts', { code: cohortCode, programId: cohortProgramId, startDate: new Date(cohortStart).toISOString(), endDate: new Date(cohortEnd).toISOString(), maxCapacity: Number(cohortCapacity) || 0, status: 'upcoming' }); setCohortCode(''); setCohortCapacity(''); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-bold text-white">Add cohort</h3><input required value={cohortCode} onChange={event => setCohortCode(event.target.value)} placeholder="Cohort code" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><select required value={cohortProgramId} onChange={event => setCohortProgramId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select program</option>{programs.filter(item => item.isActive).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><div className="grid grid-cols-2 gap-2"><input required type="date" value={cohortStart} onChange={event => setCohortStart(event.target.value)} className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input required type="date" value={cohortEnd} onChange={event => setCohortEnd(event.target.value)} className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></div><label className="block text-[10px] text-slate-400">Maximum capacity<input required type="number" min="0" value={cohortCapacity} onChange={event => setCohortCapacity(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></label><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Create</button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await apiPost('/api/education/manage/assignments', { courseId: selectedCourseId, title: assignmentTitle, description: assignmentDescription, dueDate: new Date(assignmentDue).toISOString(), maxScore: 100, weightPercent: 0 }); setAssignmentTitle(''); setAssignmentDescription(''); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-bold text-white">Create assignment draft</h3><select required value={selectedCourseId} onChange={event => setSelectedCourseId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select course</option>{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input required value={assignmentTitle} onChange={event => setAssignmentTitle(event.target.value)} placeholder="Assignment title" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><textarea required value={assignmentDescription} onChange={event => setAssignmentDescription(event.target.value)} placeholder="Instructions" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input required type="datetime-local" value={assignmentDue} onChange={event => setAssignmentDue(event.target.value)} className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Save draft</button>
        </form>
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { const questions = JSON.parse(examQuestions) as unknown; await apiPost('/api/education/manage/exams', { courseId: selectedCourseId, title: examTitle, durationMinutes: 0, totalMarks: 100, passingMarks: 60, questions }); setExamTitle(''); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-xs font-bold text-white">Create exam draft</h3><select required value={selectedCourseId} onChange={event => setSelectedCourseId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select course</option>{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input required value={examTitle} onChange={event => setExamTitle(event.target.value)} placeholder="Exam title" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><textarea required rows={5} value={examQuestions} onChange={event => setExamQuestions(event.target.value)} placeholder='[{"id":"q1","question":"Question text","options":["A","B"],"correctAnswerIndex":0}]' aria-label="Exam questions JSON" className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-[10px] text-white" /><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Save draft</button>
        </form>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">Assignments</h3>
        {assignments.map(item => <article key={item.id} className="border border-slate-800 bg-slate-950 p-3 text-xs">
          {editingAssignment?.id === item.id ? <form onSubmit={event => saveAssignment(event, item)} className="grid gap-2 md:grid-cols-2">
            <input name="title" required defaultValue={item.title} aria-label="Assignment title" className="rounded border border-slate-700 bg-slate-900 p-2 text-white" />
            <input name="dueDate" required type="datetime-local" defaultValue={localDateTime(item.dueDate)} aria-label="Due date" className="rounded border border-slate-700 bg-slate-900 p-2 text-white" />
            <textarea name="description" required defaultValue={item.description} aria-label="Assignment instructions" className="rounded border border-slate-700 bg-slate-900 p-2 text-white md:col-span-2" />
            <label className="text-[10px] text-slate-400">Max score<input name="maxScore" required type="number" min="1" defaultValue={item.maxScore} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" /></label>
            <label className="text-[10px] text-slate-400">Weight (%)<input name="weightPercent" required type="number" min="0" max="100" defaultValue={item.weightPercent} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" /></label>
            <div className="flex justify-end gap-3 md:col-span-2"><button type="button" onClick={() => setEditingAssignment(null)} className="text-slate-400">Cancel</button><button className="text-cyan-300">Save as draft</button></div>
          </form> : <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-white">{item.title} · {item.course.title} · {item.status}</span><div className="flex gap-2">{!['PENDING_APPROVAL', 'ARCHIVED'].includes(item.status) && <button onClick={() => setEditingAssignment(item)} className="text-slate-300">Edit</button>}{['DRAFT', 'REJECTED'].includes(item.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/assignments/${item.id}/submit`))} className="text-amber-300">Submit review</button>}{item.status === 'PENDING_APPROVAL' && <button onClick={() => void perform(() => apiPatch(`/api/education/manage/assignments/${item.id}/review`, { decision: 'APPROVED' }))} className="text-cyan-300">Approve</button>}{item.status === 'APPROVED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/assignments/${item.id}/publish`))} className="text-emerald-300">Publish</button>}{item.status !== 'ARCHIVED' && <button onClick={() => { if (window.confirm(`Archive ${item.title}?`)) void perform(() => apiRequest(`/api/education/manage/assignments/${item.id}`, { method: 'DELETE' })); }} className="text-rose-300">Archive</button>}</div></div>}
        </article>)}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">Assignment submissions</h3>
        {submissions.map(item => <article key={item.id} className="grid gap-2 border border-slate-800 bg-slate-950 p-3 text-xs sm:grid-cols-[1fr_auto]"><div><strong className="text-white">{item.student.fullName} · {item.assignment.title}</strong><p className="mt-1 whitespace-pre-wrap text-slate-400">{item.content}</p></div><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void perform(() => apiPatch(`/api/education/manage/assignment-submissions/${item.id}/grade`, { score: Number(data.get('score')), feedback: String(data.get('feedback') || '') })); }} className="flex gap-1"><input name="score" type="number" min="0" max={item.assignment.maxScore} defaultValue={item.score ?? ''} required className="w-20 rounded border border-slate-700 bg-slate-900 p-1 text-white" /><input name="feedback" placeholder="Feedback" defaultValue="" className="min-w-24 rounded border border-slate-700 bg-slate-900 p-1 text-white" /><button className="text-cyan-300">Grade</button></form></article>)}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white">Exams and results</h3>
        {exams.map(item => <article key={item.id} className="border border-slate-800 bg-slate-950 p-3 text-xs">
          {editingExam?.id === item.id ? <form onSubmit={event => saveExam(event, item)} className="space-y-2">
            <input name="title" required defaultValue={item.title} aria-label="Exam title" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" />
            <div className="grid grid-cols-3 gap-2"><label className="text-[10px] text-slate-400">Duration<input name="durationMinutes" type="number" min="0" defaultValue={item.durationMinutes} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" /></label><label className="text-[10px] text-slate-400">Total marks<input name="totalMarks" required type="number" min="1" defaultValue={item.totalMarks} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" /></label><label className="text-[10px] text-slate-400">Passing marks<input name="passingMarks" required type="number" min="0" defaultValue={item.passingMarks} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-white" /></label></div>
            <textarea required rows={6} value={editingExamQuestions} onChange={event => setEditingExamQuestions(event.target.value)} aria-label="Exam questions JSON" className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-[10px] text-white" />
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingExam(null)} className="text-slate-400">Cancel</button><button className="text-cyan-300">Save as draft</button></div>
          </form> : <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-white">{item.title} · {item.course.title} · {item.status}</span><div className="flex gap-2">{!['PENDING_APPROVAL', 'ARCHIVED'].includes(item.status) && <button onClick={() => { setEditingExam(item); setEditingExamQuestions(JSON.stringify(item.questions, null, 2)); }} className="text-slate-300">Edit</button>}{['DRAFT', 'REJECTED'].includes(item.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/exams/${item.id}/submit`))} className="text-amber-300">Submit review</button>}{item.status === 'PENDING_APPROVAL' && <button onClick={() => void perform(() => apiPatch(`/api/education/manage/exams/${item.id}/review`, { decision: 'APPROVED' }))} className="text-cyan-300">Approve</button>}{item.status === 'APPROVED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/exams/${item.id}/publish`))} className="text-emerald-300">Publish</button>}{item.status !== 'ARCHIVED' && <button onClick={() => { if (window.confirm(`Archive ${item.title}?`)) void perform(() => apiRequest(`/api/education/manage/exams/${item.id}`, { method: 'DELETE' })); }} className="text-rose-300">Archive</button>}</div></div>}
        </article>)}
        {results.map(item => <p key={item.id} className="text-[10px] text-slate-400">{item.student.fullName} · {item.exam.title}: {item.score}/{item.totalMarks} ({item.grade})</p>)}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { const data = new FormData(event.currentTarget); await apiPost('/api/education/manage/attendance', { courseId: String(data.get('courseId')), sessionDate: new Date(String(data.get('sessionDate'))).toISOString(), topic: String(data.get('topic')), studentId: String(data.get('studentId')), status: String(data.get('status')).toUpperCase() }); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4"><h3 className="text-xs font-bold text-white">Record attendance</h3><select name="courseId" required className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select course</option>{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select name="studentId" required className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select enrolled student</option>{students.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><input name="sessionDate" type="date" required className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input name="topic" required placeholder="Session topic" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><select name="status" className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></select><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Save attendance</button></form>
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await apiPost('/api/education/manage/certificates', { studentId: certificateStudentId, courseId: certificateCourseId, grade: 'Completed' }); }); }} className="space-y-2 border border-slate-800 bg-slate-950 p-4"><h3 className="text-xs font-bold text-white">Issue verified certificate</h3><select required value={certificateStudentId} onChange={event => setCertificateStudentId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select student</option>{students.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><select required value={certificateCourseId} onChange={event => setCertificateCourseId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select course</option>{courses.filter(item => item.status === 'PUBLISHED').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button className="rounded bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white">Issue</button></form>
      </section>
      <section className="space-y-3"><h3 className="text-sm font-bold text-white">Academic catalog records</h3><div className="grid gap-2 md:grid-cols-2">
        {departments.map(item => <article key={item.id} className="border border-slate-800 bg-slate-950 p-3 text-xs">{editingDepartment?.id === item.id ? <form onSubmit={saveDepartment} className="flex flex-wrap gap-2"><input required value={editingDepartment.code} onChange={event => setEditingDepartment({ ...editingDepartment, code: event.target.value })} className="min-w-20 flex-1 border border-slate-700 bg-slate-900 p-1.5 text-white" /><input required value={editingDepartment.name} onChange={event => setEditingDepartment({ ...editingDepartment, name: event.target.value })} className="min-w-28 flex-1 border border-slate-700 bg-slate-900 p-1.5 text-white" /><button className="text-cyan-300">Save</button><button type="button" onClick={() => setEditingDepartment(null)} className="text-slate-400">Cancel</button></form> : <div className="flex items-center justify-between gap-2"><span className="text-slate-200">Department: {item.name} ({item.code})</span><div className="flex gap-2"><button onClick={() => setEditingDepartment(item)} className="text-cyan-300">Edit</button><button onClick={() => { if (window.confirm(`Delete department ${item.name}? Departments with programs cannot be deleted.`)) void perform(() => apiRequest(`/api/education/admin/departments/${encodeURIComponent(item.id)}`, { method: 'DELETE' })); }} className="text-rose-300">Delete</button></div></div>}</article>)}
        {programs.map(item => <article key={item.id} className="border border-slate-800 bg-slate-950 p-3 text-xs">{editingProgram?.id === item.id ? <form onSubmit={saveProgram} className="space-y-2"><div className="grid grid-cols-2 gap-2"><input required value={editingProgram.code} onChange={event => setEditingProgram({ ...editingProgram, code: event.target.value })} aria-label="Program code" className="border border-slate-700 bg-slate-900 p-1.5 text-white" /><input required value={editingProgram.title} onChange={event => setEditingProgram({ ...editingProgram, title: event.target.value })} aria-label="Program title" className="border border-slate-700 bg-slate-900 p-1.5 text-white" /></div><textarea required value={editingProgram.description} onChange={event => setEditingProgram({ ...editingProgram, description: event.target.value })} aria-label="Program description" className="w-full border border-slate-700 bg-slate-900 p-1.5 text-white" /><div className="grid grid-cols-3 gap-2"><input required type="number" min="0" value={editingProgram.durationWeeks} onChange={event => setEditingProgram({ ...editingProgram, durationWeeks: Number(event.target.value) })} aria-label="Duration in weeks" className="border border-slate-700 bg-slate-900 p-1.5 text-white" /><input required type="number" min="0" value={editingProgram.credits} onChange={event => setEditingProgram({ ...editingProgram, credits: Number(event.target.value) })} aria-label="Credits" className="border border-slate-700 bg-slate-900 p-1.5 text-white" /><select value={editingProgram.departmentId ?? ''} onChange={event => setEditingProgram({ ...editingProgram, departmentId: event.target.value || null })} aria-label="Department" className="border border-slate-700 bg-slate-900 p-1.5 text-white"><option value="">No department</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div><div className="flex justify-end gap-2"><button className="text-cyan-300">Save</button><button type="button" onClick={() => setEditingProgram(null)} className="text-slate-400">Cancel</button></div></form> : <div className="flex items-center justify-between gap-2"><span className="text-slate-200">Program: {item.title} ({item.code}) · {item.isActive ? 'Active' : 'Archived'}</span><div className="flex gap-2"><button onClick={() => setEditingProgram(item)} className="text-cyan-300">Edit</button>{item.isActive && <button onClick={() => void perform(() => apiRequest(`/api/education/admin/programs/${encodeURIComponent(item.id)}`, { method: 'DELETE' }))} className="text-amber-300">Archive</button>}</div></div>}</article>)}
        {cohorts.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-slate-950 p-3 text-xs"><span className="text-slate-300">Cohort: {item.code} · {item._count.enrollments} enrollments</span><div className="flex items-center gap-2"><input aria-label={`${item.code} maximum capacity`} type="number" min="0" defaultValue={item.maxCapacity} onBlur={event => { const maxCapacity = Number(event.target.value); if (maxCapacity !== item.maxCapacity) void perform(() => apiPatch(`/api/education/admin/cohorts/${encodeURIComponent(item.id)}`, { maxCapacity })); }} className="w-20 border border-slate-700 bg-slate-900 p-1.5 text-[10px] text-white" /><select value={item.status} aria-label={`Cohort ${item.code} status`} onChange={event => void perform(() => apiPatch(`/api/education/admin/cohorts/${encodeURIComponent(item.id)}`, { status: event.target.value }))} className="border border-slate-700 bg-slate-900 p-1.5 text-[10px] text-white"><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="graduated">Graduated</option></select></div></article>)}
      </div></section>
    </div>
  );
};