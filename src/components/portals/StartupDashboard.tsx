import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiGet, apiPost, ApiError } from '../../services/apiClient';

type Pitch = { id: string; referenceCode: string; status: string; createdAt: string; payload: Record<string, unknown> };

export const StartupDashboard: React.FC = () => {
  const { authUser } = useApp();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [name, setName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [tagline, setTagline] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ submissions: Pitch[] }>('/api/submissions/mine?type=startup-pitch');
      setPitches(result.submissions);
      setError('');
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to load your submitted pitches.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const submitPitch = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    try {
      await apiPost('/api/submissions/startup-pitch', { payload: { name, tagline, founderName: authUser?.fullName ?? '', founderEmail: authUser?.email ?? '', problemStatement, solution } });
      setName(''); setTagline(''); setProblemStatement(''); setSolution('');
      setNotice('Startup pitch submitted to the SiHub review queue.');
      await load();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to submit your pitch.'); }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5"><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Founder workspace</span><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Startup pitches</h1><p className="mt-2 text-sm text-slate-600">Your submissions and review status are stored in your SiHub account.</p></header>
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}{notice && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      <form onSubmit={submitPitch} className="space-y-3 border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Submit a pitch</h2><input required value={name} onChange={event => setName(event.target.value)} placeholder="Startup name" className="w-full rounded border border-slate-300 p-2 text-xs" /><input value={tagline} onChange={event => setTagline(event.target.value)} placeholder="Short description" className="w-full rounded border border-slate-300 p-2 text-xs" /><textarea required minLength={5} value={problemStatement} onChange={event => setProblemStatement(event.target.value)} placeholder="Problem statement" className="w-full rounded border border-slate-300 p-2 text-xs" /><textarea required minLength={5} value={solution} onChange={event => setSolution(event.target.value)} placeholder="Solution and business model" className="w-full rounded border border-slate-300 p-2 text-xs" /><button className="rounded bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Submit for review</button>
      </form>
      <section className="space-y-3"><h2 className="font-bold text-slate-900">Your submissions</h2>{loading && <p className="text-xs text-slate-500">Loading…</p>}{pitches.map(pitch => <article key={pitch.id} className="border border-slate-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{String(pitch.payload.name ?? 'Startup pitch')}</strong><span className="text-[10px] font-bold uppercase text-emerald-700">{pitch.status}</span></div><p className="mt-1 text-xs text-slate-600">{String(pitch.payload.tagline ?? pitch.payload.problemStatement ?? '')}</p><p className="mt-2 font-mono text-[10px] text-slate-500">{pitch.referenceCode} · {new Date(pitch.createdAt).toLocaleString()}</p></article>)}{!loading && !pitches.length && <p className="text-xs text-slate-500">No pitches submitted yet.</p>}</section>
    </main>
  );
};
