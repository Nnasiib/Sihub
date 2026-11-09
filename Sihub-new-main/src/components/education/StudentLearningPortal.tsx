import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Download, GraduationCap, LoaderCircle, RefreshCw } from 'lucide-react';
import { apiGet, apiPost, ApiError } from '../../services/apiClient';

type Lesson = {
  id: string;
  title: string;
  type: string;
  order: number;
  durationMinutes: number;
  textContent: string | null;
  assignmentPrompt: string | null;
  mediaAssetId: string | null;
  completed: boolean;
};
type LearningCourse = {
  enrollmentId: string;
  status: string;
  course: { id: string; slug: string; title: string; category: string; description: string; modules: { id: string; title: string; order: number; lessons: Lesson[] }[] };
};

export const StudentLearningPortal: React.FC = () => {
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGet<{ courses: LearningCourse[] }>('/api/education/me/courses');
      setCourses(result.courses);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCourses(); }, []);

  const completeLesson = async (lesson: Lesson) => {
    try {
      await apiPost('/api/education/progress', { lessonId: lesson.id, completed: !lesson.completed });
      setSelectedLesson({ ...lesson, completed: !lesson.completed });
      await loadCourses();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save learning progress.');
    }
  };

  const openMaterial = async (mediaAssetId: string) => {
    try {
      const result = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(mediaAssetId)}/download`);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to open this learning material.');
    }
  };

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700">SiHub Academy</span>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">My Learning</h1>
            <p className="mt-1 text-sm text-slate-600">Only approved courses and published lessons assigned to your account appear here.</p>
          </div>
          <button onClick={() => void loadCourses()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100" aria-label="Refresh courses">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </header>

        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
        {loading && <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading your courses</div>}
        {!loading && courses.length === 0 && (
          <div className="border-y border-slate-200 py-10 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 font-bold text-slate-800">No approved courses yet</h2>
            <p className="mt-1 text-sm text-slate-500">Approved course access will appear here.</p>
          </div>
        )}

        <div className="space-y-8">
          {courses.map(({ enrollmentId, course }) => (
            <section key={enrollmentId} className="border-b border-slate-200 pb-7">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-cyan-100 p-2 text-cyan-800"><BookOpen className="h-5 w-5" /></span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">{course.category}</span>
                  <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">{course.description}</p>
                </div>
              </div>
              <div className="mt-5 space-y-5">
                {course.modules.map(module => (
                  <div key={module.id}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{module.title}</h3>
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                      {module.lessons.map(lesson => (
                        <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                          <button onClick={() => setSelectedLesson(lesson)} className="flex min-w-0 items-center gap-2 text-left text-sm font-medium text-slate-800 hover:text-cyan-700">
                            {lesson.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-slate-400" />}
                            <span className="truncate">{lesson.title}</span>
                            <span className="shrink-0 text-[10px] font-normal uppercase text-slate-400">{lesson.type}</span>
                          </button>
                          {lesson.mediaAssetId && (
                            <button onClick={() => void openMaterial(lesson.mediaAssetId!)} className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900">
                              <Download className="h-3.5 w-3.5" /> Material
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
          <section className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">{selectedLesson.type}</span>
                <h2 id="lesson-title" className="mt-1 text-lg font-bold text-slate-900">{selectedLesson.title}</h2>
              </div>
              <button onClick={() => setSelectedLesson(null)} className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100" aria-label="Close lesson">Close</button>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700">
              {selectedLesson.textContent && <p className="whitespace-pre-wrap">{selectedLesson.textContent}</p>}
              {selectedLesson.assignmentPrompt && <div className="rounded-lg bg-slate-50 p-4"><strong className="block text-xs text-slate-900">Assignment</strong><p className="mt-2 whitespace-pre-wrap">{selectedLesson.assignmentPrompt}</p></div>}
              {selectedLesson.mediaAssetId && <button onClick={() => void openMaterial(selectedLesson.mediaAssetId!)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"><Download className="h-4 w-4" /> Open learning material</button>}
              {!selectedLesson.textContent && !selectedLesson.assignmentPrompt && !selectedLesson.mediaAssetId && <p className="text-slate-500">Lesson materials will be provided by your instructor.</p>}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button onClick={() => void completeLesson(selectedLesson)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {selectedLesson.completed ? 'Mark incomplete' : 'Mark complete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
