import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { apiGet, ApiError } from '../../services/apiClient';

type TrackedSubmission = { referenceCode: string; type: string; status: string; createdAt: string };

export const SubmissionTrackingPage: React.FC = () => {
  const [referenceCode, setReferenceCode] = useState('');
  const [email, setEmail] = useState('');
  const [submission, setSubmission] = useState<TrackedSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSubmission(null);
    try {
      const result = await apiGet<{ submission: TrackedSubmission }>(`/api/submissions/track/${encodeURIComponent(referenceCode.trim())}?email=${encodeURIComponent(email.trim())}`);
      setSubmission(result.submission);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 404 ? 'No submission matches that reference and email.' : reason instanceof ApiError ? reason.message : 'Unable to retrieve this submission.');
    } finally { setLoading(false); }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-slate-200 pb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Submission status</span>
        <h1 className="text-3xl font-extrabold text-slate-900">Track a SiHub request</h1>
        <p className="text-sm text-slate-600">Use the reference code from your receipt and the email address used when submitting.</p>
      </header>
      <form onSubmit={lookup} className="space-y-4 border border-slate-200 bg-white p-5">
        <label className="block text-xs font-semibold text-slate-700">Reference code<input required value={referenceCode} onChange={event => setReferenceCode(event.target.value)} maxLength={40} autoCapitalize="characters" className="mt-1 block w-full border border-slate-300 px-3 py-2.5 text-sm" /></label>
        <label className="block text-xs font-semibold text-slate-700">Submission email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} className="mt-1 block w-full border border-slate-300 px-3 py-2.5 text-sm" /></label>
        <button disabled={loading} className="inline-flex items-center gap-2 bg-cyan-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50"><Search className="h-4 w-4" />{loading ? 'Checking…' : 'Check status'}</button>
      </form>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {submission && <section role="status" className="space-y-3 border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{submission.type.replaceAll('-', ' ')}</span><h2 className="mt-1 font-mono text-lg font-bold text-slate-900">{submission.referenceCode}</h2></div><span className="bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800">{submission.status.replaceAll('_', ' ')}</span></div>
        <p className="text-xs text-slate-600">Received {new Date(submission.createdAt).toLocaleString()}</p>
      </section>}
    </main>
  );
};
