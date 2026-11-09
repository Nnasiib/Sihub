/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - About SiHub Page
 * Grounded in approved Organizational Identity, Vision, Mission, and Core Values.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import { DynamicCmsSections } from './DynamicCmsSections';
import type { CmsPageSection } from '../../types/cmsBlocks';
import {
  Target,
  Eye,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Lightbulb,
  Leaf,
  GraduationCap
} from 'lucide-react';

type AboutPageContent = {
  slug?: string;
  title?: string | null;
  summary?: string | null;
  sections?: CmsPageSection[];
  whoWeAre?: { eyebrow?: string | null; heading?: string | null; tagline?: string | null; description?: string | null; body?: string | null; image?: string | null; imageType?: 'image' | 'video'; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null; videoCaption?: string | null };
  principlesEyebrow?: string | null;
  principlesHeading?: string | null;
  vision?: { label?: string | null; heading?: string | null; description?: string | null; footer?: string | null; image?: string | null; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null; videoCaption?: string | null };
  mission?: { label?: string | null; heading?: string | null; description?: string | null; footer?: string | null; image?: string | null; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null; videoCaption?: string | null };
  coreValuesTitle?: string | null;
  coreValuesDescription?: string | null;
  coreValues?: { num?: string | null; title?: string | null; desc?: string | null }[] | null;
  teamEyebrow?: string | null;
  teamTitle?: string | null;
  teamDescription?: string | null;
  team?: { name?: string | null; role?: string | null; location?: string | null; bio?: string | null; image?: string | null; imageType?: 'image' | 'video'; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null }[] | null;
  additionalSections?: { title?: string | null; body?: string | null; image?: string | null; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null; videoCaption?: string | null }[] | null;
  banner?: { title?: string | null; description?: string | null; image?: string | null; imageType?: 'image' | 'video'; imageAlt?: string | null; imageCaption?: string | null; video?: string | null; videoAlt?: string | null; videoCaption?: string | null; exploreAction?: string | null; partnerAction?: string | null };
};

