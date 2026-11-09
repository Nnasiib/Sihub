/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Dedicated Education Portal Shell & Layout
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  BookOpen,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface EducationLayoutProps {
  children: React.ReactNode;
  activePortal: 'hub' | 'admin' | 'teacher' | 'student';
}

export const EducationLayout: React.FC<EducationLayoutProps> = ({ children, activePortal }) => {
  const {
    navigateTo,
    currentUser,
    authUser
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePortalSwitch = (portal: 'hub' | 'admin' | 'teacher' | 'student') => {
    switch (portal) {
      case 'hub': navigateTo('education'); break;
      case 'admin': navigateTo('education_admin'); break;
      case 'teacher': navigateTo('education_teacher'); break;
      case 'student': navigateTo('education_student'); break;
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Education Portal Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Left: Brand Logo & Education Subtitle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BrandLogo size="sm" showSubtitle={false} lightText={true} onClick={() => navigateTo('home')} />
            <div className="pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-white font-heading truncate">
                  SiHub Education Portal
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                  Task 2 System
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                Role-based academic governance, teaching workspace & learning LMS
              </p>
            </div>
          </div>

          {/* Desktop Center: Portal Switcher Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handlePortalSwitch('hub')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePortal === 'hub'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Portal Home</span>
            </button>

            <button
              onClick={() => handlePortalSwitch('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePortal === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Education Admin</span>
            </button>

            <button
              onClick={() => handlePortalSwitch('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePortal === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Teacher Portal</span>
            </button>

            <button
              onClick={() => handlePortalSwitch('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePortal === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
          </nav>

          {/* Right Actions: Account and Navigation */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block max-w-36 truncate text-right text-[10px] text-slate-400">{currentUser.fullName}<span className="block font-mono uppercase text-emerald-300">{authUser?.role.replaceAll('_', ' ') ?? 'guest'}</span></div>

            {/* Back to Public Institutional Website */}
            <button
              onClick={() => navigateTo('home')}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            {/* Mobile Hamburger Toggle for Education */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 text-white border border-slate-800 active:scale-95"
              aria-label="Education Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer for Education */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-2 animate-in fade-in">
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={() => handlePortalSwitch('hub')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activePortal === 'hub' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Portal Home</span>
              </button>

              <button
                onClick={() => handlePortalSwitch('admin')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activePortal === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Edu Admin</span>
              </button>

              <button
                onClick={() => handlePortalSwitch('teacher')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activePortal === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Teacher Desk</span>
              </button>

              <button
                onClick={() => handlePortalSwitch('student')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activePortal === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <span>Student Hub</span>
              </button>
            </div>

            <button
              onClick={() => {
                navigateTo('home');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Main Institutional Site</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
};
