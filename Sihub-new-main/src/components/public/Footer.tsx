/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Institutional Website Footer
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { useCmsPage } from '../../hooks/useCmsPage';
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  Heart
} from 'lucide-react';

type FooterCmsPage = {
  topEyebrow?: string;
  topTitle?: string;
  topDescription?: string;
  topPartnerAction?: string;
  organizationDescription?: string;
  address?: string;
  email?: string;
  phone?: string;
  groups?: { title?: string; items?: string[] }[];
  hubs?: { name?: string; description?: string }[];
  certification?: string;
  closingLine?: string;
};

export const Footer: React.FC = () => {
  const { navigateTo, language, t } = useApp();
  const { page: cmsFooter } = useCmsPage<FooterCmsPage>('footer');
  const portalLabels = cmsFooter?.groups?.[0]?.items ?? [];
  const communityLabels = cmsFooter?.groups?.[1]?.items ?? [];
  const hubs = cmsFooter?.hubs;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-cyan-400 font-semibold uppercase text-xs tracking-wider">
              {cmsFooter?.topEyebrow ?? (language === 'so' ? 'Hal-abuurka Qaranka' : 'National Innovation Ecosystem')}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {cmsFooter?.topTitle ?? t.tagline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {cmsFooter?.topDescription ?? t.taglineSub}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => navigateTo('programs')}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-102"
            >
              {t.actions.explorePrograms}
            </button>
            <button
              onClick={() => navigateTo('partnerships')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              {cmsFooter?.topPartnerAction ?? 'Partner With Us'} &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Organization & Logo */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="lg" showSubtitle={true} lightText={true} />
            {cmsFooter?.organizationDescription && <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{cmsFooter.organizationDescription}</p>}

            <div className="space-y-2 text-xs text-slate-300 pt-2">
              {cmsFooter?.address && <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{cmsFooter.address}</span>
              </div>}
              {cmsFooter?.email && <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{cmsFooter.email}</span>
              </div>}
              {cmsFooter?.phone && <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{cmsFooter.phone}</span>
              </div>}
            </div>
          </div>

          {/* Column 2: Dedicated Ecosystem Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{cmsFooter?.groups?.[0]?.title ?? 'Ecosystem Portals'}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('learner_portal')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {portalLabels[0] ?? 'Learner Portal'} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('startup_portal')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {portalLabels[1] ?? 'Startup Portal'} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('partner_portal')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {portalLabels[2] ?? 'Partner Portal'} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('visitor_portal')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {portalLabels[3] ?? 'Visitor Portal & Tours'} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('courses')} className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {portalLabels[4] ?? 'SiHub Institute (Academy)'} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Community & Opportunities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{cmsFooter?.groups?.[1]?.title ?? 'Community & Impact'}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('events')} className="hover:text-cyan-400 transition-colors">
                  {communityLabels[0] ?? 'Somali Innovation Summit'}
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('opportunities')} className="hover:text-cyan-400 transition-colors">
                  {communityLabels[1] ?? 'Grants & Scholarships'}
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('community')} className="hover:text-cyan-400 transition-colors">
                  {communityLabels[2] ?? 'Regional Youth Hubs'}
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('news')} className="hover:text-cyan-400 transition-colors">
                  {communityLabels[3] ?? 'Research & Publications'}
                </button>
              </li>
              <li><button onClick={() => navigateTo('submission_tracking')} className="hover:text-cyan-400 transition-colors">Track a submission</button></li>
              <li>
                <button onClick={() => navigateTo('partnerships')} className="hover:text-cyan-400 transition-colors">
                  {communityLabels[4] ?? 'Institutional Partners'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Regional Hubs & Governance */}
          {hubs?.length ? <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Regional Hubs</h4>
            <div className="text-xs text-slate-400 space-y-2">
              {hubs.map(hub => <div key={hub.name}>
                <strong className="text-slate-200">{hub.name}</strong>
                {hub.description && <p className="text-[11px]">{hub.description}</p>}
              </div>)}
            </div>
          </div> : null}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Somali Innovation Hub (SiHub). All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => navigateTo('contact')} className="hover:text-cyan-400 transition-colors text-slate-300">
              Contact Us
            </button>
            <span>•</span>
            {cmsFooter?.certification && <span className="flex items-center gap-1 text-emerald-400 font-semibold"><ShieldCheck className="w-3.5 h-3.5" />{cmsFooter.certification}</span>}
            {cmsFooter?.closingLine && <span className="text-slate-400">{cmsFooter.closingLine}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
};