export const About: React.FC<{ previewContent?: AboutPageContent }> = ({ previewContent }) => {
  const { navigateTo } = useApp();
  const { page: storedAboutPage } = useCmsPage<AboutPageContent>('about');
  const aboutPage = previewContent ?? storedAboutPage;

  const coreValueIcons = [
    <Lightbulb className="w-5 h-5 text-amber-500" />,
    <Users className="w-5 h-5 text-cyan-500" />,
    <GraduationCap className="w-5 h-5 text-indigo-500" />,
    <Sparkles className="w-5 h-5 text-emerald-500" />,
    <HeartHandshake className="w-5 h-5 text-blue-500" />,
    <Leaf className="w-5 h-5 text-teal-500" />,
    <ShieldCheck className="w-5 h-5 text-rose-500" />
  ];

  const displayedValues = (aboutPage?.coreValues ?? []).map((value, index) => ({
    ...value,
    num: value.num ?? String(index + 1).padStart(2, '0'),
    icon: coreValueIcons[index % coreValueIcons.length]
  }));
  const displayedTeam = aboutPage?.team ?? [];
  const whoWeAre = aboutPage?.whoWeAre;
  const vision = aboutPage?.vision;
  const mission = aboutPage?.mission;
  const banner = aboutPage?.banner;

  return (
    <div className="space-y-20 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <DynamicCmsSections pageSlug="about" placement="top" previewSections={previewContent?.sections} />
      {/* 1. Who We Are / Strategic Identity Section */}
      <section id="who-we-are" className="scroll-mt-28 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {whoWeAre?.eyebrow && <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">{whoWeAre.eyebrow}</span>}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
            {whoWeAre?.heading ?? aboutPage?.title ?? 'About SiHub'}
          </h1>
          {(whoWeAre?.tagline || whoWeAre?.description) && <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900 via-slate-900 to-emerald-950 text-white shadow-xl text-left sm:text-center space-y-2 border border-slate-800">
            {whoWeAre.tagline && <p className="text-lg sm:text-xl font-bold font-heading text-cyan-300">{whoWeAre.tagline}</p>}
            {whoWeAre.description && <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">{whoWeAre.description}</p>}
          </div>}
          {(whoWeAre?.body || aboutPage?.summary) && <p className="text-base text-slate-600 leading-relaxed pt-2">{whoWeAre?.body ?? aboutPage?.summary}</p>}
          <CmsMedia src={whoWeAre?.image} kind={whoWeAre?.imageType ?? 'image'} alt={whoWeAre?.imageAlt ?? ''} caption={whoWeAre?.imageCaption ?? undefined} className="mx-auto max-h-80 w-full rounded-2xl object-cover" />
          <CmsMedia src={whoWeAre?.video} kind="video" alt={whoWeAre?.videoAlt ?? ''} caption={whoWeAre?.videoCaption ?? undefined} className="mx-auto max-h-96 w-full rounded-2xl object-cover" />
        </div>
      </section>

      {/* 2. Vision & Mission Section */}
      {(vision || mission) && <section id="vision-mission" className="scroll-mt-28 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              {aboutPage?.principlesEyebrow ?? 'Guiding Principles'}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
            {aboutPage?.principlesHeading ?? 'Our Vision & Mission'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision Card */}
          {vision && <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-cyan-950 to-slate-900 text-white shadow-xl space-y-5 border border-cyan-900/50 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block">
                {vision.label ?? 'Vision'}
              </span>
                  {vision.heading && <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">{vision.heading}</h3>}
                  {vision.description && <p className="text-sm text-slate-200 leading-relaxed font-normal">{vision.description}</p>}
              <CmsMedia src={vision.image} kind="image" alt={vision.imageAlt ?? vision.heading ?? 'Vision'} caption={vision.imageCaption ?? undefined} className="max-h-56 w-full rounded-xl object-cover" />
              <CmsMedia src={vision.video} kind="video" alt={vision.videoAlt ?? vision.heading ?? 'Vision video'} caption={vision.videoCaption ?? undefined} className="max-h-56 w-full rounded-xl object-cover" />
            </div>
                {vision.footer && <div className="pt-4 border-t border-cyan-800/40 text-xs text-cyan-300/80 font-mono">{vision.footer}</div>}
            </div>}

          {/* Mission Card */}
              {mission && <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-xl space-y-5 border border-emerald-900/50 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                {mission.label ?? 'Mission'}
              </span>
              {mission.heading && <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">{mission.heading}</h3>}
              {mission.description && <p className="text-sm text-slate-200 leading-relaxed font-normal">{mission.description}</p>}
              <CmsMedia src={mission.image} kind="image" alt={mission.imageAlt ?? mission.heading ?? 'Mission'} caption={mission.imageCaption ?? undefined} className="max-h-56 w-full rounded-xl object-cover" />
              <CmsMedia src={mission.video} kind="video" alt={mission.videoAlt ?? mission.heading ?? 'Mission video'} caption={mission.videoCaption ?? undefined} className="max-h-56 w-full rounded-xl object-cover" />
            </div>
            {mission.footer && <div className="pt-4 border-t border-emerald-800/40 text-xs text-emerald-300/80 font-mono">{mission.footer}</div>}
          </div>}
        </div>
      </section>}

      {/* 3. Core Values Section */}
      {displayedValues.length > 0 && <section id="core-values" className="scroll-mt-28 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
            Organizational Foundations
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
            {aboutPage?.coreValuesTitle ?? 'Core values'}
          </h2>
          {aboutPage?.coreValuesDescription && <p className="text-sm text-slate-600">{aboutPage.coreValuesDescription}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedValues.map((v) => (
            <div
              key={v.num}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-cyan-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    {v.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {v.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {v.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>}

      {/* 4. Our Team Section */}
      {displayedTeam.length > 0 && <section id="our-team" className="scroll-mt-28 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            {aboutPage?.teamEyebrow ?? 'Executive Leadership & Stewards'}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
            {aboutPage?.teamTitle ?? 'Our Team'}
          </h2>
          <p className="text-sm text-slate-600">
            {aboutPage?.teamDescription ?? "Passionate innovators, researchers, and ecosystem builders leading SiHub's mission across Somalia."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedTeam.map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              <CmsMedia src={member.image ?? ''} kind={member.imageType ?? 'image'} alt={member.imageAlt ?? member.name ?? ''} caption={member.imageCaption ?? undefined} className="h-48 w-full object-cover" />
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {member.name}
                  </h3>
                  <div className="text-[11px] font-semibold text-cyan-700">
                    {member.role}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {member.location}
                  </div>
                  <p className="text-xs text-slate-600 pt-2 leading-relaxed">
                    {member.bio}
                  </p>
                  <CmsMedia src={member.video} kind="video" alt={member.videoAlt ?? `${member.name ?? 'Team member'} video`} className="mt-3 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>}

      {(aboutPage?.additionalSections ?? []).map((section, index) => <section key={`${section.title ?? 'about-section'}-${index}`} className="scroll-mt-28 space-y-5">
        {section.title && <h2 className="text-2xl font-extrabold text-slate-900 font-heading">{section.title}</h2>}
        {section.body && <p className="max-w-4xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{section.body}</p>}
        <CmsMedia src={section.image} kind="image" alt={section.imageAlt ?? section.title ?? ''} caption={section.imageCaption ?? undefined} className="max-h-96 w-full rounded-2xl object-cover" />
        <CmsMedia src={section.video} kind="video" alt={section.videoAlt ?? section.title ?? ''} caption={section.videoCaption ?? undefined} className="max-h-96 w-full rounded-2xl object-cover" />
      </section>)}

      {/* Action Banner */}
      <section className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <CmsMedia src={banner?.image} kind={banner?.imageType ?? 'image'} alt={banner?.imageAlt ?? ''} caption={banner?.imageCaption ?? undefined} className="max-h-48 w-full rounded-xl object-cover sm:max-w-xs" />
        <CmsMedia src={banner?.video} kind="video" alt={banner?.videoAlt ?? ''} caption={banner?.videoCaption ?? undefined} className="max-h-48 w-full rounded-xl object-cover sm:max-w-xs" />
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold font-heading">
            {banner?.title ?? 'Join the Somali Innovation Ecosystem'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {banner?.description ?? 'Whether you are an aspiring student, a grassroots founder, or a prospective global partner, SiHub has a pathway for you.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => navigateTo('programs')}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <span>{banner?.exploreAction ?? 'Explore Programmes'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('partnerships')}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
          >
            {banner?.partnerAction ?? 'Partner With Us'}
          </button>
        </div>
      </section>
      <DynamicCmsSections pageSlug="about" placement="bottom" previewSections={previewContent?.sections} />
    </div>
  );
};

