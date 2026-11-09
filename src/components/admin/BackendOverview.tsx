import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, FileText, RefreshCw, Users } from 'lucide-react';
import { useApp, type AdminTab } from '../../context/AppContext';
import { apiGet, ApiError } from '../../services/apiClient';

type AdminUser = { id: string };
type CmsEntry = { id: string; title: string; type: string; status: string; deletedAt: string | null };
type Submission = { id: string; type: string; status: string; referenceCode: string; createdAt: string; payload: Record<string, unknown> };
type Course = { id: string; title: string; status: string };
type AuditEntry = { id: string; action: string; entity: string; createdAt: string };

export const BackendOverview: React.FC = () => {
  const { setAdminTab } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [userResult, cmsResult, submissionResult, courseResult, auditResult] = await Promise.all([
        apiGet<{ users: AdminUser[] }>('/api/admin/users'),
        apiGet<{ entries: CmsEntry[] }>('/api/cms/admin'),
        apiGet<{ submissions: Submission[] }>('/api/admin/submissions'),
        apiGet<{ courses: Course[] }>('/api/education/manage/courses'),
        apiGet<{ entries: AuditEntry[] }>('/api/admin/audit?limit=8')
      ]);
      setUsers(userResult.users);
      setEntries(cmsResult.entries);
      setSubmissions(submissionResult.submissions);
      setCourses(courseResult.courses);
      setAudit(auditResult.entries);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load dashboard data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const publishedEntries = entries.filter(entry => entry.status === 'PUBLISHED' && !entry.deletedAt);
  const pendingSubmissions = submissions.filter(item => item.status === 'PENDING');
  const publishedCourses = courses.filter(course => course.status === 'PUBLISHED');
  const cards = [
    { title: 'Registered users', value: users.length, icon: <Users className="h-4 w-4 text-cyan-400" />, tab: 'users' as AdminTab },
    { title: 'Published CMS entries', value: publishedEntries.length, icon: <FileText className="h-4 w-4 text-emerald-400" />, tab: 'content' as AdminTab },
    { title: 'Pending submissions', value: pendingSubmissions.length, icon: <Activity className="h-4 w-4 text-amber-400" />, tab: 'content' as AdminTab },
    { title: 'Published courses', value: publishedCourses.length, icon: <BookOpen className="h-4 w-4 text-sky-400" />, tab: 'lms' as AdminTab }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Module 6.1 • Executive Overview</span>
          <h1 className="mt-1 text-2xl font-extrabold text-white">Institutional Operations Overview</h1>
          <p className="mt-1 text-xs text-slate-400">Counts are loaded from authenticated SiHub APIs.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh</button>
      </header>
      {error && <p role="alert" className="border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <button key={card.title} onClick={() => setAdminTab(card.tab)} className="flex items-center justify-between border border-slate-800 bg-slate-950 p-4 text-left hover:border-cyan-700">
          <span><span className="block text-xs text-slate-400">{card.title}</span><strong className="mt-1 block text-2xl text-white">{loading ? '...' : card.value}</strong></span>{card.icon}
        </button>)}
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Pending applications and inquiries</h2>
        {pendingSubmissions.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-slate-950 p-3">
          <div><strong className="text-xs text-white">{String(item.payload.title ?? item.payload.name ?? item.payload.organizationName ?? item.payload.programTitle ?? item.payload.eventTitle ?? item.type)}</strong><p className="mt-1 text-[10px] text-slate-500">{item.type} · {item.referenceCode}</p></div>
          <button onClick={() => setAdminTab(item.type === 'program-application' ? 'programs' : item.type === 'event-registration' ? 'events' : item.type === 'partner-inquiry' ? 'partnerships' : item.type === 'opportunity-application' ? 'opportunities' : item.type === 'mentorship-request' ? 'mentorship' : item.type === 'startup-pitch' ? 'startups' : 'community')} className="rounded border border-slate-700 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300">Review</button>
        </article>)}
        {!loading && pendingSubmissions.length === 0 && !error && <p className="border border-slate-800 bg-slate-950 p-4 text-xs text-slate-500">No pending submissions.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Recent audit activity</h2>
        {audit.map(item => <div key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 py-2 text-xs"><span className="text-slate-300">{item.action} · {item.entity}</span><time className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></div>)}
        {!loading && audit.length === 0 && !error && <p className="text-xs text-slate-500">No audit records available.</p>}
      </section>
    </div>
  );
};