/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Startup Venture Hub & Directory Page
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Startup } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { DynamicCmsSections } from './DynamicCmsSections';
import {
  Rocket,
  Search,
  Filter,
  DollarSign,
  MapPin,
  Users,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  Building
} from 'lucide-react';

export const StartupHubPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('startups');
  const { setIsStartupModalOpen, language } = useApp();
  const { items: startups } = useCmsCollection<Startup>('startup');

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedStartupDetail, setSelectedStartupDetail] = useState<Startup | null>(null);

  const sectors = ['All', 'AgriTech', 'CleanTech / Energy', 'HealthTech', 'EdTech', 'Fintech'];

  const filtered = startups.filter(st => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.tagline.toLowerCase().includes(search.toLowerCase()) ||
      st.location.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === 'All' || st.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <DynamicCmsSections pageSlug="startups" placement="top" />
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          {cmsPage?.eyebrow ?? 'Venture Studio & Pipeline'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Startup Hub'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Discover high-impact startups revolutionizing dairy cold chains, solar grids, remote maternal care, and STEM learning across the Somali regions.'}
        </p>

        <div className="pt-2">
          <button
            onClick={() => setIsStartupModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            <Rocket className="w-4 h-4" />
            Pitch Your Startup for Incubation & Seed Grant &rarr;
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search startup name, location, solution..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSector === sec
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Startups Directory Grid */}
      <div id="directory" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(st => (
          <div
            key={st.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {st.sector}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {st.stage}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{st.name}</h3>
                <p className="text-xs text-cyan-800 font-medium italic mt-0.5">{st.tagline}</p>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {st.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Founder:</span>
                <strong className="text-slate-800">{st.founderName}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-600" /> Location:</span>
                <strong className="text-slate-800">{st.location}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Funding:</span>
                <strong className="text-emerald-600 font-bold">{st.fundingRaised}</strong>
              </div>

              <button
                onClick={() => setSelectedStartupDetail(st)}
                className="w-full mt-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                View Full Venture Profile &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Startup Profile Modal */}
      {selectedStartupDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
              <button
                onClick={() => setSelectedStartupDetail(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {selectedStartupDetail.sector} • {selectedStartupDetail.stage}
              </span>
              <h3 className="text-2xl font-bold pr-6">{selectedStartupDetail.name}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedStartupDetail.tagline}</p>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Founder</span>
                  <strong className="text-slate-900 block truncate">{selectedStartupDetail.founderName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Team</span>
                  <strong className="text-slate-900">{selectedStartupDetail.teamSize} Members</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Location</span>
                  <strong className="text-slate-900 block truncate">{selectedStartupDetail.location}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Cohort</span>
                  <strong className="text-emerald-600 block truncate">{selectedStartupDetail.incubationCohort || 'Active'}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Problem Addressed</h4>
                <p className="leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-slate-800">
                  {selectedStartupDetail.problemStatement}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Proposed Solution & Technology</h4>
                <p className="leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-slate-800">
                  {selectedStartupDetail.solution}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Assigned Mentor & Growth Support</h4>
                <p className="text-slate-600">
                  Mentor: <strong>{selectedStartupDetail.mentorAssigned || 'Senior SiHub Advisory Board'}</strong>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedStartupDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DynamicCmsSections pageSlug="startups" placement="bottom" />
    </div>
  );
};
