import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '../../services/apiClient';

type Submission = { id: string; type: string; status: string; referenceCode: string; payload: Record<string, unknown>; createdAt: string; submitter?: { fullName: string; email: string } | null };
const label = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

interface BackendSubmissionManagerProps {
  submissionType?: string;
  heading?: string;
  allowCompletion?: boolean;
}

export const BackendSubmissionManager: React.FC<BackendSubmissionManagerProps> = ({ submissionType, heading = 'Applications and inquiries', allowCompletion = false }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const query = submissionType ? `?type=${encodeURIComponent(submissionType)}` : '';
      const result = await apiGet<{ submissions: Submission[] }>(`/api/admin/submissions${query}`);
      setSubmissions(result.submissions);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load server submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const decide = async (item: Submission, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    const reason = status === 'REJECTED' ? window.prompt('Optional rejection reason for the applicant:') : undefined;
    if (reason === null) return;
    try {
      await apiPatch(`/api/admin/submissions/${encodeURIComponent(item.id)}`, { status, ...(reason?.trim() ? { reason: reason.trim() } : {}) });
      await load();
      window.dispatchEvent(new Event('sihub-cms-update'));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to record the review decision.');
    }
  };

  const openPitchDeck = async (assetId: string) => {
    try {
      const result = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(assetId)}/download`);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to open the pitch deck.');
    }
  };

  return (
    <section className="space-y-4 border-t border-slate-800 pt-7">
      <header className="flex items-end justify-between gap-3">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Persistent review queue</span><h2 className="mt-1 text-xl font-extrabold text-white">{heading}</h2><p className="mt-1 text-xs text-slate-400">Review decisions and status changes are stored and audited server-side.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>
      {error && <p role="alert" className="rounded border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      {loading && <p className="py-4 text-center text-xs text-slate-500">Loading submissions</p>}
      <div className="space-y-2">
        {submissions.map(item => <article key={item.id} className="border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-200">{label(item.type)}</span><span className={`rounded px-2 py-0.5 text-[9px] font-bold ${item.status === 'PENDING' ? 'bg-amber-950 text-amber-200' : item.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>{label(item.status)}</span></div>
              <h3 className="mt-2 text-sm font-bold text-white">{String(item.payload.title ?? item.payload.name ?? item.payload.organizationName ?? item.payload.programTitle ?? item.payload.eventTitle ?? label(item.type))}</h3>
              <p className="mt-1 text-[10px] text-slate-500">{String(item.payload.fullName ?? item.payload.founderName ?? item.payload.contactPerson ?? item.submitter?.fullName ?? 'Public visitor')} · {String(item.payload.email ?? item.payload.founderEmail ?? item.payload.contactEmail ?? item.submitter?.email ?? '')}</p>
              <p className="mt-1 text-[10px] text-slate-500">{item.referenceCode} · {new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {item.status === 'PENDING' && <><button onClick={() => void decide(item, 'APPROVED')} className="inline-flex items-center gap-1 rounded bg-emerald-800 px-2.5 py-1.5 text-[10px] font-bold text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" />Approve</button><button onClick={() => void decide(item, 'REJECTED')} className="inline-flex items-center gap-1 rounded bg-rose-900 px-2.5 py-1.5 text-[10px] font-bold text-rose-100"><XCircle className="h-3.5 w-3.5" />Reject</button></>}
              {allowCompletion && item.status === 'APPROVED' && <button onClick={() => void decide(item, 'COMPLETED')} className="inline-flex items-center gap-1 rounded bg-cyan-800 px-2.5 py-1.5 text-[10px] font-bold text-cyan-100"><CheckCircle2 className="h-3.5 w-3.5" />Mark attended</button>}
            </div>
          </div>
          <details className="mt-3 border-t border-slate-800 pt-2"><summary className="cursor-pointer text-[10px] font-semibold text-slate-400">View submitted details</summary>{typeof item.payload.pitchDeckAssetId === 'string' && <button onClick={() => void openPitchDeck(item.payload.pitchDeckAssetId as string)} className="mt-2 text-[10px] font-semibold text-cyan-300">Open verified pitch deck</button>}<pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-900 p-3 text-[10px] text-slate-300">{JSON.stringify(item.payload, null, 2)}</pre></details>
        </article>)}
        {!loading && submissions.length === 0 && <p className="border border-slate-800 bg-slate-950 p-5 text-xs text-slate-500">No submissions recorded.</p>}
      </div>
    </section>
  );
};
