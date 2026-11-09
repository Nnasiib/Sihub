/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Official Brand Logo Component
 * Strictly preserves the authentic uploaded Somali Innovation Hub logo.
 */

import React from 'react';
const SIHUB_LOGO_URL = '/assets/aistudio/FB_IMG_1793630993622_edit_183670017242279_811cbd58.jpg';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  lightText?: boolean;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  lightText = false,
  onClick
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-13 sm:h-14',
    xl: 'h-18 sm:h-20'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center bg-white p-1 rounded-xl shadow-xs border border-slate-100">
        <img
          src={SIHUB_LOGO_URL}
          alt="Somali Innovation Hub (SiHub) Official Logo"
          className={`${heightClasses[size]} w-auto object-contain transition-transform hover:scale-102`}
          onError={(e) => {
            // Graceful fallback if image is loading
            const target = e.currentTarget;
            target.onerror = null;
            target.src = SIHUB_LOGO_URL;
          }}
        />
      </div>

      {showSubtitle && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-lg sm:text-xl font-heading ${lightText ? 'text-white' : 'text-slate-900'}`}>
              SiHub
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              ECOSYSTEM
            </span>
          </div>
          <span className={`text-[10px] font-medium tracking-wide uppercase ${lightText ? 'text-cyan-200' : 'text-slate-500'}`}>
            Somali Innovation Hub
          </span>
        </div>
      )}
    </div>
  );
};
