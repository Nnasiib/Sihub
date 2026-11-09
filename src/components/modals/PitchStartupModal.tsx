/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Startup Venture Application & Pitch Submission Modal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Startup } from '../../types';
import { X, Rocket, CheckCircle2 } from 'lucide-react';
import { apiPost, ApiError } from '../../services/apiClient';

export const PitchStartupModal: React.FC = () => {
  const {
    isStartupModalOpen,
    setIsStartupModalOpen,
    currentUser,
    authUser,
    addToast,
    navigateTo
  } = useApp();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [sector, setSector] = useState<Startup['sector']>('AgriTech');
  const [stage, setStage] = useState<Startup['stage']>('Ideation');
  const [founderPhone, setFounderPhone] = useState(currentUser.phone || '');
  const [founderName, setFounderName] = useState(currentUser.fullName === 'Site Visitor' ? '' : currentUser.fullName);
  const [founderEmail, setFounderEmail] = useState(currentUser.email);
  const [teamSize, setTeamSize] = useState(1);
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [pitchDeckAssetId, setPitchDeckAssetId] = useState('');
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isStartupModalOpen) return null;

  const handleClose = () => {
    setIsStartupModalOpen(false);
    setSubmitted(false);
  };

  const uploadPitchDeck = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size <= 0 || file.size > 25 * 1024 * 1024) {
      addToast('error', 'Unsupported Pitch Deck', 'Choose a PDF smaller than 25 MB.');
      return;
    }
    setUploadingDeck(true);
    try {
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', { filename: file.name, contentType: file.type, byteSize: file.size });
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!response.ok) throw new Error('The pitch deck could not be uploaded.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);
      setPitchDeckAssetId(upload.assetId);
      addToast('success', 'Pitch Deck Uploaded', 'Your PDF is verified and will be included with the pitch.');
    } catch (reason) {
      addToast('error', 'Pitch Deck Upload Failed', reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Unable to upload the pitch deck.');
    } finally { setUploadingDeck(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { submission } = await apiPost<{ submission: { referenceCode: string } }>('/api/submissions/startup-pitch', { payload: {
        name,
        tagline,
        sector,
        founderName,
        founderEmail,
        founderPhone,
        teamSize,
        stage,
        description: `${tagline}. Solving: ${problemStatement}`,
        problemStatement,
        solution,
        ...(pitchDeckAssetId ? { pitchDeckAssetId } : {}),
        fundingRaised: 'Seeking Seed Stage',
        location,
        incubationCohort: 'Under Review - 2026',
        status: 'under_review',
        appliedDate: new Date().toISOString().split('T')[0]
      } });
      setSubmittedReference(submission.referenceCode);
      setIsSubmitting(false);
      setSubmitted(true);
      addToast(
        'success',
        'Venture Application Submitted',
        `"${name}" has been submitted to the persistent SiHub review queue.`
      );
    } catch (reason) {
      setIsSubmitting(false);
      addToast('error', 'Pitch Submission Failed', reason instanceof ApiError ? reason.message : 'Unable to submit your startup pitch.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Rocket className="w-4 h-4" /> SiHub Startup Hub & Incubation
          </div>
          <h3 className="text-xl font-bold">Apply for Venture Incubation & Seed Support</h3>
          <p className="text-xs text-slate-300 mt-1">
            Connect your innovative solution with mentorship, seed funding, and market scaling across East Africa.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Application Received!</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your startup application is in the review queue. Reference: <strong className="font-mono">{submittedReference}</strong>.
            </p>
            <button onClick={() => { handleClose(); navigateTo('submission_tracking'); }} className="text-xs font-semibold text-emerald-800 underline">Track your pitch status</button>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => {
                  handleClose();
                  navigateTo(authUser?.role === 'STARTUP_FOUNDER' ? 'startup_portal' : 'startups');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                {authUser?.role === 'STARTUP_FOUNDER' ? 'Go to Founder Dashboard' : 'Return to Startup Directory'} &rarr;
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Startup / Venture Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. GeelTech, Banaadir Solar..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">One-Line Tagline</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Solar cold storage for nomadic milk herders"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Founder Name</label>
                <input type="text" required value={founderName} onChange={event => setFounderName(event.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Founder Email</label>
                <input type="email" required value={founderEmail} onChange={event => setFounderEmail(event.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Founder Phone</label>
                <input type="tel" required value={founderPhone} onChange={event => setFounderPhone(event.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sector</label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value as Startup['sector'])}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="AgriTech">AgriTech & Food</option>
                  <option value="CleanTech / Energy">CleanTech / Solar</option>
                  <option value="Fintech">Fintech & Payments</option>
                  <option value="HealthTech">HealthTech / Telemed</option>
                  <option value="EdTech">EdTech & Skills</option>
                  <option value="Logistics">Logistics & Supply</option>
                  <option value="Creative">Creative & Media</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stage</label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value as Startup['stage'])}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Ideation">Ideation / Concept</option>
                  <option value="Prototype">Prototype / MVP</option>
                  <option value="Incubation">Ready for Incubation</option>
                  <option value="Acceleration">Acceleration / Growth</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Size</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={teamSize}
                  onChange={e => setTeamSize(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Being Solved</label>
              <textarea
                required
                rows={2}
                value={problemStatement}
                onChange={e => setProblemStatement(e.target.value)}
                placeholder="What critical challenge in Somalia does your venture address?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Proposed Solution & Tech</label>
              <textarea
                required
                rows={2}
                value={solution}
                onChange={e => setSolution(e.target.value)}
                placeholder="Describe your prototype, product, and business model..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational City / Region</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Mogadishu, Hargeisa, Garowe, Baidoa..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pitch deck (optional PDF)
                  <input type="file" accept="application/pdf" disabled={uploadingDeck || !authUser} onChange={event => { void uploadPitchDeck(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} className="mt-1 block w-full text-[10px] file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[10px] file:font-bold" />
                </label>
                {!authUser && <p className="text-[10px] text-slate-500">Sign in to attach a deck. You can still submit the pitch without a file.</p>}
                {pitchDeckAssetId && <p className="text-[10px] text-emerald-700">Verified PDF attached.</p>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingDeck}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
              >
                {uploadingDeck ? 'Uploading deck…' : isSubmitting ? 'Submitting...' : 'Submit Pitch Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
