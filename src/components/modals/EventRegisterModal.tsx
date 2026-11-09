/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Event Registration & Digital QR Pass Generator
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { EventRegistration } from '../../types';
import { apiPost, ApiError } from '../../services/apiClient';
import QRCode from 'qrcode';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  Download,
  CalendarPlus
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const EventRegisterModal: React.FC = () => {
  const {
    selectedEventForRegister,
    setSelectedEventForRegister,
    currentUser,
    addToast,
    triggerRefresh,
    navigateTo
  } = useApp();

  const [registration, setRegistration] = useState<(EventRegistration & { status: string }) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    let active = true;
    if (!registration) { setQrCode(''); return; }
    QRCode.toDataURL(registration.ticketCode, { errorCorrectionLevel: 'Q', margin: 1, width: 256 })
      .then(dataUrl => { if (active) setQrCode(dataUrl); })
      .catch(() => { if (active) addToast('error', 'Pass QR Unavailable', 'Your registration is saved, but its QR code could not be generated.'); });
    return () => { active = false; };
  }, [registration]);

  if (!selectedEventForRegister) return null;

  const handleClose = () => {
    setSelectedEventForRegister(null);
    setRegistration(null);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const userName = String(formData.get('fullName') || '').trim();
    const userEmail = String(formData.get('email') || '').trim();
    const organization = String(formData.get('organization') || '').trim();
    try {
      const { submission } = await apiPost<{ submission: { id: string; referenceCode: string; createdAt: string; status: string } }>('/api/submissions/event-registration', { payload: {
        eventId: selectedEventForRegister.id,
        eventTitle: selectedEventForRegister.title,
        fullName: userName,
        email: userEmail,
        organization
      } });
      const reg: EventRegistration & { status: string } = {
        id: submission.id,
        eventId: selectedEventForRegister.id,
        eventTitle: selectedEventForRegister.title,
        eventDate: selectedEventForRegister.date,
        userId: currentUser.id,
        userName,
        userEmail,
        ticketCode: submission.referenceCode,
        registeredAt: submission.createdAt,
        attended: false,
        status: submission.status
      };
      setRegistration(reg);
      setIsSubmitting(false);
      triggerRefresh();
      addToast('success', 'Event Registered', `Registration saved. Reference: ${submission.referenceCode}.`);
    } catch (reason) {
      setIsSubmitting(false);
      addToast('error', 'Registration Failed', reason instanceof ApiError ? reason.message : 'Unable to register for the event.');
    }
  };

  const printTicket = () => {
    if (!registration || !qrCode) return;
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      addToast('error', 'Print Window Blocked', 'Allow pop-ups to print or save your ticket as PDF.');
      return;
    }
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
    printWindow.addEventListener('load', () => printWindow.print(), { once: true });
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SiHub Event Ticket</title><style>body{font-family:Arial,sans-serif;color:#14212b;margin:36px}.ticket{border:2px solid #14212b;padding:24px;max-width:680px}header{border-bottom:2px solid #087f8c;padding-bottom:14px}h1{font-size:22px;margin:0}p{color:#53636b}.grid{display:grid;grid-template-columns:1fr 180px;gap:20px;align-items:center;margin-top:20px}.code{font:700 18px monospace;color:#087f8c}img{width:170px;height:170px}@media print{body{margin:12mm}}</style></head><body><article class="ticket"><header><h1>${escapeHtml(registration.eventTitle)}</h1><p>Somali Innovation Hub event registration</p></header><div class="grid"><div><p>Attendee: <strong>${escapeHtml(registration.userName)}</strong></p><p>Date: ${escapeHtml(registration.eventDate)}</p><p>Venue: ${escapeHtml(selectedEventForRegister.venue)}</p><p class="code">${escapeHtml(registration.ticketCode)}</p></div><img src="${qrCode}" alt="QR code for registration ${escapeHtml(registration.ticketCode)}"></div></article></body></html>`);
    printWindow.document.close();
  };

  const addToCalendar = () => {
    if (!registration) return;
    const startTime = selectedEventForRegister.time.split(/\s*(?:-|–|—|to)\s*/i)[0];
    const start = new Date(`${registration.eventDate} ${startTime}`);
    if (Number.isNaN(start.getTime())) {
      addToast('error', 'Calendar Export Failed', 'The event date or time is not in a supported format.');
      return;
    }
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const escapeIcs = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const contents = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SiHub//Event Registration//EN', 'BEGIN:VEVENT', `UID:${registration.ticketCode}@sihub`, `DTSTAMP:${formatDate(new Date())}`, `DTSTART:${formatDate(start)}`, `DTEND:${formatDate(end)}`, `SUMMARY:${escapeIcs(registration.eventTitle)}`, `LOCATION:${escapeIcs(selectedEventForRegister.venue)}`, `DESCRIPTION:${escapeIcs(`Registration reference ${registration.ticketCode}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${registration.ticketCode}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider block mb-1">
            SiHub Events & Community
          </span>
          <h3 className="text-xl font-bold pr-6">{selectedEventForRegister.title}</h3>
          <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-300 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {selectedEventForRegister.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> {selectedEventForRegister.time}
            </span>
          </div>
        </div>

        {registration ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-950">Registration received</h4>
              <p className="text-xs text-emerald-700">Current status: {registration.status}. Track the decision with your reference and email.</p>
            </div>

            {/* Visual Digital Ticket Badge */}
            <div className="border-2 border-slate-900 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-900 text-cyan-300 px-3 py-1 text-[10px] font-mono font-bold rounded-bl-xl uppercase tracking-wider">
                {registration.ticketCode}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <BrandLogo size="sm" showSubtitle={false} />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Event registration reference</h5>
                  <span className="text-[10px] text-slate-500">Show after approval for event check-in</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-3 border-t border-slate-200">
                <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs border border-slate-300 flex items-center justify-center shrink-0">
                  {qrCode ? <img src={qrCode} alt={`QR code for registration ${registration.ticketCode}`} className="h-full w-full" /> : <QrCode className="h-8 w-8 animate-pulse text-slate-400" />}
                </div>

                <div className="text-left text-xs space-y-1.5 flex-1 min-w-0">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Attendee Name</span>
                    <strong className="text-slate-900 truncate block">{registration.userName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Venue & Access</span>
                    <span className="text-slate-700 text-[11px] block truncate">{selectedEventForRegister.venue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {registration.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={printTicket}
                disabled={!qrCode}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Print / Save Ticket
              </button>
              <button
                onClick={addToCalendar}
                className="py-2.5 px-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold text-xs flex items-center justify-center gap-2 border border-cyan-200"
              >
                <CalendarPlus className="w-4 h-4" /> Add to Calendar
              </button>
            </div>
            <button onClick={() => { handleClose(); navigateTo('submission_tracking'); }} className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-900">Track registration status</button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <MapPin className="w-4 h-4 text-cyan-600" /> Venue:
              </div>
              <p>{selectedEventForRegister.venue}</p>
              <div className="pt-2 text-slate-500">
                Keynote / Lead: <strong>{selectedEventForRegister.speaker}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={currentUser.fullName === 'Site Visitor' ? '' : currentUser.fullName}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={currentUser.email}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Sector</label>
                <input
                  type="text"
                  name="organization"
                  defaultValue={currentUser.organization || ''}
                  placeholder="Organization or sector (optional)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? 'Registering...' : 'Confirm Registration & Get Pass'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
