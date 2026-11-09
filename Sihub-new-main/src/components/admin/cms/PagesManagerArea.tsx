/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Pages Manager Area
 * Comprehensive management of core institutional pages and custom dynamic pages.
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Edit3,
  Archive,
  RotateCcw
} from 'lucide-react';
import type { CmsPageSection } from '../../../types/cmsBlocks';

export interface CmsEntry {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary: string | null;
  content: Record<string, unknown>;
  status: string;
  deletedAt: string | null;
  updatedAt: string;
}

export type CmsPageRecord = CmsEntry;

interface PagesManagerAreaProps {
  entries: CmsEntry[];
  onSelectPage: (page: CmsEntry) => void;
  onOpenStudio: () => void;
  onOpenNewPageModal: () => void;
  onDuplicatePage: (page: CmsEntry) => Promise<void>;
  onDeletePage: (id: string) => Promise<void>;
  onRestorePage?: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export const PagesManagerArea: React.FC<PagesManagerAreaProps> = ({
  entries,
  onSelectPage,
  onOpenStudio,
  onOpenNewPageModal,
  onDuplicatePage,
  onDeletePage,
  onRestorePage,
  onUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const pageEntries = entries.filter(e => e.type === 'page');

  const filteredPages = pageEntries.filter(p => {
    const matchesSearch = `${p.title} ${p.slug} ${p.summary || ''}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'published') return p.status === 'PUBLISHED';
    if (filterStatus === 'draft') return p.status === 'DRAFT' || Boolean(p.content._draft);
    if (filterStatus === 'archived') return p.status === 'ARCHIVED' || p.deletedAt !== null;
    return true;
  });

  const getPageSectionCount = (page: CmsEntry) => {
    const content = (page.content._draft && typeof page.content._draft === 'object' ? page.content._draft : page.content) as Record<string, unknown>;
    const sections = Array.isArray(content.sections) ? (content.sections as CmsPageSection[]) : [];
    return sections.length;
  };

  const getPagePublicUrl = (slug: string) => {
    const standardRoutes: Record<string, string> = {
      home: '/',
      about: '/about',
      programs: '/programs',
      startups: '/entrepreneurship',
      courses: '/institute',
      innovation: '/innovation',
      community: '/community',
      events: '/events',
      opportunities: '/opportunities',
      mentorship: '/mentorship',
      partnerships: '/partnerships',
      impact: '/impact',
      news: '/news',
      contact: '/contact'
    };
    return standardRoutes[slug] || `/pages/${slug}`;
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-slate-950 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Website Pages Directory ({pageEntries.length} Total)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage institutional landing pages and dynamic custom pages. Open any page in the Visual Builder to modify its layout.
          </p>
        </div>

        <button
          onClick={onOpenNewPageModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Page</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { key: 'all', label: `All Pages (${pageEntries.length})` },
            { key: 'published', label: `Published (${pageEntries.filter(p => p.status === 'PUBLISHED').length})` },
            { key: 'draft', label: `Drafts (${pageEntries.filter(p => p.status === 'DRAFT' || Boolean(p.content._draft)).length})` },
            { key: 'archived', label: `Archived (${pageEntries.filter(p => p.status === 'ARCHIVED' || p.deletedAt).length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === tab.key
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            placeholder="Search by title, slug, summary…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Page Title</th>
                <th className="py-3 px-4">Route Path</th>
                <th className="py-3 px-4">Sections</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPages.map(page => {
                const sectionCount = getPageSectionCount(page);
                const publicUrl = getPagePublicUrl(page.slug);
                const hasDraft = Boolean(page.content._draft);
                const isArchived = page.status === 'ARCHIVED' || page.deletedAt !== null;

                return (
                  <tr key={page.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block text-sm">{page.title}</span>
                        {page.summary && <p className="text-[11px] text-slate-400 line-clamp-1">{page.summary}</p>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {publicUrl}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-[11px] font-mono">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {sectionCount} sections
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          page.status === 'PUBLISHED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : page.status === 'APPROVED'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : isArchived
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {page.status}
                        </span>
                        {hasDraft && (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-700">
                            Draft Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onSelectPage(page);
                            onOpenStudio();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Open Visual Builder"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Build</span>
                        </button>

                        <button
                          onClick={() => void onDuplicatePage(page)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {page.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => void onUpdateStatus(page.id, 'DRAFT')}
                            className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 text-[11px]"
                            title="Unpublish page"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={() => void onUpdateStatus(page.id, 'PUBLISHED')}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px]"
                            title="Publish Live"
                          >
                            Publish
                          </button>
                        )}

                        {isArchived && onRestorePage ? (
                          <button
                            onClick={() => void onRestorePage(page.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800"
                            title="Restore page"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => void onDeletePage(page.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800"
                            title="Delete or archive page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPages.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No pages matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
