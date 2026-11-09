/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Drafts & Publishing Management Area
 * Dual-state publishing pipeline: inspect draft deltas, side-by-side comparison, and 1-click publishing.
 */

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, apiPost, ApiError } from '../../../services/apiClient';
import { useApp } from '../../../context/AppContext';
import { CmsPageRecord } from './PagesManagerArea';
import {
  GitPullRequest,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Diff
} from 'lucide-react';

interface ExtendedCmsPageRecord extends CmsPageRecord {
  hasDraftChanges?: boolean;
  sectionsCount?: number;
}

interface DraftsPublishingAreaProps {
  onOpenPageInStudio: (slug: string) => void;
}

export const DraftsPublishingArea: React.FC<DraftsPublishingAreaProps> = ({
  onOpenPageInStudio
}) => {
  const { addToast } = useApp();
  const [pages, setPages] = useState<ExtendedCmsPageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingSlug, setPublishingSlug] = useState<string | null>(null);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [selectedDiffPage, setSelectedDiffPage] = useState<ExtendedCmsPageRecord | null>(null);

  const fetchPages = async () => {
    try {
      const res = await apiGet<{ pages: CmsPageRecord[] }>('/api/cms/pages');
      const mapped: ExtendedCmsPageRecord[] = (res.pages || []).map(p => {
        const sections = Array.isArray((p.content as any)?.sections) ? (p.content as any).sections : [];
        return {
          ...p,
          sectionsCount: sections.length,
          hasDraftChanges: p.status === 'DRAFT'
        };
      });
      setPages(mapped);
    } catch (err) {
      console.warn('Failed to fetch pages for draft manager', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handlePublishPage = async (page: CmsPageRecord) => {
    setPublishingSlug(page.slug);
    try {
      // Calling PUT /api/cms/page/:slug with publishNow: true
      await apiPut(`/api/cms/page/${page.slug}`, {
        publishNow: true,
        summary: `Published via Drafts & Publishing Manager`
      });
      addToast('success', 'Page Published', `Page "${page.title}" is now live on the public website.`);
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
      await fetchPages();
    } catch (err) {
      addToast('error', 'Publish Failed', err instanceof ApiError ? err.message : 'Unknown error');
    } finally {
      setPublishingSlug(null);
    }
  };

  const handleBatchPublish = async () => {
    const pendingPages = pages.filter(p => p.hasDraftChanges || p.status === 'DRAFT');
    if (pendingPages.length === 0) {
      addToast('info', 'All Up to Date', 'No unpublished drafts found.');
      return;
    }
    setBatchPublishing(true);
    let successCount = 0;
    for (const page of pendingPages) {
      try {
        await apiPut(`/api/cms/page/${page.slug}`, {
          publishNow: true,
          summary: 'Batch published all pending drafts'
        });
        successCount++;
      } catch (err) {
        console.error(`Error publishing ${page.slug}`, err);
      }
    }
    setBatchPublishing(false);
    addToast('success', 'Batch Publish Complete', `Published ${successCount} pages to the live site.`);
    window.dispatchEvent(new CustomEvent('sihub-cms-update'));
    await fetchPages();
  };

  const pendingDrafts = pages.filter(p => p.hasDraftChanges || p.status === 'DRAFT');
  const publishedPages = pages.filter(p => p.status === 'PUBLISHED' && !p.hasDraftChanges);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-1">
            <GitPullRequest className="w-4 h-4" /> Dual-State Governance Engine
          </div>
          <h2 className="text-2xl font-extrabold font-heading">Drafts & Live Site Publishing</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Review unpublished revisions before deploying them to the public portal. Content updates in the Visual Builder remain private until you explicitly publish.
          </p>
        </div>

        {pendingDrafts.length > 0 && (
          <button
            type="button"
            onClick={handleBatchPublish}
            disabled={batchPublishing}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {batchPublishing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {batchPublishing ? 'Publishing Pipeline...' : `Publish All (${pendingDrafts.length}) Drafts &rarr;`}
          </button>
        )}
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unpublished Drafts</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingDrafts.length}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Synchronized Pages</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{publishedPages.length}</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Managed Pages</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{pages.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Layers className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Pending Drafts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Pending Draft Changes ({pendingDrafts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Live visitors see the previously published version</span>
        </div>

        {pendingDrafts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-950">All Pages are Synchronized!</h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              There are no unpublished draft edits pending. Every page on your public website is serving its latest revision.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {pendingDrafts.map(page => {
              const isPublishing = publishingSlug === page.slug;
              return (
                <div
                  key={page.slug}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 font-heading">{page.title}</span>
                      <span className="text-xs font-mono text-slate-400">/{page.slug}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Unpublished Draft
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Contains {page.sectionsCount} total dynamic section(s).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenPageInStudio(page.slug)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-600" /> Edit Draft in Studio
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePublishPage(page)}
                      disabled={isPublishing}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isPublishing ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {isPublishing ? 'Publishing...' : 'Deploy to Live Site'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Up to Date Published Pages */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-extrabold text-slate-900 font-heading">
            Live Synchronized Pages ({publishedPages.length})
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {publishedPages.map(page => (
            <div
              key={page.slug}
              className="p-4 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{page.title}</span>
                  <span className="text-slate-400 font-mono ml-2">/{page.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPageInStudio(page.slug)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                >
                  Edit in Studio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
