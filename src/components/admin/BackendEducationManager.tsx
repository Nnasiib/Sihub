import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, FileUp, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { apiGet, apiPatch, apiPost, apiRequest, ApiError } from '../../services/apiClient';

type Lesson = { id: string; title: string; lessonType: string; position: number; durationMinutes: number; textContent: string | null; assignmentPrompt: string | null; mediaAssetId: string | null; status: string; rejectionReason: string | null };
type Module = { id: string; title: string; position: number; lessons: Lesson[] };
type Course = { id: string; slug: string; title: string; category: string; description: string; level: string; status: string; modules: Module[] };
type Enrollment = { id: string; status: string; motivation: string; appliedAt: string; rejectionReason: string | null; student: { id: string; fullName: string; email: string }; course: { id: string; title: string } };
type Student = { id: string; fullName: string; email: string };

export const BackendEducationManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseCategory, setCourseCategory] = useState('Technology & Software');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseLevel, setCourseLevel] = useState('Beginner');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [moduleTitles, setModuleTitles] = useState<Record<string, string>>({});
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [lessonModule, setLessonModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('reading');
  const [lessonText, setLessonText] = useState('');
  const [assignmentPrompt, setAssignmentPrompt] = useState('');
  const [lessonMediaId, setLessonMediaId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [assignedStudentId, setAssignedStudentId] = useState('');
  const [assignedCourseId, setAssignedCourseId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [courseResult, enrollmentResult, studentResult] = await Promise.all([
        apiGet<{ courses: Course[] }>('/api/education/manage/courses'),
        apiGet<{ enrollments: Enrollment[] }>('/api/education/manage/enrollments'),
        apiGet<{ students: Student[] }>('/api/education/manage/students')
      ]);
      setCourses(courseResult.courses);
      setEnrollments(enrollmentResult.enrollments);
      setStudents(studentResult.students);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load persistent education records.');
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
      setError(reason instanceof ApiError ? reason.message : 'The education update failed.');
    }
  };

  const createCourse = (event: React.FormEvent) => {
    event.preventDefault();
    void perform(async () => {
      await apiPost('/api/education/manage/courses', { title: courseTitle, slug: courseSlug, category: courseCategory, description: courseDescription, level: courseLevel });
      setCourseTitle('');
      setCourseSlug('');
      setCourseDescription('');
    });
  };

  const saveCourse = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingCourse) return;
    void perform(async () => {
      await apiPatch(`/api/education/manage/courses/${encodeURIComponent(editingCourse.id)}`, {
        title: editingCourse.title,
        slug: editingCourse.slug,
        category: editingCourse.category,
        description: editingCourse.description,
        level: editingCourse.level
      });
      setEditingCourse(null);
    });
  };

  const addModule = (event: React.FormEvent, course: Course) => {
    event.preventDefault();
    const title = moduleTitles[course.id]?.trim();
    if (!title) return;
    void perform(async () => {
      await apiPost(`/api/education/manage/courses/${encodeURIComponent(course.id)}/modules`, { title, position: course.modules.length });
      setModuleTitles(current => ({ ...current, [course.id]: '' }));
    });
  };

  const saveModule = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingModule) return;
    void perform(async () => {
      await apiPatch(`/api/education/manage/modules/${encodeURIComponent(editingModule.id)}`, { title: editingModule.title, position: editingModule.position });
      setEditingModule(null);
    });
  };

  const moveModule = (course: Course, index: number, offset: -1 | 1) => {
    const module = course.modules[index];
    const target = course.modules[index + offset];
    if (!module || !target) return;
    void perform(() => apiPatch(`/api/education/manage/modules/${encodeURIComponent(module.id)}`, { position: target.position }));
  };

  const deleteModule = (module: Module) => {
    if (!window.confirm(`Delete empty module "${module.title}"? Modules with lesson history are retained.`)) return;
    void perform(() => apiRequest(`/api/education/manage/modules/${encodeURIComponent(module.id)}`, { method: 'DELETE' }));
  };

  const openNewLesson = (module: Module) => {
    setLessonModule(module);
    setEditingLesson(null);
    setLessonTitle('');
    setLessonType('reading');
    setLessonText('');
    setAssignmentPrompt('');
    setLessonMediaId('');
  };

  const openEditLesson = (module: Module, lesson: Lesson) => {
    setLessonModule(module);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonType(lesson.lessonType);
    setLessonText(lesson.textContent || '');
    setAssignmentPrompt(lesson.assignmentPrompt || '');
    setLessonMediaId(lesson.mediaAssetId || '');
  };

  const uploadMaterial = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', { filename: file.name, contentType: file.type, byteSize: file.size });
      const stored = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!stored.ok) throw new Error('Storage upload failed. Check the bucket CORS and provider settings.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);
      setLessonMediaId(upload.assetId);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveLesson = (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonModule) return;
    void perform(async () => {
      const payload = { title: lessonTitle, lessonType, durationMinutes: 0, textContent: lessonText, assignmentPrompt, mediaAssetId: lessonMediaId || undefined };
      if (editingLesson) await apiPatch(`/api/education/manage/lessons/${encodeURIComponent(editingLesson.id)}`, payload);
      else await apiPost(`/api/education/manage/modules/${encodeURIComponent(lessonModule.id)}/lessons`, payload);
      setLessonModule(null);
      setEditingLesson(null);
    });
  };

  const review = (path: string, decision: 'APPROVED' | 'REJECTED') => void perform(() => apiPatch(path, { decision, reason: decision === 'REJECTED' ? 'Please revise and resubmit for review.' : undefined }));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Persistent Education • PostgreSQL</span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">Education management</h1>
          <p className="mt-1 text-xs text-slate-400">Courses, lesson review, private learning access, and enrollment administration.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      {loading && <p className="flex items-center gap-2 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading server records</p>}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <form onSubmit={createCourse} className="space-y-3 border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm font-bold text-white"><Plus className="mr-1 inline h-4 w-4 text-cyan-400" />Create course draft</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold text-slate-400">Title<input required value={courseTitle} onChange={event => { const value = event.target.value; setCourseTitle(value); setCourseSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
            <label className="text-[10px] font-semibold text-slate-400">Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={courseSlug} onChange={event => setCourseSlug(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
            <label className="text-[10px] font-semibold text-slate-400">Category<input required value={courseCategory} onChange={event => setCourseCategory(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
            <label className="text-[10px] font-semibold text-slate-400">Level<select value={courseLevel} onChange={event => setCourseLevel(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
          </div>
          <label className="block text-[10px] font-semibold text-slate-400">Description<textarea required rows={2} value={courseDescription} onChange={event => setCourseDescription(event.target.value)} className="mt-1 block w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
          <button className="rounded bg-cyan-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-cyan-500">Save draft</button>
        </form>

        <form onSubmit={event => { event.preventDefault(); if (!assignedStudentId || !assignedCourseId) return; void perform(async () => { await apiPost('/api/education/manage/enrollments', { studentId: assignedStudentId, courseId: assignedCourseId }); setAssignedStudentId(''); setAssignedCourseId(''); }); }} className="space-y-3 border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm font-bold text-white"><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-400" />Assign published course</h2>
          <label className="block text-[10px] font-semibold text-slate-400">Student<select required value={assignedStudentId} onChange={event => setAssignedStudentId(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"><option value="">Select student</option>{students.map(student => <option key={student.id} value={student.id}>{student.fullName} · {student.email}</option>)}</select></label>
          <label className="block text-[10px] font-semibold text-slate-400">Course<select required value={assignedCourseId} onChange={event => setAssignedCourseId(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"><option value="">Select published course</option>{courses.filter(course => course.status === 'PUBLISHED').map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <button className="rounded bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-600">Assign access</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><BookOpen className="h-4 w-4 text-cyan-400" />Courses and lesson workflow</h2>
        {courses.map(course => (
          <article key={course.id} className="border border-slate-800 bg-slate-950">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 p-4">
              <div className="min-w-0 flex-1">
                {editingCourse?.id === course.id ? (
                  <form onSubmit={saveCourse} className="space-y-2">
                    <input value={editingCourse.title} onChange={event => setEditingCourse({ ...editingCourse, title: event.target.value })} required className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white" />
                    <input value={editingCourse.slug} onChange={event => setEditingCourse({ ...editingCourse, slug: event.target.value })} required className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white" />
                    <input value={editingCourse.category} onChange={event => setEditingCourse({ ...editingCourse, category: event.target.value })} required aria-label="Course category" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white" />
                    <textarea value={editingCourse.description} onChange={event => setEditingCourse({ ...editingCourse, description: event.target.value })} rows={2} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white" />
                    <select value={editingCourse.level} onChange={event => setEditingCourse({ ...editingCourse, level: event.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                    <button className="rounded bg-cyan-700 px-2.5 py-1.5 text-[10px] font-bold text-white">Save edits (returns to draft)</button>
                  </form>
                ) : <><h3 className="truncate text-sm font-bold text-white">{course.title}</h3><p className="mt-1 text-[10px] text-slate-500">{course.category} · {course.level} · {course.modules.length} modules</p></>}
                <span className="mt-2 inline-flex rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-cyan-200">{course.status.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {course.status !== 'PENDING_APPROVAL' && course.status !== 'ARCHIVED' && <button onClick={() => setEditingCourse(course)} className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300">Edit</button>}
                {['DRAFT', 'REJECTED'].includes(course.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/courses/${encodeURIComponent(course.id)}/submit`))} className="rounded bg-amber-900/80 px-2 py-1 text-[10px] font-semibold text-amber-200">Submit review</button>}
                {course.status === 'PENDING_APPROVAL' && <><button onClick={() => review(`/api/education/manage/courses/${encodeURIComponent(course.id)}/review`, 'APPROVED')} className="rounded bg-cyan-900/80 px-2 py-1 text-[10px] font-semibold text-cyan-200">Approve</button><button onClick={() => review(`/api/education/manage/courses/${encodeURIComponent(course.id)}/review`, 'REJECTED')} className="rounded bg-rose-900/80 px-2 py-1 text-[10px] font-semibold text-rose-200">Reject</button></>}
                {course.status === 'APPROVED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/courses/${encodeURIComponent(course.id)}/publish`))} className="rounded bg-emerald-900/80 px-2 py-1 text-[10px] font-semibold text-emerald-200">Publish</button>}
                {course.status === 'PUBLISHED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/courses/${encodeURIComponent(course.id)}/unpublish`))} className="rounded bg-amber-900/80 px-2 py-1 text-[10px] font-semibold text-amber-200">Unpublish</button>}
                {course.status !== 'ARCHIVED' && <button onClick={() => { if (window.confirm(`Archive ${course.title}?`)) void perform(() => apiRequest(`/api/education/manage/courses/${encodeURIComponent(course.id)}`, { method: 'DELETE' })); }} aria-label={`Archive ${course.title}`} className="rounded p-1.5 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
            <div className="space-y-4 p-4">
              {course.modules.map((module, index) => <div key={module.id} className="border-l-2 border-slate-700 pl-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {editingModule?.id === module.id ? <form onSubmit={saveModule} className="flex min-w-0 flex-1 gap-2"><input value={editingModule.title} onChange={event => setEditingModule({ ...editingModule, title: event.target.value })} required className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white" /><button className="text-[10px] font-bold text-cyan-300">Save</button><button type="button" onClick={() => setEditingModule(null)} className="text-[10px] text-slate-400">Cancel</button></form> : <h4 className="text-xs font-bold text-slate-200">{module.title}</h4>}
                  <div className="flex items-center gap-2">{course.status !== 'PENDING_APPROVAL' && course.status !== 'ARCHIVED' && !editingModule && <><button onClick={() => setEditingModule(module)} className="text-[10px] text-slate-400 hover:text-white">Edit</button><button onClick={() => moveModule(course, index, -1)} disabled={index === 0} className="text-[10px] text-slate-400 disabled:opacity-30" aria-label={`Move ${module.title} up`}>Up</button><button onClick={() => moveModule(course, index, 1)} disabled={index === course.modules.length - 1} className="text-[10px] text-slate-400 disabled:opacity-30" aria-label={`Move ${module.title} down`}>Down</button>{module.lessons.length === 0 && <button onClick={() => deleteModule(module)} aria-label={`Delete ${module.title}`} className="text-[10px] text-rose-400">Delete</button>}</>}{course.status !== 'PENDING_APPROVAL' && course.status !== 'ARCHIVED' && <button onClick={() => openNewLesson(module)} className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300"><Plus className="h-3 w-3" />Lesson</button>}</div>
                </div>
                {module.lessons.map(lesson => <div key={lesson.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-[10px]">
                  <span className="text-slate-300">{lesson.title}<span className="ml-2 text-slate-500">{lesson.status.replace('_', ' ')}</span></span>
                  <div className="flex gap-1.5">
                    {lesson.status !== 'PENDING_APPROVAL' && lesson.status !== 'ARCHIVED' && <button onClick={() => openEditLesson(module, lesson)} className="text-slate-400 hover:text-white">Edit</button>}
                    {['DRAFT', 'REJECTED'].includes(lesson.status) && <button onClick={() => void perform(() => apiPost(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}/submit`))} className="text-amber-300">Review</button>}
                    {lesson.status === 'PENDING_APPROVAL' && <><button onClick={() => review(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}/review`, 'APPROVED')} className="text-cyan-300">Approve</button><button onClick={() => review(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}/review`, 'REJECTED')} className="text-rose-300">Reject</button></>}
                    {lesson.status === 'APPROVED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}/publish`))} className="text-emerald-300">Publish</button>}
                    {lesson.status === 'PUBLISHED' && <button onClick={() => void perform(() => apiPost(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}/unpublish`))} className="text-amber-300">Unpublish</button>}
                    {lesson.status !== 'ARCHIVED' && <button onClick={() => { if (window.confirm(`Archive ${lesson.title}?`)) void perform(() => apiRequest(`/api/education/manage/lessons/${encodeURIComponent(lesson.id)}`, { method: 'DELETE' })); }} className="text-slate-500 hover:text-rose-300">Archive</button>}
                  </div>
                </div>)}
              </div>)}
              {course.status !== 'ARCHIVED' && <form onSubmit={event => addModule(event, course)} className="flex gap-2 border-t border-slate-800 pt-3">
                <input value={moduleTitles[course.id] || ''} onChange={event => setModuleTitles(current => ({ ...current, [course.id]: event.target.value }))} placeholder="New module title" required className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                <button className="rounded bg-slate-800 px-3 text-[10px] font-bold text-slate-200">Add module</button>
              </form>}
            </div>
          </article>
        ))}
        {!loading && courses.length === 0 && <p className="border border-slate-800 bg-slate-950 p-5 text-xs text-slate-400">No courses are available in the database.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-white">Enrollment review queue</h2>
        {enrollments.filter(item => item.status === 'PENDING').map(enrollment => <article key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-800 bg-slate-950 p-4">
          <div><h3 className="text-xs font-bold text-white">{enrollment.student.fullName} · {enrollment.course.title}</h3><p className="mt-1 max-w-3xl text-[10px] text-slate-400">{enrollment.motivation}</p></div>
          <div className="flex gap-2"><button onClick={() => void perform(() => apiPatch(`/api/education/manage/enrollments/${encodeURIComponent(enrollment.id)}`, { decision: 'APPROVED' }))} className="rounded bg-emerald-800 px-3 py-1.5 text-[10px] font-bold text-emerald-100">Approve access</button><button onClick={() => void perform(() => apiPatch(`/api/education/manage/enrollments/${encodeURIComponent(enrollment.id)}`, { decision: 'REJECTED', reason: 'Eligibility requirements were not met.' }))} className="rounded bg-rose-900 px-3 py-1.5 text-[10px] font-bold text-rose-100">Reject</button></div>
        </article>)}
        {!loading && enrollments.every(item => item.status !== 'PENDING') && <p className="border border-slate-800 bg-slate-950 p-4 text-xs text-slate-500">No pending enrollment requests.</p>}
      </section>

      {lessonModule && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"><form onSubmit={saveLesson} className="w-full max-w-lg space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between"><h2 className="text-sm font-bold">{editingLesson ? 'Edit lesson draft' : `Add lesson to ${lessonModule.title}`}</h2><button type="button" onClick={() => setLessonModule(null)} className="text-xs text-slate-400">Close</button></div>
        <label className="block text-[10px] font-semibold text-slate-400">Lesson title<input required value={lessonTitle} onChange={event => setLessonTitle(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
        <label className="block text-[10px] font-semibold text-slate-400">Format<select value={lessonType} onChange={event => setLessonType(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white"><option value="reading">Reading</option><option value="video">Video</option><option value="pdf">PDF</option><option value="assignment">Assignment</option><option value="quiz">Quiz</option></select></label>
        <label className="block text-[10px] font-semibold text-slate-400">Lesson text<textarea rows={4} value={lessonText} onChange={event => setLessonText(event.target.value)} className="mt-1 block w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>
        {lessonType === 'assignment' && <label className="block text-[10px] font-semibold text-slate-400">Assignment prompt<textarea rows={2} value={assignmentPrompt} onChange={event => setAssignmentPrompt(event.target.value)} className="mt-1 block w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label>}
        <label className="block text-[10px] font-semibold text-slate-400">Private learning material (PDF/image/video, up to 25 MB files or 250 MB video)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm" onChange={event => void uploadMaterial(event.target.files?.[0])} className="mt-1 block w-full text-[10px] text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-white" /></label>
        {lessonMediaId && <p className="text-[10px] text-emerald-300">Verified asset attached: {lessonMediaId}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setLessonModule(null)} className="rounded border border-slate-700 px-3 py-2 text-[10px]">Cancel</button><button disabled={uploading} className="inline-flex items-center gap-1.5 rounded bg-cyan-600 px-3 py-2 text-[10px] font-bold disabled:opacity-50">{uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}Save as draft</button></div>
      </form></div>}
    </div>
  );
};
