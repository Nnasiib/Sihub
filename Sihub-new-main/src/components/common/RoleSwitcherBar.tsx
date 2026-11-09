/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Authenticated Session Controls
 * Fully responsive across Android phones, tablets, and desktop displays.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  ExternalLink,
  LogOut,
  KeyRound
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentUser,
    language,
    setLanguage,
    currentView,
    navigateTo,
    authUser,
    logout
  } = useApp();

  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-3 sm:px-6 relative z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-300">
          <span className="hidden sm:inline text-slate-500">Signed in as</span>
          <strong className="truncate text-white">{currentUser.fullName}</strong>
          <span className="hidden md:inline rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan-300">{authUser?.role.replaceAll('_', ' ')}</span>
        </div>

        {/* Right: Quick Controls (Compact on Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentView === 'admin' && <button onClick={() => navigateTo('home')} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-600/20 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-600/30"><span className="hidden sm:inline">Public Website</span><span className="sm:hidden">Site</span><ExternalLink className="h-3 w-3" /></button>}

          {authUser ? (
            <>
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-700"
                title="Change account password"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Password</span>
              </button>
              <button
                onClick={() => void logout()}
                className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-700"
                title={`Sign out ${authUser.email}`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : null}

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-colors ${
                language === 'en'
                  ? 'bg-cyan-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('so')}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-colors ${
                language === 'so'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SO
            </button>
          </div>

        </div>
      </div>

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  );
};
