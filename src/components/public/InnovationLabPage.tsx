/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Multi-Sector Innovation Lab Page
 */

import React, { useState } from 'react';
import { InnovationProject } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import {
  Sprout,
  Sun,
  HeartPulse,
  Code2,
  BookOpen,
  FlaskConical,
  Palette,
  Users2,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Layers
} from 'lucide-react';

export const InnovationLabPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('innovation');
  const { items: projects } = useCmsCollection<InnovationProject>('innovation');
  const [activeSector, setActiveSector] = useState<string>('All');

  const sectors = [
    { id: 'All', label: 'All Projects', icon: <Layers className="w-4 h-4" /> },
    { id: 'Agriculture', label: 'Agriculture & Water', icon: <Sprout className="w-4 h-4 text-emerald-500" /> },
    { id: 'Technology', label: 'Tech & Somali AI', icon: <Code2 className="w-4 h-4 text-cyan-500" /> },
    { id: 'Environment', label: 'Climate & Clean Energy', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { id: 'Health', label: 'Health & Telemed', icon: <HeartPulse className="w-4 h-4 text-rose-500" /> }
  ];

  const filtered = activeSector === 'All'
    ? projects
    : projects.filter(p => p.sector === activeSector);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          {cmsPage?.eyebrow ?? 'Applied R&D & Prototyping'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Multi-Sector Innovation Lab'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Browse published innovation projects and their reported milestones.'}
        </p>
      </div>

      {/* Sector Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sectors.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSector(sec.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSector === sec.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {sec.icon}
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Projects Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map(proj => (
          <div
            key={proj.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs hover:shadow-lg transition-all space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
                {proj.sector}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                proj.status === 'Pilot Tested'
                  ? 'bg-emerald-100 text-emerald-800'
                  : proj.status === 'In Progress'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                ● {proj.status}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">{proj.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>Lead: <strong className="text-slate-800">{proj.leadResearcher}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-600" /> {proj.location}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

            {/* Objectives */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Key Deliverables & Objectives:
              </span>
              {proj.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>

            {/* Milestones & Progress */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Research Milestones:
              </span>
              <div className="space-y-1.5">
                {proj.milestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className={`flex items-center gap-2 ${m.completed ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      {m.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {m.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span>Impact Target: </span>
                <strong className="text-cyan-700 font-bold">{proj.beneficiariesCount.toLocaleString()} Citizens</strong>
              </div>
              <div>
                <span>R&D Allocation: </span>
                <strong className="text-slate-800 font-bold">{proj.budgetEstimated}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
