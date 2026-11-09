/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Strategic Partnerships & Institutional Collaboration
 * Handles institutional inquiries and partner directories.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Partner } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { apiPost, ApiError } from '../../services/apiClient';
import {
  Globe,
  Building,
  CheckCircle2,
  Handshake,
  Send,
  FileCheck,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export const PartnershipsPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('partnerships');
  const { currentUser, addToast, navigateTo } = useApp();
  const { items: partners } = useCmsCollection<Partner>('partner');

  const [orgName, setOrgName] = useState('');
  const [partnerType, setPartnerType] = useState('Development Agency / UN');
  const [focusArea, setFocusArea] = useState('Clean Energy & Water Resilience');
  const [contactPerson, setContactPerson] = useState(currentUser.fullName === 'Site Visitor' ? '' : currentUser.fullName);
  const [contactEmail, setContactEmail] = useState(currentUser.email);
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '');
  const [proposal, setProposal] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim() || !proposal.trim()) {
      addToast('error', 'Validation Error', 'Please complete the organization name and collaboration scope.');
      return;
    }

    try {
      const { submission } = await apiPost<{ submission: { referenceCode: string } }>('/api/submissions/partner-inquiry', { payload: {
        organizationName: orgName,
        partnerType,
        focusArea,
        contactPerson,
        contactEmail,
        contactPhone,
        proposalDetails: proposal
      } });
      setSubmittedId(submission.referenceCode);
      addToast('success', 'Partnership Inquiry Registered', 'Your proposal is stored in the persistent SiHub review queue.');
    } catch (reason) {
      addToast('error', 'Submission Failed', reason instanceof ApiError ? reason.message : 'Unable to send the partnership proposal.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
          {cmsPage?.eyebrow ?? 'Strategic Alliances & Multilateral MOUs'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Partnerships & Coalitions'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Review published partner profiles or submit a collaboration inquiry.'}
        </p>
      </div>

      {/* Existing Partners Roster */}
      <div id="donors" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {partners.map(p => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {p.type}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> {p.mouStatus}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.contactPerson}</p>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Joint Initiatives:</span>
                {p.collaborativePrograms.map((cp, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{cp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              Partner since {p.joinedYear} • {p.country}
            </div>
          </div>
        ))}
      </div>

      {/* Partnership Inquiry Form */}
      <div id="become-partner" className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <Handshake className="w-4 h-4" /> Formal Collaboration
          </span>
          <h2 className="text-2xl font-bold font-heading">Partner with Somali Innovation Hub</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Whether your organization represents an international donor, commercial financial institution, university, or diaspora syndicate, submit a collaboration brief to engage our national network.
          </p>
        </div>

        {submittedId ? (
          <div className="p-8 rounded-2xl bg-teal-900/60 border border-teal-700 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Partnership Proposal Logged!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your inquiry has been stored with reference ID <span className="font-mono text-teal-300 font-bold">{submittedId}</span>. The SiHub Institutional Directorate has received your proposal in the review desk.
            </p>
            <button onClick={() => navigateTo('submission_tracking')} className="text-xs font-semibold text-teal-200 underline">Track inquiry status</button>
            <button
              onClick={() => {
                setSubmittedId(null);
                setOrgName('');
              }}
              className="px-6 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs mt-2"
            >
              Submit Another Proposal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. World Bank, SIMAD, Swedish Aid..."
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Partnership Category</label>
                <select
                  value={partnerType}
                  onChange={e => setPartnerType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
                >
                  <option>Development Agency / UN</option>
                  <option>Institutional / Government</option>
                  <option>Corporate Sponsor & Telecom</option>
                  <option>Academic & University R&D</option>
                  <option>Diaspora Investment Syndicate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Focal Person</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Direct Phone</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Proposed Collaboration Focus Area</label>
              <input
                type="text"
                required
                value={focusArea}
                onChange={e => setFocusArea(e.target.value)}
                placeholder="e.g. Youth AgriTech Co-funding, Clean Energy Sandbox..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cooperation Scope & Objectives</label>
              <textarea
                rows={3}
                required
                value={proposal}
                onChange={e => setProposal(e.target.value)}
                placeholder="Briefly state your programmatic goals, target regions, and proposed resources..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-hidden focus:border-teal-400 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Partnership Proposal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
