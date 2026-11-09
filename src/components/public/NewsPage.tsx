/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - News, Insights & Publications Page
 */

import React, { useState } from 'react';
import { NewsArticle } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Download,
  BookOpen,
  X
} from 'lucide-react';
import { DynamicCmsSections } from './DynamicCmsSections';

export const NewsPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('news');
  const { items: news } = useCmsCollection<NewsArticle>('news');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <DynamicCmsSections pageSlug="news" placement="top" />
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          {cmsPage?.eyebrow ?? 'Thought Leadership & Press'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub News & Research Publications'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Stay updated on startup milestone achievements, research papers on renewable micro-grids, and national digital policy whitepapers.'}
        </p>
      </div>

      {/* Featured Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {news.map(art => (
          <div
            key={art.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 overflow-hidden">
                <CmsMedia src={art.coverImage} kind={art.coverImageType ?? 'image'} alt={art.coverImageAlt ?? art.title} caption={art.coverImageCaption} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                <div className="absolute top-3 left-3 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {art.category}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {art.publishedAt}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {art.readTime}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{art.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{art.summary}</p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setSelectedArticle(art)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
            <div className="relative h-56">
              <CmsMedia src={selectedArticle.coverImage} kind={selectedArticle.coverImageType ?? 'image'} alt={selectedArticle.coverImageAlt ?? selectedArticle.title} caption={selectedArticle.coverImageCaption} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded-full">
                {selectedArticle.category}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-700">
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>Published: {selectedArticle.publishedAt}</span>
                <span>•</span>
                <span>By: {selectedArticle.author}</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 font-heading leading-snug">
                {selectedArticle.title}
              </h2>

              <p className="text-sm font-semibold text-slate-800 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedArticle.summary}
              </p>

              <div className="space-y-3 leading-relaxed text-slate-700 pt-2">
                <p>{selectedArticle.content}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">SiHub Official Communication</span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DynamicCmsSections pageSlug="news" placement="bottom" />
    </div>
  );
};
