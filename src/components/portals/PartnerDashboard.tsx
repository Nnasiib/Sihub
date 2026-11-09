import React, { useEffect, useState } from 'react';
import { apiGet, ApiError } from '../../services/apiClient';

type CmsEntry = { id: string; title: string; summary: string | null; content: Record<string, unknown> };
type Submission = { id: string; referenceCode: string; status: string; createdAt: string; payload: Record<string, unknown> };

export const PartnerDashboard: React.FC = () => {
  const [impact, setImpact] = useState<CmsEntry[]>([]);
  const [inquiries, setInquiries] = useState<Submission[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<{ entries: CmsEntry[] }>('/api/cms/impact'),
      apiGet<{ submissions: Submission[] }>('/api/submissions/mine?type=partner-inquiry')
    ]).then(([impactResult, inquiryResult]) => {
      if (!active) return;
      setImpact(impactResult.entries);
      setInquiries(inquiryResult.submissions);
      setError('');
    }).catch(reason => {
      if (active) setError(reason instanceof ApiError ? reason.message : 'Unable to load partner data.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5"><span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Partner workspace</span><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Published impact and your inquiries</h1><p className="mt-2 text-sm text-slate-600">Public impact records and your authenticated partnership submissions.</p></header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}{loading && <p className="text-xs text-slate-500">Loading partner data…</p>}
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Published impact reports</h2>{impact.map(item => <article key={item.id} className="border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-600">{item.summary}</p></article>)}{!loading && !impact.length && !error && <p className="text-xs text-slate-500">No published impact reports.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900">Your partnership inquiries</h2>{inquiries.map(item => <article key={item.id} className="border border-slate-200 bg-white p-4"><div className="flex justify-between gap-2"><strong className="text-sm text-slate-900">{String(item.payload.organizationName ?? 'Partnership inquiry')}</strong><span className="text-[10px] font-bold uppercase text-teal-700">{item.status}</span></div><p className="mt-1 text-xs text-slate-600">{String(item.payload.proposalDetails ?? '')}</p><p className="mt-2 font-mono text-[10px] text-slate-500">{item.referenceCode}</p></article>)}{!loading && !inquiries.length && !error && <p className="text-xs text-slate-500">No partnership inquiries are associated with your account.</p>}</section>
    </main>
  );
};
