/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Mentorship Network Page
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mentor } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import { apiPost, ApiError } from '../../services/apiClient';
import {
  Users,
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const MentorshipPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage('mentorship');
  const { currentUser, addToast, navigateTo } = useApp();
  const { items: mentors } = useCmsCollection<Mentor>('mentor');

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [topic, setTopic] = useState('');
  const [slot, setSlot] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');
  const [menteeName, setMenteeName] = useState(currentUser.fullName === 'Site Visitor' ? '' : currentUser.fullName);
  const [menteeEmail, setMenteeEmail] = useState(currentUser.email);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      const { submission } = await apiPost<{ submission: { referenceCode: string } }>('/api/submissions/mentorship-request', { payload: { mentorId: selectedMentor.id, mentorUserId: selectedMentor.userId, mentorName: selectedMentor.name, menteeName, email: menteeEmail, topic, preferredSlot: slot } });
      setSubmittedReference(submission.referenceCode);
      setIsSuccess(true);
      addToast('success', 'Mentorship Requested', `Request sent to ${selectedMentor.name} for review.`);
    } catch (reason) {
      addToast('error', 'Request Failed', reason instanceof ApiError ? reason.message : 'Unable to send the mentorship request.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          {cmsPage?.eyebrow ?? 'Diaspora & Industry Advisory Network'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'SiHub Mentorship Network'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Browse published mentor profiles and submit a request for a mentoring conversation.'}
        </p>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mentors.map(mentor => (
          <div
            key={mentor.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <CmsMedia src={mentor.avatarUrl} kind={mentor.avatarUrlType ?? 'image'} alt={mentor.avatarAlt ?? mentor.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{mentor.name}</h3>
                  <p className="text-xs text-indigo-700 font-semibold">{mentor.title}</p>
                  <p className="text-[11px] text-slate-500">{mentor.organization}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {mentor.rating} Rating
                </span>
                <span className="text-slate-500">
                  {mentor.totalMenteesHelped}+ Mentees Supported
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{mentor.bio}</p>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Core Expertise:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.map((exp, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>Available: <strong>{mentor.availableHoursPerMonth} hrs / month</strong></span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedMentor(mentor);
                  setIsSuccess(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Request 1-on-1 Mentorship &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mentorship Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-900 p-6 text-white relative">
              <button
                onClick={() => setSelectedMentor(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                Mentorship Request
              </span>
              <h3 className="text-xl font-bold pr-6">Session with {selectedMentor.name}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedMentor.title} • {selectedMentor.organization}</p>
            </div>

            {isSuccess ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h4 className="text-xl font-bold text-slate-900">Request Dispatched!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  {selectedMentor.name} will review your proposed topic. Reference: <strong className="font-mono">{submittedReference}</strong>.
                </p>
                <button onClick={() => navigateTo('submission_tracking')} className="text-xs font-semibold text-indigo-700 underline">Track request status</button>
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name & Background</label>
                  <input
                    type="text"
                    required
                    value={menteeName}
                    onChange={event => setMenteeName(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input type="email" required value={menteeEmail} onChange={event => setMenteeEmail(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discussion Topic & Goals</label>
                  <textarea
                    rows={3}
                    required
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Describe specific questions you want guidance on..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Time Window</label>
                  <input
                    type="text"
                    required
                    value={slot}
                    onChange={e => setSlot(e.target.value)}
                    placeholder="e.g. Wednesday mornings 10:00 AM EAT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Send Mentorship Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
