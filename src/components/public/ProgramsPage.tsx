/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Dedicated Programs Directory Page
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Program, ProgramApplication } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import { DynamicCmsSections } from './DynamicCmsSections';
import { apiGet, apiPost, ApiError } from '../../services/apiClient';
import {
  Rocket,
  CheckCircle2,
  Calendar,
  Users,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

type ProgramsCmsPage = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  categories?: string[];
};

const defaultProgramCategories = [
  'All',
  'Digital Skills Development',
  'Youth Empowerment',
  'Social Innovation',
  'Women in Innovation',
  'Inclusive Digital Inclusion',
  'Green Innovation & Sustainability',
  'Youth Peace Innovation',
  'Community Development'
];

const defaultPrograms: Program[] = [
  {
    id: 'prg-flagship-2026',
    title: 'SiHub Flagship Tech Incubator',
    category: 'Incubation',
    summary: 'A 16-week intensive venture acceleration track offering prototyping grants, mentorship, and investor demo days.',
    objectives: [
      'De-risk early-stage product prototypes',
      'Provide up to $10,000 milestone seed grants',
      'Connect ventures with diaspora and regional angels'
    ],
    targetAudience: 'Early-stage tech and tech-enabled Somali founders',
    duration: '16 Weeks',
    eligibility: ['Somali resident or diaspora team', 'Working prototype or proof of concept'],
    cohortSize: 25,
    status: 'Open',
    deadline: '2026-12-15',
    coordinator: 'Innovation Director Liban',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Tech Incubator participants collaborating',
    thumbnailUrlType: 'image'
  },
  {
    id: 'prg-switi-women',
    title: 'Women in Digital Innovation Fellowship',
    category: 'Women in Innovation',
    summary: 'Empowering female technologists and entrepreneurs through hands-on software development, product management, and leadership residencies.',
    objectives: [
      'Upskill 40 female engineers in modern web and mobile stacks',
      'Launch 10 women-led social ventures',
      'Establish bilateral mentorship with global tech executives'
    ],
    targetAudience: 'Female tech graduates, aspiring developers, and founders',
    duration: '12 Weeks',
    eligibility: ['Female applicants residing across Somali federal member states'],
    cohortSize: 30,
    status: 'Open',
    deadline: '2026-11-30',
    coordinator: 'Faduma Warsame',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Women in tech fellowship cohort',
    thumbnailUrlType: 'image'
  },
  {
    id: 'prg-agri-seed',
    title: 'Green Innovation & Climate Resilience Lab',
    category: 'Seed Grant',
    summary: 'Supporting technological breakthroughs in solar energy, drought-resistant agriculture, and plastic circular economy.',
    objectives: [
      'Pilot 5 scalable climate adaptation technologies in arid regions',
      'Equip agri-entrepreneurs with IoT water management sensors'
    ],
    targetAudience: 'Clean energy innovators, agricultural engineers, and eco-enterprises',
    duration: '20 Weeks',
    eligibility: ['Clear environmental impact thesis and field testing pilot capability'],
    cohortSize: 20,
    status: 'Upcoming',
    deadline: '2027-01-20',
    coordinator: 'Dr. Hassan Shire',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Solar and clean energy project',
    thumbnailUrlType: 'image'
  }
];

