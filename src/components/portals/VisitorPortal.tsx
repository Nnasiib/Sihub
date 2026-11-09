/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Dedicated Institutional Visitor Portal (/visitor_portal)
 * Covers hub visitor information, visit booking, delegation requests, request tracking,
 * and digital visitor pass generation.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VisitRequest, VisitPurpose, VisitorPass } from '../../types';
import { apiGet, apiPost, ApiError } from '../../services/apiClient';
import { useCmsPage } from '../../hooks/useCmsPage';
import QRCode from 'qrcode';
import {
  Compass,
  Building,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  QrCode,
  FileText,
  MapPin,
  Send,
  Download,
  Info,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';

type VisitorHub = {
  value: string;
  name: string;
  tag?: string;
  address?: string;
  zones?: string[];
  contact?: string;
};

type VisitorCmsPage = {
  title?: string;
  description?: string;
  bookingDescription?: string;
  visitingHoursTitle?: string;
  visitingHours?: string;
  securityTitle?: string;
  securityInformation?: string;
  groupTitle?: string;
  groupGuidance?: string;
  visitPurposes?: string[];
  timeSlots?: string[];
  hubs?: VisitorHub[];
};

export const VisitorPortal: React.FC = () => {
  const { addToast, currentUser, authUser } = useApp();
  const { page: visitorPage } = useCmsPage<VisitorCmsPage>('visitor');
  const hubLocationsList = visitorPage?.hubs ?? [];
  const visitPurposes = visitorPage?.visitPurposes ?? [];
  const timeSlots = visitorPage?.timeSlots ?? [];

  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'track' | 'history'>('overview');

  // Booking Form State
  const [fullName, setFullName] = useState(currentUser.fullName !== 'Site Visitor' ? currentUser.fullName : '');
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [organization, setOrganization] = useState(currentUser.organization || '');
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [hubLocation, setHubLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  // Tracking State
  const [trackInput, setTrackInput] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackedRequest, setTrackedRequest] = useState<VisitRequest | null>(null);
  const [trackedPass, setTrackedPass] = useState<VisitorPass | null>(null);
  const [visitorQrCode, setVisitorQrCode] = useState('');
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);

  useEffect(() => {
    if (visitorPage?.hubs?.length && !visitorPage.hubs.some(hub => hub.value === hubLocation)) setHubLocation(visitorPage.hubs[0].value);
    if (visitorPage?.visitPurposes?.length && !visitorPage.visitPurposes.includes(purpose)) setPurpose(visitorPage.visitPurposes[0]);
    if (visitorPage?.timeSlots?.length && !visitorPage.timeSlots.includes(timeSlot)) setTimeSlot(visitorPage.timeSlots[0]);
  }, [visitorPage, hubLocation, purpose, timeSlot]);

  const applyTrackedResponse = (result: { request: { referenceCode: string; status: string; payload: Record<string, unknown>; createdAt: string } }) => {
    const payload = result.request.payload;
    const requestId = String(payload.id ?? result.request.referenceCode);
    const status = result.request.status === 'APPROVED' ? 'approved' : result.request.status === 'REJECTED' ? 'declined' : result.request.status === 'COMPLETED' ? 'completed' : 'pending';
    const request: VisitRequest = {
      id: requestId,
      referenceCode: result.request.referenceCode,
      fullName: String(payload.fullName ?? ''),
      email: String(payload.email ?? ''),
      phone: String(payload.phone ?? ''),
      organization: String(payload.organization ?? ''),
      visitorCount: Number(payload.visitorCount ?? 1),
      hubLocation: String(payload.hubLocation ?? 'Mogadishu HQ') as VisitRequest['hubLocation'],
      purpose: String(payload.purpose ?? 'Public & Student Group Visit') as VisitPurpose,
      customDetails: String(payload.customDetails ?? ''),
      requestedDate: String(payload.requestedDate ?? ''),
      timeSlot: String(payload.timeSlot ?? 'Morning (09:00 - 11:30)') as VisitRequest['timeSlot'],
      status,
      submittedAt: result.request.createdAt,
      reviewedAt: payload.reviewedAt ? String(payload.reviewedAt) : undefined,
      adminNotes: String(payload.adminNotes ?? ''),
      assignedHost: String(payload.assignedHost ?? ''),
      badgeIssued: Boolean(payload.visitorPass)
    };
    const passInfo = payload.visitorPass && typeof payload.visitorPass === 'object' ? payload.visitorPass as Record<string, unknown> : null;
    const pass: VisitorPass | null = passInfo ? {
      id: requestId,
      passNumber: String(passInfo.passNumber ?? ''),
      requestId,
      visitorName: request.fullName,
      organization: request.organization,
      hubLocation: request.hubLocation,
      validDate: request.requestedDate,
      timeSlot: request.timeSlot,
      assignedHost: String(passInfo.assignedHost ?? request.assignedHost ?? ''),
      securityClearanceCode: String(passInfo.securityClearanceCode ?? ''),
      issuedAt: String(passInfo.issuedAt ?? '')
    } : null;
    setTrackedRequest(request);
    setTrackedPass(pass);
    return request;
  };

  useEffect(() => {
    let active = true;
    if (!trackedPass) {
      setVisitorQrCode('');
      return () => { active = false; };
    }
    const verifyUrl = new URL(`/api/visitor/pass/${encodeURIComponent(trackedPass.passNumber)}`, window.location.origin);
    verifyUrl.searchParams.set('code', trackedPass.securityClearanceCode);
    QRCode.toDataURL(verifyUrl.href, { errorCorrectionLevel: 'Q', margin: 1, width: 256 })
      .then(dataUrl => { if (active) setVisitorQrCode(dataUrl); })
      .catch(() => { if (active) setVisitorQrCode(''); });
    return () => { active = false; };
  }, [trackedPass?.passNumber, trackedPass?.securityClearanceCode]);

  useEffect(() => {
    if (!authUser) {
      setVisitRequests([]);
      return;
    }
    let active = true;
    apiGet<{ submissions: { referenceCode: string; status: string; payload: Record<string, unknown>; createdAt: string }[] }>('/api/submissions/mine?type=visitor-request')
      .then(({ submissions }) => {
        if (active) setVisitRequests(submissions.map(item => {
          const payload = item.payload;
          return {
            id: String(payload.id ?? item.referenceCode),
            referenceCode: item.referenceCode,
            fullName: String(payload.fullName ?? ''),
            email: String(payload.email ?? ''),
            phone: String(payload.phone ?? ''),
            organization: String(payload.organization ?? ''),
            visitorCount: Number(payload.visitorCount ?? 1),
            hubLocation: String(payload.hubLocation ?? 'Mogadishu HQ') as VisitRequest['hubLocation'],
            purpose: String(payload.purpose ?? 'Public & Student Group Visit') as VisitPurpose,
            customDetails: String(payload.customDetails ?? ''),
            requestedDate: String(payload.requestedDate ?? ''),
            timeSlot: String(payload.timeSlot ?? 'Morning (09:00 - 11:30)') as VisitRequest['timeSlot'],
            status: item.status === 'APPROVED' ? 'approved' : item.status === 'REJECTED' ? 'declined' : item.status === 'COMPLETED' ? 'completed' : 'pending',
            submittedAt: item.createdAt
          };
        }));
      })
      .catch(() => { if (active) setVisitRequests([]); });
    return () => { active = false; };
  }, [authUser]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !requestedDate || !hubLocationsList.some(hub => hub.value === hubLocation) || !visitPurposes.includes(purpose) || !timeSlots.includes(timeSlot)) {
      addToast('error', 'Incomplete Form', 'Please complete all required fields.');
      return;
    }

    try {
      const { submission } = await apiPost<{ submission: { id: string; referenceCode: string; status: string; createdAt: string } }>('/api/submissions/visitor-request', { payload: {
        fullName,
        email,
        phone,
        organization: organization || 'Independent Guest',
        visitorCount: Number(visitorCount) || 1,
        hubLocation,
        purpose,
        customDetails: customDetails || 'General hub exploration and facility inspection.',
        requestedDate,
        timeSlot
      } });
      const request = applyTrackedResponse({ request: { ...submission, payload: { fullName, email, phone, organization, visitorCount, hubLocation, purpose, customDetails, requestedDate, timeSlot } } });
      setVisitRequests(previous => [request, ...previous]);
      setSubmittedReference(submission.referenceCode);
      setTrackInput(submission.referenceCode);
      addToast('success', 'Visit Request Submitted', `Your request is stored. Tracking code: ${submission.referenceCode}.`);
    } catch (reason) {
      addToast('error', 'Visit Request Failed', reason instanceof ApiError ? reason.message : 'Unable to submit the visit request.');
    }
  };

  const handleTrackLookup = async (e?: React.FormEvent, code = trackInput) => {
    if (e) e.preventDefault();
    if (!trackEmail.trim()) {
      addToast('error', 'Email Required', 'Enter the email address used for this visit request.');
      return;
    }
    try {
      const result = await apiGet<{ request: { referenceCode: string; status: string; payload: Record<string, unknown>; createdAt: string } }>(`/api/visitor/track/${encodeURIComponent(code.trim())}?email=${encodeURIComponent(trackEmail.trim())}`);
      const request = applyTrackedResponse(result);
      addToast('info', 'Request Found', `Loaded records for ${request.referenceCode} (${request.status.toUpperCase()})`);
    } catch {
      setTrackedRequest(null);
      setTrackedPass(null);
      addToast('error', 'Not Found', 'No visit request matches that reference code or email.');
    }
  };

  const printVisitorPass = () => {
    if (!trackedRequest || !trackedPass || !visitorQrCode) return;
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      addToast('error', 'Print Window Blocked', 'Allow pop-ups to print or save your visitor pass as PDF.');
      return;
    }
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
    const rows: [string, string][] = [
      ['Reference', trackedPass.passNumber],
      ['Visitor', trackedPass.visitorName],
      ['Organization', trackedPass.organization ?? ''],
      ['Hub', trackedPass.hubLocation],
      ['Visit date', trackedPass.validDate],
      ['Time slot', trackedPass.timeSlot],
      ['Assigned host', trackedPass.assignedHost],
      ['Clearance code', trackedPass.securityClearanceCode]
    ];
    printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SiHub Visitor Pass</title><style>body{font-family:Arial,sans-serif;color:#14212b;margin:40px}header{border-bottom:3px solid #087f8c;padding-bottom:16px;margin-bottom:24px}h1{font-size:24px;margin:0}p{color:#53636b}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px;border-bottom:1px solid #d5dee2;font-size:14px}th{width:30%;color:#52616a}.code{font-family:monospace;font-size:18px;font-weight:bold;color:#087f8c}.qr{width:180px;height:180px}@media print{body{margin:16mm}}</style></head><body><header><h1>Somali Innovation Hub</h1><p>Authorized Campus Visit Pass</p></header><img class="qr" src="${escapeHtml(visitorQrCode)}" alt="Verified visitor pass QR code"><table>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td class="${label === 'Clearance code' ? 'code' : ''}">${escapeHtml(value)}</td></tr>`).join('')}</table><p>Present this pass and matching identification at the visitor reception.</p></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 antialiased">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <Compass className="w-4 h-4" /> Somali Innovation Hub • Institutional Visitor Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">{visitorPage?.title ?? 'Visitor information'}</h1>
          {visitorPage?.description && <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">{visitorPage.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('book')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Campus Visit</span>
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Track Existing Pass</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: '1. Visitor Information & Hubs', icon: <Building className="w-4 h-4" /> },
          { id: 'book', label: '2. Request a Visit', icon: <Send className="w-4 h-4" /> },
          { id: 'track', label: '3. Track Request & Digital Pass', icon: <QrCode className="w-4 h-4" /> },
          { id: 'history', label: '4. My Visit Requests', icon: <FileText className="w-4 h-4" />, badge: visitRequests.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab.id ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: VISITOR INFORMATION & HUBS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Visiting Protocol Cards */}
          {(visitorPage?.visitingHours || visitorPage?.securityInformation || visitorPage?.groupGuidance) && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visitorPage.visitingHours && <article className="p-6 border border-slate-200 bg-white space-y-3"><Clock className="h-5 w-5 text-cyan-700" /><h3 className="font-bold text-slate-900">{visitorPage.visitingHoursTitle ?? 'Visiting hours'}</h3><p className="text-xs leading-relaxed text-slate-600">{visitorPage.visitingHours}</p>{timeSlots.length > 0 && <ul className="space-y-1 text-[11px] text-slate-600">{timeSlots.map(slot => <li key={slot}>{slot}</li>)}</ul>}</article>}
            {visitorPage.securityInformation && <article className="p-6 border border-slate-200 bg-white space-y-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h3 className="font-bold text-slate-900">{visitorPage.securityTitle ?? 'Security information'}</h3><p className="text-xs leading-relaxed text-slate-600">{visitorPage.securityInformation}</p></article>}
            {visitorPage.groupGuidance && <article className="p-6 border border-slate-200 bg-white space-y-3"><Users className="h-5 w-5 text-cyan-700" /><h3 className="font-bold text-slate-900">{visitorPage.groupTitle ?? 'Group visits'}</h3><p className="text-xs leading-relaxed text-slate-600">{visitorPage.groupGuidance}</p></article>}
          </div>}

          {/* Regional Hub Campuses */}
          {hubLocationsList.length > 0 ? <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-600" />
                Published visitor locations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubLocationsList.map((hub, idx) => (
                <div
                  key={hub.value}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    {hub.tag && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono uppercase tracking-wider">{hub.tag}</span>}
                    <h4 className="font-bold text-base text-slate-900">{hub.name}</h4>
                    {hub.address && <p className="text-xs text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hub.address}</span>
                    </p>}

                    {(hub.zones?.length ?? 0) > 0 && <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Key Tour Zones:</span>
                      <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                        {hub.zones?.map(zone => (
                          <li key={zone}>{zone}</li>
                        ))}
                      </ul>
                    </div>}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{hub.contact}</span>
                    <button
                      onClick={() => {
                        setHubLocation(hub.value);
                        setActiveTab('book');
                      }}
                      className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                    >
                      Book Visit Here &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div> : <p className="border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No visitor locations have been published.</p>}
        </div>
      )}

      {/* TAB 2: REQUEST A VISIT FORM */}
      {activeTab === 'book' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest font-mono">
              Official Booking Form
            </span>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">
              Request Your Campus Access Pass
            </h2>
            <p className="text-xs text-slate-500">
              Submit your delegation or personal details. SiHub Operations will review and issue your digital security pass within 24 hours.
            </p>
          </div>

          {submittedReference && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm">Visit Request Successfully Submitted!</h4>
              </div>
              <p className="text-xs text-emerald-800">
                Your request has been logged into the SiHub Visitor Operations desk under Reference Code:{' '}
                <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                  {submittedReference}
                </strong>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setTrackInput(submittedReference);
                    handleTrackLookup();
                    setActiveTab('track');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  View Live Tracking Card &rarr;
                </button>
                <button
                  onClick={() => setSubmittedReference(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-xs"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleBookSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                1. Visitor Contact & Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Hodan Hassan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="hodan@institution.so"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+252 61 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organization / Institution
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    placeholder="e.g. Ministry, University, NGO, or Independent"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                2. Visit Logistics & Target Hub
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target SiHub Hub Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={hubLocation}
                    onChange={e => setHubLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Select a published location</option>
                    {hubLocationsList.map(hub => <option key={hub.value} value={hub.value}>{hub.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Purpose of Visit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Select a published visit purpose</option>
                    {visitPurposes.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requested Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={requestedDate}
                    onChange={e => setRequestedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Time Slot <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Select a published time slot</option>
                    {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Guests in Delegation <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={visitorCount}
                      onChange={e => setVisitorCount(parseInt(e.target.value) || 1)}
                      className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-500">
                      Guest count
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Areas of Interest & Specific Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={customDetails}
                    onChange={e => setCustomDetails(e.target.value)}
                    placeholder="Share any specific requirements for your visit."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                🔒 Protected under SiHub Institutional Privacy & Security Policy
              </span>
              <button
                type="submit"
                disabled={!hubLocationsList.length || !visitPurposes.length || !timeSlots.length}
                className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Submit Campus Visit Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TRACK REQUEST & DIGITAL VISITOR PASS */}
      {activeTab === 'track' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Tracking Search Input Bar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-slate-900">Track Visit Request Status</h3>
            <p className="text-xs text-slate-500">
              Enter your Visit Reference Code and the email address used when you submitted the request.
            </p>
            <form onSubmit={handleTrackLookup} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value)}
                  placeholder="Visit reference code"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                />
              </div>
              <input
                type="email"
                value={trackEmail}
                onChange={e => setTrackEmail(e.target.value)}
                placeholder="Request email address"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Lookup Pass
              </button>
            </form>
          </div>

          {/* Tracked Request Card */}
          {trackedRequest ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Status Header Banner */}
              <div className={`p-5 rounded-2xl border flex items-start justify-between gap-4 ${
                trackedRequest.status === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : trackedRequest.status === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-start gap-3">
                  {trackedRequest.status === 'approved' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : trackedRequest.status === 'pending' ? (
                    <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                      Status: {trackedRequest.status.toUpperCase()}
                    </span>
                    <h4 className="font-extrabold text-base">
                      {trackedRequest.status === 'approved'
                        ? 'Visit Authorized & Security Cleared'
                        : trackedRequest.status === 'pending'
                        ? 'Pending Security & Host Review'
                        : 'Visit Request Declined / Rescheduling Needed'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed">
                      {trackedRequest.status === 'approved'
                        ? 'Your digital visitor clearance pass is ready below. Please arrive 15 minutes prior to your time slot.'
                        : trackedRequest.status === 'pending'
                        ? 'Your request is currently being assigned to host engineers and security personnel.'
                        : trackedRequest.adminNotes || 'We are currently unable to accommodate this request due to campus scheduling conflicts.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 block">Ref Code</span>
                  <span className="font-mono font-bold text-sm">{trackedRequest.referenceCode}</span>
                </div>
              </div>

              {/* DIGITAL VISITOR PASS (Shown if Approved) */}
              {trackedRequest.status === 'approved' && (
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-2xl border border-cyan-500/30 relative overflow-hidden space-y-6">
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

                  {/* Pass Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-widest block font-bold">
                          Official Security Clearance Pass
                        </span>
                        <h3 className="text-lg font-bold">Somali Innovation Hub (SiHub)</h3>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      VALID ENTRY
                    </span>
                  </div>

                  {/* Pass Information Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Lead Visitor</span>
                      <strong className="text-white text-sm">{trackedRequest.fullName}</strong>
                      <span className="text-slate-400 text-[11px] block">{trackedRequest.organization}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Delegation Size</span>
                      <strong className="text-white text-sm">{trackedRequest.visitorCount} Person(s)</strong>
                      <span className="text-slate-400 text-[11px] block">{trackedRequest.purpose}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Target Campus</span>
                      <strong className="text-cyan-400 text-sm">{trackedRequest.hubLocation}</strong>
                      <span className="text-slate-400 text-[11px] block">Main Reception Gate</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Valid Date</span>
                      <strong className="text-white text-sm">{trackedRequest.requestedDate}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Assigned Time Slot</span>
                      <strong className="text-white text-sm">{trackedRequest.timeSlot}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Assigned Host</span>
                      <strong className="text-emerald-400 text-sm">
                        {trackedRequest.assignedHost || 'SiHub Visitor Relations Desk'}
                      </strong>
                    </div>
                  </div>

                  {/* Verified QR code and security clearance code */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {visitorQrCode ? <img src={visitorQrCode} alt="Verified visitor pass QR code" className="h-28 w-28 rounded-lg bg-white p-2" /> : <QrCode className="h-8 w-8 animate-pulse text-cyan-300" />}
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Security Clearance Reference
                      </span>
                      <div className="font-mono text-cyan-300 font-bold tracking-widest text-sm">
                        {trackedPass?.securityClearanceCode || 'Unavailable'}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Present this screen or printed badge to security guards at main entrance.
                      </p>
                    </div>

                    <button
                      onClick={printVisitorPass}
                      disabled={!visitorQrCode}
                      className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 transition-colors shadow-xs shrink-0 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">No Request Selected</h4>
              <p className="text-xs text-slate-500">
                Enter a reference code above, or select a request from your visit history.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VISIT REQUEST HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">My visit requests</h3>
              <p className="text-xs text-slate-500">
                Select a request to retrieve its current status and issued pass.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{visitRequests.length} Total Logged</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visitRequests.map(req => (
              <div
                key={req.id}
                onClick={() => {
                  setTrackInput(req.referenceCode);
                  setTrackedRequest(req);
                  setActiveTab('track');
                  void handleTrackLookup(undefined, req.referenceCode);
                }}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500 hover:shadow-md cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {req.referenceCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    req.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{req.fullName}</h4>
                  <p className="text-xs text-slate-500">{req.organization}</p>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                  <div>Campus: <strong>{req.hubLocation}</strong></div>
                  <div>Date: <strong>{req.requestedDate}</strong></div>
                  <div>Delegation: <strong>{req.visitorCount} guest(s)</strong></div>
                </div>

                <div className="text-[11px] font-bold text-cyan-600 flex items-center justify-between pt-1">
                  <span>View Pass Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
