/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Mobile Phone Bottom Navigation Bar
 * Provides instant app-like touch navigation on Android and iOS devices.
 */

import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import {
  Home,
  GraduationCap,
  Sparkles,
  Rocket
} from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const { currentView, navigateTo } = useApp();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {/* Home */}
      <button
        onClick={() => navigateTo('home')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[50px] ${
          currentView === 'home'
            ? 'text-cyan-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* Programs */}
      <button
        onClick={() => navigateTo('programs')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[50px] ${
          currentView === 'programs'
            ? 'text-cyan-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Rocket className={`w-5 h-5 ${currentView === 'programs' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5">Programs</span>
      </button>

      {/* Startups */}
      <button
        onClick={() => navigateTo('startups')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[50px] ${
          currentView === 'startups'
            ? 'text-cyan-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Sparkles className={`w-5 h-5 ${currentView === 'startups' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5">Startups</span>
      </button>

      {/* SiHub Institute */}
      <button
        onClick={() => navigateTo('courses')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[50px] ${
          currentView === 'courses'
            ? 'text-cyan-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <GraduationCap className={`w-5 h-5 ${currentView === 'courses' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5">Institute</span>
      </button>

    </div>
  );
};
