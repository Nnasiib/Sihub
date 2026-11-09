/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Revision History Management Area
 * Complete audit trail, snapshot inspector, and 1-click rollback engine.
 */

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, ApiError } from '../../../services/apiClient';
import { useApp } from '../../../context/AppContext';
import {
  History,
  RotateCcw,
  Eye,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Code,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

export interface RevisionItem {
  id: string;
  entryId: string;
  revisionNumber: number;
  type: string;
  slug: string;
  title: string;
  summary?: string | null;
  content: unknown;
  status: string;
  createdAt: string;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  entry?: {
    id: string;
    title: string;
    slug: string;
    type: string;
  } | null;
}

export const RevisionHistoryArea: React.FC = () => {
  const { addToast } = useApp();
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [inspectingRevision, setInspectingRevision] = useState<RevisionItem | null>(null);

  const fetchRevisions = async () => {
    try {
      const res = await apiGet<{ revisions: RevisionItem[] }>('/api/cms/admin/revisions');
      setRevisions(res.revisions || []);
    } catch (err) {
      console.warn('Failed to load revision history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleRollback = async (rev: RevisionItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to rollback "${rev.title}" to Revision #${rev.revisionNumber}?\n\nThis will restore its content to the state from ${new Date(rev.createdAt).toLocaleString()}.`
    );
    if (!confirmed) return;

    setRollingBackId(rev.id);
    try {
      await apiPost(`/api/cms/admin/revisions/${rev.id}/rollback`, {});
      addToast('success', 'Rollback Successful', `Restored ${rev.title} to revision #${rev.revisionNumber}.`);
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
      await fetchRevisions();
    } catch (err) {
      addToast('error', 'Rollback Failed', err instanceof ApiError ? err.message : 'Unknown error');
    } finally {
      setRollingBackId(null);
    }
  };

  const filteredRevisions = revisions.filter(rev => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rev.title.toLowerCase().includes(q) ||
      rev.slug.toLowerCase().includes(q) ||
      (rev.summary && rev.summary.toLowerCase().includes(q)) ||
      (rev.author?.email && rev.author.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">
            <History className="w-4 h-4" /> Immutable Audit Trail
          </div>
          <h2 className="text-2xl font-extrabold font-heading">Revision History & Rollback</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Every update made via the Visual Builder, API, or Section Editor creates a permanent snapshot with author metadata, timestamp, and instant rollback capability.
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-indigo-300">{revisions.length}</div>
          <span className="text-[11px] text-slate-400">Total Archival Snapshots</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by page title, slug, or summary..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={fetchRevisions}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Refresh Timeline
        </button>
      </div>

      {/* Revisions List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading revision archives...</div>
        ) : filteredRevisions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Historical Revisions Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Revisions are automatically captured whenever a page is saved or published in the Visual Builder.
            </p>
          </div>
        ) : (
          filteredRevisions.map(rev => {
            const isRolling = rollingBackId === rev.id;
            const authorName = rev.author ? `${rev.author.firstName || ''} ${rev.author.lastName || ''}`.trim() || rev.author.email : 'System Admin';
            return (
              <div
                key={rev.id}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Rev #{rev.revisionNumber}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 font-heading">
                      {rev.title || rev.entry?.title || rev.slug}
                    </span>
                    <span className="text-xs font-mono text-slate-400">/{rev.slug}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {rev.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    {rev.summary || 'Content snapshot before page modification'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {authorName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectingRevision(rev)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Code className="w-3.5 h-3.5 text-slate-500" /> Inspect JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRollback(rev)}
                    disabled={isRolling}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isRolling ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    {isRolling ? 'Restoring...' : 'Rollback to This'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Snapshot Inspector Modal */}
      {inspectingRevision && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold">
                  Revision #{inspectingRevision.revisionNumber} Snapshot
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  {inspectingRevision.title} (/{inspectingRevision.slug})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRevision(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(inspectingRevision.content, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <span className="text-xs text-slate-500">
                Created: {new Date(inspectingRevision.createdAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  const target = inspectingRevision;
                  setInspectingRevision(null);
                  handleRollback(target);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Rollback to This Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