export const ProgramsPage: React.FC = () => {
  const { addToast, triggerRefresh, currentUser, authUser, navigateTo } = useApp();
  const { page: cmsPage } = useCmsPage<ProgramsCmsPage>('programs');
  const { items: programs } = useCmsCollection<Program>('program');
  const safePrograms = Array.isArray(programs) && programs.length > 0 ? programs : defaultPrograms;
  const [applications, setApplications] = useState<ProgramApplication[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProgramModal, setActiveProgramModal] = useState<Program | null>(null);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [ventureName, setVentureName] = useState('');
  const [proposalBrief, setProposalBrief] = useState('');
  const officialSubprogrammes = cmsPage?.categories?.length ? cmsPage.categories : defaultProgramCategories;

  const trackAliases: Record<string, string> = {
    'digital-skills': 'Digital Skills Development',
    'youth-empowerment': 'Youth Empowerment',
    'social-innovation': 'Social Innovation',
    'women-in-innovation': 'Women in Innovation',
    'women-innovation': 'Women in Innovation',
    'digital-inclusion': 'Inclusive Digital Inclusion',
    'inclusive-digital': 'Inclusive Digital Inclusion',
    'green-innovation': 'Green Innovation & Sustainability',
    'green-sustainability': 'Green Innovation & Sustainability',
    'youth-peace': 'Youth Peace Innovation',
    'community-development': 'Community Development',
    'community-dev': 'Community Development'
  };

  useEffect(() => {
    if (!authUser) {
      setApplications([]);
      return;
    }
    let active = true;
    apiGet<{ submissions: { id: string; status: string; createdAt: string; payload: Record<string, unknown> }[] }>('/api/submissions/mine?type=program-application')
      .then(({ submissions }) => {
        if (!active) return;
        setApplications(submissions.map(item => ({
          id: item.id,
          programId: String(item.payload.programId ?? ''),
          programTitle: String(item.payload.programTitle ?? ''),
          userId: authUser.id,
          applicantName: String(item.payload.fullName ?? ''),
          applicantEmail: String(item.payload.email ?? ''),
          applicantPhone: String(item.payload.phone ?? ''),
          ventureName: String(item.payload.ventureName ?? ''),
          proposalBrief: String(item.payload.proposalBrief ?? ''),
          status: item.status === 'APPROVED' ? 'approved' : item.status === 'REJECTED' ? 'rejected' : 'under_review',
          submittedAt: item.createdAt
        })));
      })
      .catch(() => { if (active) setApplications([]); });
    return () => { active = false; };
  }, [authUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const track = params.get('track');
    if (!track) {
      setSelectedCategory('All');
      return;
    }

    const normalized = track.trim().toLowerCase();
    const directMatch = officialSubprogrammes.find(cat => cat.toLowerCase() === normalized.toLowerCase());
    const aliasMatch = trackAliases[normalized] || trackAliases[normalized.replace(/[_\s]+/g, '-')];
    setSelectedCategory(directMatch || aliasMatch || 'All');
  }, [officialSubprogrammes]);

  const applyTrackFilter = (nextCategory: string) => {
    setSelectedCategory(nextCategory);

    const params = new URLSearchParams(window.location.search);
    if (nextCategory === 'All') {
      params.delete('track');
    } else {
      const alias = Object.entries(trackAliases).find(([, label]) => label === nextCategory)?.[0];
      params.set('track', alias ?? nextCategory);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  };

  const programTrackMap: Record<string, string[]> = {
    'Digital Skills Development': ['prg-flagship-2026', 'Incubation', 'Youth Tech'],
    'Youth Empowerment': ['prg-flagship-2026', 'Youth Tech', 'Incubation'],
    'Social Innovation': ['prg-agri-seed', 'prg-flagship-2026', 'Seed Grant'],
    'Women in Innovation': ['prg-switi-women', 'Women in Innovation'],
    'Inclusive Digital Inclusion': ['prg-flagship-2026', 'Youth Tech'],
    'Green Innovation & Sustainability': ['prg-agri-seed', 'Seed Grant'],
    'Youth Peace Innovation': ['prg-flagship-2026', 'Fellowship'],
    'Community Development': ['prg-agri-seed', 'Incubation']
  };

  const filtered = selectedCategory === 'All'
    ? safePrograms
    : safePrograms.filter(p => {
        if (p.category === selectedCategory || p.title.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return true;
        }
        const allowed = programTrackMap[selectedCategory];
        if (allowed && (allowed.includes(p.id) || allowed.includes(p.category))) {
          return true;
        }
        return false;
      });

  const handleApplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProgramModal) return;

    if (!proposalBrief.trim()) {
      addToast('error', 'Validation Error', 'Please enter your venture/project proposal brief.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    try {
      const { submission } = await apiPost<{ submission: { id: string; referenceCode: string } }>('/api/submissions/program-application', { payload: {
        programId: activeProgramModal.id,
        programTitle: activeProgramModal.title,
        fullName,
        email,
        phone,
        ventureName,
        proposalBrief
      } });
      setSubmittedReference(submission.referenceCode);
      if (authUser) setApplications(previous => [{
        id: submission.id,
        programId: activeProgramModal.id,
        programTitle: activeProgramModal.title,
        userId: authUser.id,
        applicantName: fullName,
        applicantEmail: email,
        applicantPhone: phone,
        ventureName,
        proposalBrief,
        status: 'under_review',
        submittedAt: new Date().toISOString()
      }, ...previous]);
      setIsAppliedSuccess(true);
      addToast('success', 'Program Application Submitted', `Applied to ${activeProgramModal.title}. Tracked in the persistent review queue.`);
      triggerRefresh();
    } catch (reason) {
      addToast('error', 'Application Failed', reason instanceof ApiError ? reason.message : 'Unable to submit your application.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <DynamicCmsSections pageSlug="programs" placement="top" />
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          {cmsPage?.eyebrow ?? 'Cohort Directories & Residencies'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Flagship Programs & Cohorts'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Browse current published programs and submit an application for review.'}
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {officialSubprogrammes.map(cat => (
          <button
            key={cat}
            onClick={() => applyTrackFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(program => (
          <div
            key={program.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48">
                <CmsMedia src={program.thumbnailUrl} kind={program.thumbnailUrlType ?? 'image'} alt={program.thumbnailAlt ?? program.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-slate-900/90 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {program.category}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  Status: {program.status}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{program.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{program.summary}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-600" /> Duration:</span>
                    <strong className="text-slate-800">{program.duration}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cyan-600" /> Cohort Size:</span>
                    <strong className="text-slate-800">{program.cohortSize} Selected</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-rose-500" /> Deadline:</span>
                    <strong className="text-rose-600 font-semibold">{program.deadline}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Core Objectives:</span>
                  {(program.objectives ?? []).slice(0, 2).map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              {(() => {
                const userApp = applications.find(a => a.programId === program.id && a.userId === currentUser.id);
                return (
                  <div className="space-y-2">
                    {userApp && (
                      <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-mono text-[11px]">Your Application:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          userApp.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : userApp.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {userApp.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setActiveProgramModal(program);
                        setIsAppliedSuccess(false);
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>{userApp ? 'View Application Status' : 'View Full Details & Apply'}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Program Application & Detail Modal */}
      {activeProgramModal && (() => {
        const existingApp = applications.find(
          a => a.programId === activeProgramModal.id && a.userId === currentUser.id
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 text-white relative">
                <button
                  onClick={() => setActiveProgramModal(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                  {activeProgramModal.category} Residency
                </span>
                <h3 className="text-xl font-bold pr-6">{activeProgramModal.title}</h3>
                <p className="text-xs text-slate-300 mt-1">Lead Coordinator: {activeProgramModal.coordinator}</p>
              </div>

              {isAppliedSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h4 className="text-xl font-bold text-slate-900">Program Application Submitted!</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your application for <strong>{activeProgramModal.title}</strong> has been logged in the SiHub Candidate Review Queue. Our selection committee is currently evaluating submissions.
                  </p>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-mono">
                    Status: Pending review · Reference: {submittedReference}
                  </div>
                  <button onClick={() => navigateTo('submission_tracking')} className="text-xs font-semibold text-cyan-700">Track application status</button>
                  <button
                    onClick={() => setActiveProgramModal(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Close & Return
                  </button>
                </div>
              ) : existingApp ? (
                <div className="p-6 space-y-5">
                  <div className="p-4 rounded-2xl border space-y-2 bg-slate-50 border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono uppercase">Submission Record</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        existingApp.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : existingApp.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {existingApp.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <div>Applicant: <strong>{existingApp.applicantName}</strong> ({existingApp.applicantEmail})</div>
                      <div>Contact Phone: <strong>{existingApp.applicantPhone}</strong></div>
                      {existingApp.ventureName && (
                        <div>Venture / Project: <strong>{existingApp.ventureName}</strong></div>
                      )}
                      <div>Submitted Date: <strong className="font-mono">{new Date(existingApp.submittedAt).toLocaleDateString()}</strong></div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Proposal Brief:</span>
                      "{existingApp.proposalBrief}"
                    </div>

                    {existingApp.status === 'approved' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium">
                        🎉 <strong>Cohort Seat Confirmed!</strong> Your application has been approved by the selection committee. Check your portal for onboarding details.
                        {existingApp.reviewerNotes && (
                          <p className="mt-1 text-[11px] text-emerald-800"><em>Note: {existingApp.reviewerNotes}</em></p>
                        )}
                      </div>
                    )}

                    {existingApp.status === 'rejected' && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 font-medium">
                        <strong>Decision: Not Selected.</strong> {existingApp.rejectionReason || 'Cohort prerequisites were not met for this cycle.'}
                      </div>
                    )}

                    {existingApp.status === 'under_review' && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
                        ⏳ <strong>Under Review:</strong> Your dossier is being evaluated by coordinator {activeProgramModal.coordinator}.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveProgramModal(null)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Overview</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{activeProgramModal.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Audience</span>
                      <strong className="text-slate-800">{activeProgramModal.targetAudience}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Program Deadline</span>
                      <strong className="text-rose-600 font-bold">{activeProgramModal.deadline}</strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Eligibility Criteria</h4>
                    <ul className="space-y-1.5">
                      {(activeProgramModal.eligibility ?? []).map((el, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{el}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <form onSubmit={handleApplySubmit} className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Name</label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          defaultValue={currentUser.fullName}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          required
                          defaultValue={currentUser.email}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+252 61 XXX XXXX"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Venture / Startup Name (Optional)</label>
                        <input
                          type="text"
                          value={ventureName}
                          onChange={e => setVentureName(e.target.value)}
                          placeholder="e.g. Somali Agripump Tech"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Venture / Project Brief & Impact Goal</label>
                      <textarea
                        rows={3}
                        required
                        value={proposalBrief}
                        onChange={e => setProposalBrief(e.target.value)}
                        placeholder="Briefly state your solution and what you expect to achieve during this cohort..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveProgramModal(null)}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                      >
                        Submit Cohort Application
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      <DynamicCmsSections pageSlug="programs" placement="bottom" />
    </div>
  );
};
