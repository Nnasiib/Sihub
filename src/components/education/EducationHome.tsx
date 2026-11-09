import React, { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Layers, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiGet, ApiError } from '../../services/apiClient';

type Program = { id: string; code: string; title: string; description: string; durationWeeks: number; department?: { name: string } | null; _count: { cohorts: number; courses: number } };
type Cohort = { id: string; code: string; startDate: string; endDate: string; status: string; maxCapacity: number; program: { title: string }; _count: { enrollments: number } };
type Course = { id: string; title: string; category: string; description: string; level: string };

export const EducationHome: React.FC = () => {
  const { authUser, navigateTo } = useApp();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<{ id: string; certificateNumber: string; course: { title: string } }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [programResult, cohortResult, courseResult] = await Promise.all([
        apiGet<{ programs: Program[] }>('/api/education/catalog/programs'),
        apiGet<{ cohorts: Cohort[] }>('/api/education/catalog/cohorts'),
        apiGet<{ courses: Course[] }>('/api/education/courses')
      ]);
      setPrograms(Array.isArray(programResult?.programs) ? programResult.programs : []);
      setCohorts(Array.isArray(cohortResult?.cohorts) ? cohortResult.cohorts : []);
      setCourses(Array.isArray(courseResult?.courses) ? courseResult.courses : []);
      if (authUser && ['STUDENT', 'LEARNER'].includes(authUser.role)) {
        const result = await apiGet<{ certificates: typeof certificates }>('/api/education/me/certificates');
        setCertificates(Array.isArray(result?.certificates) ? result.certificates : []);
      } else setCertificates([]);
      setError('');
    } catch (reason) {
      setPrograms([]);
      setCohorts([]);
      setCourses([]);
      setCertificates([]);
      setError(reason instanceof ApiError ? reason.message : 'Unable to load SiHub education records.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [authUser?.id]);

  const safePrograms = programs || [];
  const safeCohorts = cohorts || [];
  const safeCourses = courses || [];
  const safeCertificates = certificates || [];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div><span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">SiHub Institute</span><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Education and training</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Browse courses and current academic programs published by SiHub.</p></div>
        <div className="flex gap-2"><button onClick={() => navigateTo('courses')} className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white">Course catalog</button><button onClick={() => void load()} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
      </header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Published programs', count: safePrograms.length, icon: <Layers className="h-4 w-4" /> },
          { label: 'Open cohorts', count: safeCohorts.length, icon: <GraduationCap className="h-4 w-4" /> },
          { label: 'Published courses', count: safeCourses.length, icon: <BookOpen className="h-4 w-4" /> },
          { label: 'Your certificates', count: safeCertificates.length, icon: <GraduationCap className="h-4 w-4" /> }
        ].map(item => <div key={item.label} className="border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs text-slate-500"><span>{item.label}</span>{item.icon}</div><strong className="mt-2 block text-2xl text-slate-900">{loading ? '…' : item.count}</strong></div>)}
      </section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Academic programs</h2>{safePrograms.map(program => <article key={program.id} className="border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{program.title}</h3><span className="text-[10px] text-slate-500">{program.code} · {program.department?.name ?? 'SiHub Institute'}</span></div><p className="mt-2 text-xs text-slate-600">{program.description}</p><p className="mt-2 text-[10px] text-slate-500">{program.durationWeeks} weeks · {program._count.courses} courses · {program._count.cohorts} cohorts</p></article>)}{!loading && safePrograms.length === 0 && <p className="border border-slate-200 p-4 text-xs text-slate-500">No programs have been published.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Upcoming and active cohorts</h2>{safeCohorts.map(cohort => <article key={cohort.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-4 text-xs"><div><strong className="text-slate-900">{cohort.code} · {cohort.program.title}</strong><p className="mt-1 text-slate-500">{new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}</p></div><span className="text-slate-600">{cohort._count.enrollments}/{cohort.maxCapacity || 'open'} · {cohort.status}</span></article>)}{!loading && safeCohorts.length === 0 && <p className="border border-slate-200 p-4 text-xs text-slate-500">No active or upcoming cohorts have been published.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Published courses</h2>{safeCourses.slice(0, 6).map(course => <article key={course.id} className="border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{course.title}</h3><span className="text-[10px] text-slate-500">{course.category} · {course.level}</span></div><p className="mt-2 text-xs text-slate-600">{course.description}</p></article>)}{!loading && safeCourses.length === 0 && <p className="border border-slate-200 p-4 text-xs text-slate-500">No courses have been published.</p>}</section>
    </main>
  );
};
