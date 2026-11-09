/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - CMS Overview Area
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Images,
  Compass,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Globe,
  Upload,
  Plus
} from 'lucide-react';
import type { CmsPageSection } from '../../../types/cmsBlocks';

interface CmsEntry {
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

interface MediaAsset {
  id: string;
  originalName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  byteSize: number;
  previewUrl: string;
}

interface CMSOverviewAreaProps {
  entries: CmsEntry[];
  media: MediaAsset[];
  navCategoriesCount: number;
  onNavigateToArea: (area: string) => void;
  onOpenNewPageModal: () => void;
  onSelectPage: (page: CmsEntry) => void;
}

export const CMSOverviewArea: React.FC<CMSOverviewAreaProps> = ({
  entries,
  media,
  navCategoriesCount,
  onNavigateToArea,
  onOpenNewPageModal,
  onSelectPage
}) => {
  const pageEntries = entries.filter(e => e.type === 'page');
  const publishedPages = pageEntries.filter(e => e.status === 'PUBLISHED');
  const draftPages = pageEntries.filter(e => e.status === 'DRAFT' || Boolean(e.content._draft));
  const otherEntries = entries.filter(e => e.type !== 'page');

  // Total sections across all pages
  const totalSectionsCount = pageEntries.reduce((acc, p) => {
    const content = (p.content._draft && typeof p.content._draft === 'object' ? p.content._draft : p.content) as Record<string, unknown>;
    const secs = Array.isArray(content.sections) ? (content.sections as CmsPageSection[]) : [];
    return acc + secs.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 border border-slate-800 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Centralized Website CMS & Visual Studio
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
            Somali Innovation Hub Website Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Direct institutional control of the public portal. Create new pages, structure navigation categories, arrange drag-and-drop content sections, upload media, and manage live publishing workflows.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigateToArea('studio')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Launch Visual Page Studio &rarr;
            </button>
            <button
              onClick={onOpenNewPageModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Create New Website Page
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Pages</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{pageEntries.length}</p>
          <span className="text-[10px] text-slate-500 block">Core & custom routes</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Published Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{publishedPages.length}</p>
          <span className="text-[10px] text-slate-500 block">Publicly accessible</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Working Drafts</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{draftPages.length}</p>
          <span className="text-[10px] text-slate-500 block">Private working copies</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Built Sections</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-300">{totalSectionsCount}</p>
          <span className="text-[10px] text-slate-500 block">Visual layout blocks</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Media Assets</span>
            <Images className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{media.length}</p>
          <span className="text-[10px] text-slate-500 block">Images, videos, PDFs</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Navigation Cats</span>
            <Compass className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-300">{navCategoriesCount}</p>
          <span className="text-[10px] text-slate-500 block">Header menu trees</span>
        </div>
      </div>

      {/* Quick Access Function Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateToArea('pages')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-600 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white">Pages Directory</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage all core institutional routes and custom dynamic pages. Configure slugs, titles, and publishing status.
          </p>
        </div>

        <div
          onClick={() => onNavigateToArea('navigation')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-600 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              <Compass className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white">Navigation Manager</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Add top-level navigation categories, create nested subsections, reorder links, and publish directly to the live header menu.
          </p>
        </div>

        <div
          onClick={() => onNavigateToArea('media')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-600 transition-all cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300">
              <Images className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-white">Media Library</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Centralized S3-compatible media asset repository. Upload, preview, tag, and reuse high-resolution photos and video streams.
          </p>
        </div>
      </div>

      {/* Architecture Flow & Recent Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Pages Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Website Pages Overview
            </h3>
            <button
              onClick={() => onNavigateToArea('pages')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              View All ({pageEntries.length}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold">
                  <th className="pb-2.5">Page Title</th>
                  <th className="pb-2.5">Route</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pageEntries.slice(0, 6).map(page => (
                  <tr key={page.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 font-bold text-white">{page.title}</td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">/{page.slug}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        page.status === 'PUBLISHED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : page.status === 'APPROVED'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => {
                          onSelectPage(page);
                          onNavigateToArea('studio');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold text-[11px] transition-colors"
                      >
                        Edit in Studio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Architecture Flow & Publishing Safeguards */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Publishing Safeguards
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Dual-State Draft Architecture</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Edits saved in the visual studio create a private working draft. The live public website continues to serve the published version until you explicitly click "Publish Live".
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Automated Revision Snapshots</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Every publish and save operation records a historical database revision, allowing instant one-click rollback to prior versions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Direct Public Integration</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When you publish, changes propagate in real-time to the public site without restarting servers or editing source code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
