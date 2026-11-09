import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '../../services/apiClient';

type VisitorSubmission = {
  id: string;
  referenceCode: string;
  status: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export const BackendVisitorDesk: React.FC = () => {
  const [requests, setRequests] = useState<VisitorSubmission[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [assignedHost, setAssignedHost] = useState('SiHub Visitor Desk');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewing, setReviewing] = useState<VisitorSubmission | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ submissions: VisitorSubmission[] }>('/api/admin/submissions?type=visitor-request');
      setRequests(result.submissions);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load visitor requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => requests.filter(request => {
    const term = search.toLowerCase();
    const matchesText = [request.referenceCode, request.payload.fullName, request.payload.email, request.payload.organization].some(value => String(value ?? '').toLowerCase().includes(term));
    return matchesText && (filter === 'ALL' || request.status === filter);
  }), [requests, search, filter]);

  const decide = async (request: VisitorSubmission, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    try {
      const reviewData = status === 'APPROVED' || status === 'REJECTED' ? { assignedHost, adminNotes } : undefined;
      await apiPatch(`/api/admin/submissions/${encodeURIComponent(request.id)}`, { status, reviewData });
      setReviewing(null);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to record visitor review.');
    }
  };

  const exportManifest = () => {
    const columns = ['Reference', 'Name', 'Organization', 'Hub', 'Date', 'Time', 'Status', 'Host'];
    const rows = filtered.map(request => [
      request.referenceCode,
      request.payload.fullName,
      request.payload.organization,
      request.payload.hubLocation,
      request.payload.requestedDate,
      request.payload.timeSlot,
      request.status,
      request.payload.assignedHost
    ]);
    const csv = [columns, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sihub_visitor_manifest_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Module 6.16 • Persistent visitor desk</span><h1 className="mt-1 text-2xl font-extrabold text-white">Campus visits and gate passes</h1><p className="mt-1 text-xs text-slate-400">Requests, security review, host assignment, and pass issuance are stored in PostgreSQL.</p></div>
        <div className="flex gap-2"><button onClick={exportManifest} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300"><Download className="h-4 w-4" />Export CSV</button><button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300"><RefreshCw className="h-4 w-4" />Refresh</button></div>
      </header>
      {error && <p role="alert" className="rounded border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, organization, reference" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white" /></label>
        <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Declined</option><option value="COMPLETED">Completed</option></select>
      </div>
      {loading && <p className="py-5 text-center text-xs text-slate-500">Loading visitor requests</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map(request => {
          const payload = request.payload;
          const pass = payload.visitorPass as Record<string, unknown> | undefined;
          return <article key={request.id} className="border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex items-center gap-2"><span className="font-mono text-[10px] font-bold text-cyan-300">{request.referenceCode}</span><span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300">{request.status}</span></div><h2 className="mt-2 text-sm font-bold text-white">{String(payload.fullName ?? '')}</h2><p className="text-[10px] text-slate-400">{String(payload.organization ?? 'Independent visitor')} · {String(payload.email ?? '')}</p></div>
              <div className="flex gap-1.5">{request.status === 'PENDING' && <button onClick={() => { setReviewing(request); setAssignedHost(String(payload.assignedHost ?? 'SiHub Visitor Desk')); setAdminNotes(String(payload.adminNotes ?? '')); }} className="rounded bg-cyan-800 px-2.5 py-1.5 text-[10px] font-bold text-white"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Review</button>}{request.status === 'APPROVED' && <button onClick={() => void decide(request, 'COMPLETED')} className="rounded bg-emerald-800 px-2.5 py-1.5 text-[10px] font-bold text-white"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Check in</button>}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-400"><span>Hub: <strong className="text-slate-200">{String(payload.hubLocation ?? '')}</strong></span><span>Date: <strong className="text-slate-200">{String(payload.requestedDate ?? '')}</strong></span><span>Time: <strong className="text-slate-200">{String(payload.timeSlot ?? '')}</strong></span><span>Delegation: <strong className="text-slate-200">{String(payload.visitorCount ?? 1)}</strong></span></div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{String(payload.customDetails ?? '')}</p>
            {pass && <div className="mt-3 rounded border border-emerald-900 bg-emerald-950/40 p-3 text-[10px] text-emerald-200"><strong>{String(pass.passNumber)}</strong> · Host: {String(pass.assignedHost)} · Clearance: {String(pass.securityClearanceCode)}</div>}
          </article>;
        })}
      </div>
      {!loading && filtered.length === 0 && <p className="border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No visitor requests match this filter.</p>}
      {reviewing && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"><form onSubmit={event => { event.preventDefault(); void decide(reviewing, 'APPROVED'); }} className="w-full max-w-lg space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-5 text-white"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Review {reviewing.referenceCode}</h2><button type="button" onClick={() => setReviewing(null)} className="text-xs text-slate-400">Close</button></div><label className="block text-[10px] font-semibold text-slate-400">Assigned host<input required value={assignedHost} onChange={event => setAssignedHost(event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label><label className="block text-[10px] font-semibold text-slate-400">Security notes<textarea value={adminNotes} onChange={event => setAdminNotes(event.target.value)} rows={3} className="mt-1 block w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /></label><div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => void decide(reviewing, 'REJECTED')} className="inline-flex items-center gap-1 rounded bg-rose-900 px-3 py-2 text-[10px] font-bold"><XCircle className="h-3.5 w-3.5" />Decline</button><button className="inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-2 text-[10px] font-bold"><CheckCircle2 className="h-3.5 w-3.5" />Approve and issue pass</button></div></form></div>}
    </div>
  );
};
