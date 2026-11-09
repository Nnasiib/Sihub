/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Mobile-Optimized Administration Dashboard Layout & Shell
 * Fixes mobile navigation and adds dedicated three-dot menu (⋮) action desk.
 */

import React, { useState, useEffect } from 'react';
import { useApp, AdminTab } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Rocket,
  Lightbulb,
  Layers,
  Users2,
  Calendar,
  Compass,
  Award,
  Handshake,
  FileText,
  Images,
  BarChart3,
  Bot,
  Settings,
  Search,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  MoreVertical,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const {
    adminTab,
    setAdminTab,
    currentUser,
    navigateTo,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminThreeDotOpen, setAdminThreeDotOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');

  // Prevent background scrolling when mobile drawers are open
  useEffect(() => {
    if (sidebarOpen || adminThreeDotOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, adminThreeDotOpen]);

  const navItems: { tab: AdminTab; label: string; shortLabel: string; icon: React.ReactNode; badge?: string }[] = [
    { tab: 'overview', label: '6.1 Executive Overview', shortLabel: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'users', label: '6.2 User Management', shortLabel: 'Users', icon: <Users className="w-4 h-4" /> },
    { tab: 'lms', label: '6.3 Education & LMS', shortLabel: 'LMS / Approvals', icon: <GraduationCap className="w-4 h-4" />, badge: 'Approvals' },
    { tab: 'startups', label: '6.4 Startup Hub', shortLabel: 'Startups', icon: <Rocket className="w-4 h-4" /> },
    { tab: 'innovation', label: '6.5 Innovation Projects', shortLabel: 'Innovation', icon: <Lightbulb className="w-4 h-4" /> },
    { tab: 'programs', label: '6.6 Programs & Cohorts', shortLabel: 'Programs', icon: <Layers className="w-4 h-4" /> },
    { tab: 'community', label: '6.7 Community Groups', shortLabel: 'Community', icon: <Users2 className="w-4 h-4" /> },
    { tab: 'events', label: '6.8 Events & Attendance', shortLabel: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { tab: 'mentorship', label: '6.9 Mentorship Desk', shortLabel: 'Mentorship', icon: <Compass className="w-4 h-4" /> },
    { tab: 'opportunities', label: '6.10 Grants & Jobs', shortLabel: 'Grants', icon: <Award className="w-4 h-4" /> },
    { tab: 'partnerships', label: '6.11 Partnerships & MOUs', shortLabel: 'Partners', icon: <Handshake className="w-4 h-4" /> },
    { tab: 'content', label: '6.0 Website Builder & CMS', shortLabel: 'Website Builder', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, badge: 'Builder' },
    { tab: 'media', label: '6.13 Media Library', shortLabel: 'Media', icon: <Images className="w-4 h-4" /> },
    { tab: 'impact', label: '6.14 Impact & Analytics', shortLabel: 'Impact', icon: <BarChart3 className="w-4 h-4" /> },
    { tab: 'ai', label: '6.15 AI Assistant Settings', shortLabel: 'AI Config', icon: <Bot className="w-4 h-4" />, badge: 'Config' },
    { tab: 'settings', label: '6.16 Settings & Security', shortLabel: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { tab: 'visitors', label: '6.17 Visitor & Delegation Desk', shortLabel: 'Visitors', icon: <Compass className="w-4 h-4 text-cyan-400" />, badge: 'Passes' }
  ];
  const visibleNavItems = navItems.filter(item => `${item.label} ${item.shortLabel} ${item.tab}`.toLowerCase().includes(moduleSearch.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Top Admin Header */}
      <header className="h-14 sm:h-16 bg-slate-950 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle (☰) */}
          <button
            onClick={() => {
              setSidebarOpen(true);
              setAdminThreeDotOpen(false);
            }}
            className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo size="sm" showSubtitle={false} lightText={true} onClick={() => navigateTo('home')} />
          
          <div className="hidden sm:block pl-2 border-l border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              SiHub Admin Console
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Operations Console
            </span>
          </div>
        </div>

        {/* Global Search and Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="relative hidden xl:block w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={moduleSearch}
              onChange={event => setModuleSearch(event.target.value)}
              aria-label="Search admin modules"
              placeholder="Search admin modules..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Education Dedicated Portal Fast Access */}
          <button
            onClick={() => navigateTo('education_admin')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 text-xs font-semibold transition-colors active:scale-95"
            title="Open Dedicated Education Admin Portal"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Education Admin</span>
          </button>

          {/* AI Config */}
          <button
            onClick={() => setAdminTab('ai')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/50 text-xs font-semibold transition-colors active:scale-95"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Config</span>
          </button>

          {/* Public Site */}
          <button
            onClick={() => navigateTo('home')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors active:scale-95"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left truncate max-w-[120px]">
              <span className="text-xs font-bold text-white block leading-tight truncate">{currentUser.fullName}</span>
              <span className="text-[10px] text-emerald-400 font-mono uppercase">{currentUser.role}</span>
            </div>
          </div>

          {/* TASK 1 FIX: Three-Dot Menu Button (⋮) in Admin Header */}
          <button
            onClick={() => {
              setAdminThreeDotOpen(!adminThreeDotOpen);
              setSidebarOpen(false);
            }}
            className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors active:scale-95 ${
              adminThreeDotOpen
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'text-slate-300 bg-slate-900 hover:bg-slate-800 border-slate-800'
            }`}
            aria-label="Admin More Actions"
            title="Admin Quick Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-800 flex-col justify-between shrink-0">
          <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
              Modules Directory
            </div>

            {visibleNavItems.map(item => {
              const isActive = adminTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setAdminTab(item.tab)}
                  className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-98 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        isActive
                          ? 'bg-slate-950 text-cyan-300'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Info */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected administration</span>
            </div>
            <div className="text-[9px] text-slate-500 leading-tight">
              PostgreSQL schema & server-side auth mapped in 6.15 Settings.
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-slate-900 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-12">
          {/* Quick Module Scroll Pills for Phone Screens */}
          <div className="lg:hidden mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
            {visibleNavItems.map(item => {
              const isActive = adminTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setAdminTab(item.tab)}
                  className={`px-3 py-1.5 min-h-[36px] rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.shortLabel}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* TASK 1 FIX: Mobile Sidebar Drawer (Hoisted to root level, z-[100]) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 flex flex-col justify-between shadow-2xl">
            <div className="p-4 space-y-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Admin Modules</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                Modules Directory
              </div>

              {navItems.map(item => {
                const isActive = adminTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setAdminTab(item.tab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-98 ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                          isActive
                            ? 'bg-slate-950 text-cyan-300'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
              <button
                onClick={() => navigateTo('home')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800"
              >
                <span>Exit to Public Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* TASK 1 FIX: Admin Three-Dot Quick Actions Sheet (Hoisted to root level, z-[100]) */}
      {adminThreeDotOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-start bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setAdminThreeDotOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md sm:mx-auto sm:mt-16 bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Admin Quick Access</h3>
                  <p className="text-[11px] text-slate-400">Institutional portals & rapid controls</p>
                </div>
              </div>
              <button
                onClick={() => setAdminThreeDotOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Education Portal Jump */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 border border-emerald-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                  Task 2 Extension
                </span>
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-bold text-sm text-white">Dedicated Education Portals</div>
              <p className="text-[11px] text-emerald-200/90 leading-snug">
                Switch between Education Admin, Teacher Grading Desk, and Student Exam spaces.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    navigateTo('education_admin');
                    setAdminThreeDotOpen(false);
                  }}
                  className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs text-center"
                >
                  Edu Admin
                </button>
                <button
                  onClick={() => {
                    navigateTo('education_teacher');
                    setAdminThreeDotOpen(false);
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700 text-xs font-semibold text-center"
                >
                  Teacher
                </button>
                <button
                  onClick={() => {
                    navigateTo('education_student');
                    setAdminThreeDotOpen(false);
                  }}
                  className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-700 text-xs font-semibold text-center"
                >
                  Student
                </button>
              </div>
            </div>

            {/* System Actions */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administration Tools
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setAdminTab('ai');
                    setAdminThreeDotOpen(false);
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center gap-2"
                >
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">AI Config</div>
                    <div className="text-[10px] text-slate-400">Assistant prompt</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigateTo('home');
                    setAdminThreeDotOpen(false);
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Public Website</div>
                    <div className="text-[10px] text-slate-400">Live preview</div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
