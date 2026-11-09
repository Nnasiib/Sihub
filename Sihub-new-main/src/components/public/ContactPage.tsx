/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Contact, Regional Hub Locations & FAQ
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiPost, ApiError } from '../../services/apiClient';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building,
  Compass,
  ArrowRight
} from 'lucide-react';
import { DynamicCmsSections } from './DynamicCmsSections';

type ContactCmsPage = {
  eyebrow?: string;
  title?: string;
  summary?: string;
  heroImage?: string | null;
  heroImageType?: 'image' | 'video';
  heroImageAlt?: string;
  heroImageCaption?: string;
  heroVideo?: string | null;
  heroVideoAlt?: string;
  heroVideoCaption?: string;
  formTitle?: string;
  formDescription?: string;
  nameLabel?: string;
  emailFieldLabel?: string;
  phoneFieldLabel?: string;
  topicLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  submitAction?: string;
  topics?: string[];
  hqTitle?: string;
  campusLabel?: string;
  address?: string;
  hoursLabel?: string;
  hours?: string;
  accessHours?: string;
  emailLabel?: string;
  email?: string;
  phoneLabel?: string;
  phone?: string;
  regionalSummary?: string;
  visitEyebrow?: string;
  visitTitle?: string;
  visitDescription?: string;
  visitAction?: string;
  faqEyebrow?: string;
  faqTitle?: string;
  faqs?: { q: string; a: string }[];
};

export const ContactPage: React.FC = () => {
  const { currentUser, addToast, navigateTo } = useApp();
  const { page: cmsPage } = useCmsPage<ContactCmsPage>('contact');

  const [name, setName] = useState(currentUser.fullName === 'Site Visitor' ? '' : currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const displayedFaqs = cmsPage?.faqs ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { submission } = await apiPost<{ submission: { referenceCode: string } }>('/api/submissions/contact-message', { payload: { name, email, phone, subject, message } });
      setSubmittedReference(submission.referenceCode);
      setSubmitted(true);
      addToast('success', 'Message Received', 'Your inquiry is stored in the SiHub review queue.');
    } catch (reason) {
      addToast('error', 'Message Not Sent', reason instanceof ApiError ? reason.message : 'Unable to send your inquiry.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <DynamicCmsSections pageSlug="contact" placement="top" />
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          {cmsPage?.eyebrow ?? 'Reach Our Headquarters & Field Teams'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.title ?? 'Contact Somali Innovation Hub'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.summary ?? 'Whether you want to visit our Mogadishu MakerSpace, enroll in an upcoming academy cohort, or propose an institutional partnership, we are here to support your journey.'}
        </p>
        {cmsPage?.heroVideo
          ? <CmsMedia src={cmsPage.heroVideo} kind="video" alt={cmsPage.heroVideoAlt} caption={cmsPage.heroVideoCaption} className="mx-auto max-h-96 w-full rounded-2xl object-cover" />
          : <CmsMedia src={cmsPage?.heroImage} kind={cmsPage?.heroImageType ?? 'image'} alt={cmsPage?.heroImageAlt} caption={cmsPage?.heroImageCaption} className="mx-auto max-h-80 w-full rounded-2xl object-cover" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 font-heading">{cmsPage?.formTitle ?? 'Send Us a Direct Message'}</h3>
            {cmsPage?.formDescription && <p className="text-xs text-slate-500">{cmsPage.formDescription}</p>}
          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-950">Inquiry Dispatched Successfully!</h4>
              <p className="text-xs text-emerald-700">
                Reference: <span className="font-mono font-bold">{submittedReference}</span>. A member of our team will follow up via email and phone.
              </p>
              <button onClick={() => navigateTo('submission_tracking')} className="text-xs font-semibold text-emerald-800 underline">Track this inquiry</button>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{cmsPage?.nameLabel ?? 'Your Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{cmsPage?.emailFieldLabel ?? 'Email Address'}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{cmsPage?.phoneFieldLabel ?? 'Phone / WhatsApp'}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{cmsPage?.topicLabel ?? 'Topic / Directorate'}</label>
                  <select
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Choose a topic</option>
                    {(cmsPage?.topics?.length ? cmsPage.topics : ['Startup Incubation & Seed Grants', 'Academy & LMS Course Enrollment', 'Institutional Partnership & MOUs', 'MakerSpace Lab & Facility Booking', 'Events & Sponsorships']).map(topicOption => <option key={topicOption}>{topicOption}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{cmsPage?.messageLabel ?? 'Message Details'}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={cmsPage?.messagePlaceholder ?? 'How can SiHub assist you or collaborate with your organization?'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 resize-none focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> {cmsPage?.submitAction ?? 'Send Direct Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Office Directory & Hours */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-cyan-400 font-heading">{cmsPage?.hqTitle ?? 'Somali Innovation Hub (HQ)'}</h3>

            <div className="space-y-4 text-xs text-slate-300">
              {cmsPage?.address && <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{cmsPage.campusLabel ?? 'Address'}</strong>
                  <span>{cmsPage.address}</span>
                </div>
              </div>}

              {(cmsPage?.hours || cmsPage?.accessHours) && <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{cmsPage?.hoursLabel ?? 'Hours'}</strong>
                  {cmsPage?.hours && <span>{cmsPage.hours}</span>}
                  {cmsPage?.accessHours && <span className="block text-[11px] text-slate-400">{cmsPage.accessHours}</span>}
                </div>
              </div>}

              {cmsPage?.email && <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{cmsPage.emailLabel ?? 'Email'}</strong>
                  <span>{cmsPage.email}</span>
                </div>
              </div>}

              {cmsPage?.phone && <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{cmsPage.phoneLabel ?? 'Phone'}</strong>
                  <span>{cmsPage.phone}</span>
                </div>
              </div>}
            </div>

            {cmsPage?.regionalSummary && <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">{cmsPage.regionalSummary}</div>}
          </div>

          {/* Plan Your Visit CTA Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-900 to-slate-900 text-white shadow-lg border border-cyan-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
              <Compass className="w-4 h-4" /> Campus Access & Tours
            </div>
              <h4 className="text-base font-bold">{cmsPage?.visitTitle ?? 'Planning an In-Person Campus Visit?'}</h4>
            {cmsPage?.visitDescription && <p className="text-xs text-slate-300 leading-relaxed">{cmsPage.visitDescription}</p>}
            <button
              onClick={() => navigateTo('visitor_portal')}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{cmsPage?.visitAction ?? 'Book Visit in Visitor Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      {displayedFaqs.length > 0 && <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">{cmsPage?.faqEyebrow ?? 'Got Questions?'}</span>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">{cmsPage?.faqTitle ?? 'Frequently Asked Questions'}</h2>
        </div>

        <div className="space-y-3">
          {displayedFaqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-cyan-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-600 shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>}
      <DynamicCmsSections pageSlug="contact" placement="bottom" />
    </div>
  );
};
