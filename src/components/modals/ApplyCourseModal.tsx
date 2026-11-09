/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Course Enrollment Application Modal
 * Enforces LMS rule: All course enrollments require SiHub Admin review & approval.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiPost, ApiError } from '../../services/apiClient';
import { X, ShieldAlert, GraduationCap, CheckCircle, Clock } from 'lucide-react';

export const ApplyCourseModal: React.FC = () => {
  const {
    selectedCourseForApply,
    setSelectedCourseForApply,
    currentUser,
    authUser,
    addToast,
    triggerRefresh,
    navigateTo
  } = useApp();

  const [motivation, setMotivation] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [background, setBackground] = useState('Undergraduate student in engineering/IT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!selectedCourseForApply) return null;

  const handleClose = () => {
    setSelectedCourseForApply(null);
    setSubmittedSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      addToast('warning', 'Student Sign-In Required', 'Create or sign in to a student account before applying for course access.');
      handleClose();
      navigateTo('education_student');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPost('/api/education/enrollments', {
        courseId: selectedCourseForApply.id,
        motivation: `${motivation} | Background: ${background} | Phone: ${phone}`
      });
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      addToast(
        'info',
        'Application Submitted for Admin Approval',
        `Your application for "${selectedCourseForApply.title}" is stored for SiHub administrator review.`
      );
    } catch (reason) {
      setIsSubmitting(false);
      addToast('error', 'Enrollment Failed', reason instanceof ApiError ? reason.message : 'Unable to submit enrollment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" /> SiHub Academy Enrollment
          </div>
          <h3 className="text-xl font-bold pr-6">{selectedCourseForApply.title}</h3>
          <p className="text-xs text-slate-300 mt-1">
            Instructor: {selectedCourseForApply.instructorName} • {selectedCourseForApply.durationWeeks} Weeks • {selectedCourseForApply.deliveryMode}
          </p>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Application Successfully Submitted!</h4>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="w-4 h-4" /> Status: Pending SiHub Admin Approval
              </div>
              <p>
                As part of our quality and cohort sizing governance, all course applications are reviewed by SiHub instructors and administrators before course modules and lessons unlock.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => {
                  handleClose();
                  navigateTo('learner_portal');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors"
              >
                Go to My Learner Dashboard &rarr;
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Business Rule Callout */}
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">LMS Governance Note:</strong>
                <p className="mt-0.5 text-slate-700 text-[11px]">
                  All enrollments require administrator approval. Once approved, the full interactive curriculum, video streams, reading documents, and quizzes become accessible.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Learner Full Name</label>
                <input
                  type="text"
                  required
                  defaultValue={currentUser.fullName}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  defaultValue={currentUser.email}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+252 61 XXX XXXX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic / Tech Background</label>
                <select
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                >
                  <option>Undergraduate student (STEM)</option>
                  <option>Working Professional / Entrepreneur</option>
                  <option>Secondary School Graduate</option>
                  <option>Self-taught Developer / Tinkerer</option>
                  <option>Community Organizer / Educator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statement of Motivation & Impact Goal
              </label>
              <textarea
                required
                rows={3}
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                placeholder="Explain why you want to take this course and how you will apply the knowledge in your community..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Tuition and support details are provided with each published course.
              </span>
              <div className="flex gap-2">
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
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
