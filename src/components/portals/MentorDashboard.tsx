import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch, ApiError } from '../../services/apiClient';

type MentorshipRequest = { id: string; referenceCode: string; status: string; createdAt: string; payload: Record<string, unknown> };

export const MentorDashboard: React.FC = () => {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const result = await apiGet<{ submissions: MentorshipRequest[] }>('/api/submissions/mentor/requests'); setRequests(result.submissions); setError(''); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to load requests assigned to your mentor account.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const respond = async (item: MentorshipRequest, decision: 'APPROVED' | 'REJECTED') => {
    try { setError(''); await apiPatch(`/api/submissions/mentor/requests/${encodeURIComponent(item.id)}`, { decision, ...(decision === 'APPROVED' && meetingLink ? { meetingLink } : {}) }); setMeetingLink(''); await load(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to save mentorship response.'); }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5"><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Mentor workspace</span><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Assigned mentorship requests</h1><p className="mt-2 text-sm text-slate-600">Only requests linked to your mentor account are shown.</p></header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}{loading && <p className="text-xs text-slate-500">Loading requests…</p>}
      {requests.map(item => <article key={item.id} className="space-y-3 border border-slate-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{String(item.payload.menteeName ?? 'Mentee')} · {String(item.payload.topic ?? '')}</strong><span className="text-[10px] font-bold uppercase text-indigo-700">{item.status}</span></div><p className="text-xs text-slate-600">Preferred time: {String(item.payload.preferredSlot ?? 'Not specified')}</p><p className="font-mono text-[10px] text-slate-500">{item.referenceCode} · {new Date(item.createdAt).toLocaleString()}</p>{item.status === 'PENDING' && <div className="flex flex-wrap gap-2"><input value={meetingLink} onChange={event => setMeetingLink(event.target.value)} type="url" placeholder="HTTPS meeting link (optional)" className="min-w-64 flex-1 rounded border border-slate-300 p-2 text-xs" /><button onClick={() => void respond(item, 'APPROVED')} className="rounded bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white">Accept</button><button onClick={() => void respond(item, 'REJECTED')} className="rounded bg-rose-700 px-3 py-2 text-[10px] font-bold text-white">Decline</button></div>}</article>)}
      {!loading && requests.length === 0 && !error && <p className="border-y border-slate-200 py-8 text-center text-sm text-slate-500">No requests are assigned to your account. Ask an administrator to link your mentor profile to your user account.</p>}
    </main>
  );
};
