/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Opportunities (Scholarships, Grants, Jobs, Fellowships)
 * Allows innovators to apply for funding and track application status.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Opportunity, OpportunityApplication } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { apiGet, apiPost, ApiError } from '../../services/apiClient';
import {
  Award,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Send,
  Briefcase,
  Clock,
  ArrowRight,
  Star
} from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('opportunities');
  const { currentUser, authUser, addToast, triggerRefresh, navigateTo } = useApp();
  const { items: opportunities } = useCmsCollection<Opportunity>('opportunity');
  const [applications, setApplications] = useState<OpportunityApplication[]>([]);

  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [proposal, setProposal] = useState('');

  useEffect(() => {
    if (!authUser) {
      setApplications([]);
      return;
    }
    let active = true;
    apiGet<{ submissions: { id: string; status: string; createdAt: string; payload: Record<string, unknown> }[] }>('/api/submissions/mine?type=opportunity-application')
      .then(({ submissions }) => {
        if (!active) return;
        setApplications(submissions.map(item => ({
          id: item.id,
          opportunityId: String(item.payload.opportunityId ?? ''),
          opportunityTitle: String(item.payload.opportunityTitle ?? ''),
          opportunityType: String(item.payload.opportunityType ?? 'Grant') as Opportunity['type'],
          userId: authUser.id,
          applicantName: String(item.payload.fullName ?? ''),
          applicantEmail: String(item.payload.email ?? ''),
          applicantPhone: String(item.payload.phone ?? ''),
          portfolioOrProposal: String(item.payload.proposal ?? ''),
          status: item.status === 'APPROVED' ? 'awarded' : item.status === 'REJECTED' ? 'declined' : 'under_review',
          submittedAt: item.createdAt
        })));
      })
      .catch(() => { if (active) setApplications([]); });
    return () => { active = false; };
  }, [authUser]);

  const types = ['All', 'Grant', 'Scholarship', 'Internship'];

  const filtered = selectedType === 'All'
    ? opportunities
    : opportunities.filter(o => o.type === selectedType);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOpp) return;

    if (!proposal.trim()) {
      addToast('error', 'Validation Error', 'Please include your proposal summary and qualifications.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    try {
      const { submission } = await apiPost<{ submission: { id: string; referenceCode: string } }>('/api/submissions/opportunity-application', { payload: {
        opportunityId: selectedOpp.id,
        opportunityTitle: selectedOpp.title,
        opportunityType: selectedOpp.type,
        fullName,
        email,
        phone,
        proposal
      } });
      setSubmittedReference(submission.referenceCode);
      if (authUser) setApplications(previous => [{
        id: submission.id,
        opportunityId: selectedOpp.id,
        opportunityTitle: selectedOpp.title,
        opportunityType: selectedOpp.type,
        userId: authUser.id,
        applicantName: fullName,
        applicantEmail: email,
        applicantPhone: phone,
        portfolioOrProposal: proposal,
        status: 'under_review',
        submittedAt: new Date().toISOString()
      }, ...previous]);
      setIsSubmitted(true);
      addToast('success', 'Application Submitted', `Your application for "${selectedOpp.title}" is in the persistent review queue.`);
      triggerRefresh();
    } catch (reason) {
      addToast('error', 'Application Failed', reason instanceof ApiError ? reason.message : 'Unable to submit your application.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          {cmsPage?.eyebrow ?? 'Catalytic Funding & Career Pathways'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'Grants, Scholarships & Fellowships'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Browse published grants, scholarships, and career opportunities.'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === t
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map(opp => {
          const userApp = applications.find(a => a.opportunityId === opp.id && a.userId === currentUser.id);

          return (
            <div
              key={opp.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {opp.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {opp.applicantsCount} Applicants
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Provider: {opp.provider}</p>
                </div>

                {opp.amountOrStipend && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 font-bold text-xs flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{opp.amountOrStipend}</span>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{opp.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>Deadline: <strong className="text-rose-600">{opp.deadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: {opp.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                {userApp && (
                  <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-mono text-[11px]">Application:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      userApp.status === 'awarded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : userApp.status === 'declined'
                        ? 'bg-rose-100 text-rose-800'
                        : userApp.status === 'shortlisted'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {userApp.status.replace('_', ' ')}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedOpp(opp);
                    setIsSubmitted(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{userApp ? 'View Application Record' : 'Apply for Opportunity'}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Opportunity Application Modal */}
      {selectedOpp && (() => {
        const existingApp = applications.find(
          a => a.opportunityId === selectedOpp.id && a.userId === currentUser.id
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
              <div className="bg-slate-900 p-6 text-white relative">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  {selectedOpp.type} Application
                </span>
                <h3 className="text-xl font-bold pr-6">{selectedOpp.title}</h3>
                <p className="text-xs text-slate-300 mt-1">Deadline: {selectedOpp.deadline}</p>
              </div>

              {isSubmitted ? (
                <div className="p-8 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your candidate dossier for <strong>{selectedOpp.title}</strong> has been forwarded to the evaluation desk.
                  </p>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-mono">
                    Status: Pending review · Reference: {submittedReference}
                  </div>
                  <button onClick={() => navigateTo('submission_tracking')} className="text-xs font-semibold text-emerald-800">Track application status</button>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              ) : existingApp ? (
                <div className="p-6 space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-500 uppercase text-[10px]">Your Dossier Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        existingApp.status === 'awarded'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : existingApp.status === 'declined'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : existingApp.status === 'shortlisted'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {existingApp.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <div>Applicant: <strong>{existingApp.applicantName}</strong> ({existingApp.applicantEmail})</div>
                      <div>Phone: <strong>{existingApp.applicantPhone}</strong></div>
                      <div>Submitted: <strong className="font-mono">{new Date(existingApp.submittedAt).toLocaleDateString()}</strong></div>
                      {existingApp.score !== undefined && (
                        <div className="flex items-center gap-1 text-amber-700 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Evaluation Score: {existingApp.score}/100
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Proposal Summary:</span>
                      "{existingApp.portfolioOrProposal}"
                    </div>

                    {existingApp.adminFeedback && (
                      <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900">
                        <strong>Reviewer Feedback:</strong> {existingApp.adminFeedback}
                      </div>
                    )}

                    {existingApp.decisionReason && existingApp.status === 'declined' && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                        <strong>Decline Reason:</strong> {existingApp.decisionReason}
                      </div>
                    )}

                    {existingApp.status === 'awarded' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-medium">
                        🎉 <strong>Congratulations! Opportunity Awarded.</strong> Capital/fellowship disbursement instructions have been recorded.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOpp(null)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Eligibility Criteria</h4>
                    <ul className="space-y-1">
                      {selectedOpp.eligibility.map((el, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {el}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Applicant Name</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        defaultValue={currentUser.fullName}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        defaultValue={currentUser.email}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+252 61 XXX XXXX"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Proposal & Personal Statement</label>
                    <textarea
                      rows={3}
                      required
                      value={proposal}
                      onChange={e => setProposal(e.target.value)}
                      placeholder="Summarize your qualifications and how this grant or opportunity will create tangible impact..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 resize-none text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOpp(null)}
                      className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
