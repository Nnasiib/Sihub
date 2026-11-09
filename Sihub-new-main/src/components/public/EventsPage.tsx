/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Events Calendar & Registration Page
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { SiHubEvent } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DynamicCmsSections } from './DynamicCmsSections';

type EventsCmsPage = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  categories?: string[];
};

const defaultEventCategories = ['All', 'Conference', 'Hackathon', 'Demo Day'];

export const EventsPage: React.FC = () => {
  const { setSelectedEventForRegister } = useApp();
  const { page: cmsPage } = useCmsPage<EventsCmsPage>('events');
  const { items: events } = useCmsCollection<SiHubEvent>('event');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = cmsPage?.categories?.length ? cmsPage.categories : defaultEventCategories;

  const eventTypeAliases: Record<string, string> = {
    conference: 'Conference',
    summit: 'Conference',
    talks: 'Conference',
    hackathon: 'Hackathon',
    demoday: 'Demo Day',
    'demo-day': 'Demo Day',
    expo: 'Demo Day'
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (!type) {
      setFilterCategory('All');
      return;
    }

    const normalized = type.trim().toLowerCase();
    const directMatch = categories.find(category => category.toLowerCase() === normalized.toLowerCase());
    const aliasMatch = eventTypeAliases[normalized] || eventTypeAliases[normalized.replace(/[_\s]+/g, '-')];
    setFilterCategory(directMatch || aliasMatch || 'All');
  }, [categories]);

  const applyTypeFilter = (nextCategory: string) => {
    setFilterCategory(nextCategory);

    const params = new URLSearchParams(window.location.search);
    if (nextCategory === 'All') {
      params.delete('type');
    } else {
      const alias = Object.entries(eventTypeAliases).find(([, label]) => label === nextCategory)?.[0];
      params.set('type', alias ?? nextCategory);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  };

  const filtered = filterCategory === 'All'
    ? events
    : events.filter(e => e.category === filterCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <DynamicCmsSections pageSlug="events" placement="top" />
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          {cmsPage?.eyebrow ?? 'Gatherings & Masterclasses'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Events & Innovation Summits'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Join policymakers, diaspora venture capital investors, agricultural pioneers, and young engineers at national summits, hackathons, and angel pitch days.'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => applyTypeFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterCategory === cat
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {filtered.map(evt => (
          <div
            key={evt.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs hover:shadow-lg transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          >
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 uppercase tracking-wider">
                  {evt.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {evt.locationType}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">{evt.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

              <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Calendar className="w-4 h-4 text-cyan-600" /> {evt.date}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Clock className="w-4 h-4 text-cyan-600" /> {evt.time}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600" /> {evt.venue}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-4 h-4 text-indigo-600" /> {evt.registeredCount} / {evt.capacity} Registered
                </span>
              </div>

              <div className="text-xs text-slate-500">
                Keynote / Lead: <strong className="text-slate-800">{evt.speaker}</strong>
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                onClick={() => setSelectedEventForRegister(evt)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Register & Generate QR Pass &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
      <DynamicCmsSections pageSlug="events" placement="bottom" />
    </div>
  );
};
