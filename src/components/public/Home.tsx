/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Institutional Home Page
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Course, ImpactMetrics, Partner, Program, SiHubEvent, Startup } from '../../types';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { CmsMedia } from '../common/CmsMedia';
import { DynamicCmsSections } from './DynamicCmsSections';
import {
  Sparkles,
  Rocket,
  GraduationCap,
  Users,
  Calendar,
  Award,
  ChevronRight,
  Sun,
  Sprout,
  HeartPulse,
  Code2,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  MapPin
} from 'lucide-react';

type HomePageContent = {
  heroEyebrow?: string;
  heroHeading?: string;
  heroDescription?: string;
  heroImage?: string | null;
  heroImageType?: 'image' | 'video';
  heroImageAlt?: string;
  heroImageCaption?: string;
  heroVideo?: string | null;
  heroVideoAlt?: string;
  heroVideoCaption?: string;
  exploreProgramsAction?: string;
  browseCoursesAction?: string;
  pitchStartupAction?: string;
  trustBadges?: string[];
  impactTitle?: string;
  impactRegion?: string;
  impactDisclaimer?: string;
  impactLabels?: string[];
  eventEyebrow?: string;
  eventAction?: string;
  sectorsEyebrow?: string;
  sectorsTitle?: string;
  sectorsDescription?: string;
  sectors?: { title?: string; description?: string }[];
  programsEyebrow?: string;
  programsTitle?: string;
  programsAction?: string;
  programCardAction?: string;
  startupsEyebrow?: string;
  startupsTitle?: string;
  startupsAction?: string;
  coursesEyebrow?: string;
  coursesTitle?: string;
  coursesDescription?: string;
  coursesAction?: string;
  partnersTitle?: string;
};

const defaultStartups: Startup[] = [
  {
    id: 'st-agripump',
    name: 'Somali AgriPump Tech',
    tagline: 'Solar-powered smart irrigation systems for riverine farms',
    sector: 'AgriTech',
    founderName: 'Warsame Abdi',
    founderEmail: 'warsame@agripump.so',
    founderPhone: '+252 61 555 1234',
    teamSize: 6,
    stage: 'Incubation',
    description: 'Affordable IoT-enabled solar water pumps cutting diesel costs by 80% for smallholder farmers in Lower Shabelle.',
    problemStatement: 'High fuel costs and erratic droughts limit crop yields.',
    solution: 'Modular solar-driven submersible pumps with automated soil sensors.',
    fundingRaised: '$45,000',
    location: 'Mogadishu & Jowhar',
    status: 'active',
    appliedDate: '2025-01-15'
  },
  {
    id: 'st-daryeel',
    name: 'Daryeel Mobile Health',
    tagline: 'Telemedicine and medicine dispatch for remote districts',
    sector: 'HealthTech',
    founderName: 'Dr. Aisha Mohamed',
    founderEmail: 'aisha@daryeelhealth.so',
    founderPhone: '+252 63 444 8921',
    teamSize: 8,
    stage: 'Prototype',
    description: 'Bilingual mobile consultation triage linking specialist doctors to rural maternal clinics.',
    problemStatement: 'Shortage of specialized healthcare outside primary regional capitals.',
    solution: 'Low-bandwidth tele-triage app with offline record sync.',
    fundingRaised: '$25,000',
    location: 'Hargeisa & Burao',
    status: 'active',
    appliedDate: '2025-02-10'
  },
  {
    id: 'st-barocloud',
    name: 'BaroCloud EdTech',
    tagline: 'Interactive STEM and coding learning kits for Somali schools',
    sector: 'EdTech',
    founderName: 'Farhan Hassan',
    founderEmail: 'farhan@barocloud.so',
    founderPhone: '+252 90 777 3412',
    teamSize: 5,
    stage: 'Acceleration',
    description: 'Hardware-free virtual laboratory simulations and digital curricula for secondary schools.',
    problemStatement: 'Inadequate physical lab infrastructure in secondary education.',
    solution: 'Gamified digital STEM simulation engine usable on basic tablets.',
    fundingRaised: '$60,000',
    location: 'Garowe & Kismayo',
    status: 'active',
    appliedDate: '2025-03-01'
  }
];

const defaultPrograms: Program[] = [
  {
    id: 'prog-incubator',
    title: 'SiHub Flagship Tech Incubator',
    category: 'Incubation',
    summary: 'A 16-week intensive venture acceleration track offering prototyping grants, mentorship, and investor demo days.',
    objectives: [
      'De-risk early-stage product prototypes',
      'Provide up to $10,000 milestone seed grants',
      'Connect ventures with diaspora and regional angels'
    ],
    targetAudience: 'Early-stage tech and tech-enabled Somali founders',
    duration: '16 Weeks',
    eligibility: ['Somali resident or diaspora team', 'Working prototype or proof of concept'],
    cohortSize: 25,
    status: 'Open',
    deadline: '2026-12-15',
    coordinator: 'Innovation Director Liban',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Tech Incubator participants collaborating',
    thumbnailUrlType: 'image'
  },
  {
    id: 'prog-women-in-tech',
    title: 'Women in Digital Innovation Fellowship',
    category: 'Women in Innovation',
    summary: 'Empowering female technologists and entrepreneurs through hands-on software development, product management, and leadership residencies.',
    objectives: [
      'Upskill 40 female engineers in modern web and mobile stacks',
      'Launch 10 women-led social ventures',
      'Establish bilateral mentorship with global tech executives'
    ],
    targetAudience: 'Female tech graduates, aspiring developers, and founders',
    duration: '12 Weeks',
    eligibility: ['Female applicants residing across Somali federal member states'],
    cohortSize: 30,
    status: 'Open',
    deadline: '2026-11-30',
    coordinator: 'Faduma Warsame',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Women in tech fellowship cohort',
    thumbnailUrlType: 'image'
  },
  {
    id: 'prog-green-climate',
    title: 'Green Innovation & Climate Resilience Lab',
    category: 'Seed Grant',
    summary: 'Supporting technological breakthroughs in solar energy, drought-resistant agriculture, and plastic circular economy.',
    objectives: [
      'Pilot 5 scalable climate adaptation technologies in arid regions',
      'Equip agri-entrepreneurs with IoT water management sensors'
    ],
    targetAudience: 'Clean energy innovators, agricultural engineers, and eco-enterprises',
    duration: '20 Weeks',
    eligibility: ['Clear environmental impact thesis and field testing pilot capability'],
    cohortSize: 20,
    status: 'Upcoming',
    deadline: '2027-01-20',
    coordinator: 'Dr. Hassan Shire',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Solar and clean energy project',
    thumbnailUrlType: 'image'
  }
];

const defaultCourses: Course[] = [
  {
    id: 'crs-fullstack',
    title: 'Modern Full-Stack Web Architecture',
    code: 'CS-301',
    category: 'Technology & Software',
    description: 'Learn React, Node.js, TypeScript, PostgreSQL, and scalable cloud deployments built for real-world production systems.',
    instructorId: 'inst-1',
    instructorName: 'Eng. Liban Jama',
    instructorTitle: 'Principal Software Architect',
    durationWeeks: 10,
    hoursPerWeek: 8,
    level: 'Intermediate',
    deliveryMode: 'Hybrid',
    capacity: 40,
    enrolledCount: 28,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Full stack development code on screen',
    thumbnailUrlType: 'image',
    prerequisites: ['Basic JavaScript or Python knowledge'],
    learningOutcomes: ['Full-stack CRUD apps', 'REST APIs & databases', 'Production CI/CD'],
    isPublished: true,
    createdAt: '2025-01-01',
    modules: []
  },
  {
    id: 'crs-agritech',
    title: 'AgriTech IoT & Smart Irrigation',
    code: 'AG-201',
    category: 'AgriTech & Food Security',
    description: 'Deploying low-power microcontrollers and soil moisture sensors to automate irrigation in drought-prone conditions.',
    instructorId: 'inst-2',
    instructorName: 'Fatima Dahir',
    instructorTitle: 'Senior Agricultural Systems Engineer',
    durationWeeks: 8,
    hoursPerWeek: 6,
    level: 'Beginner',
    deliveryMode: 'In-Person',
    capacity: 35,
    enrolledCount: 22,
    thumbnailUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Smart agriculture sensor setup',
    thumbnailUrlType: 'image',
    prerequisites: ['Secondary school science or farming background'],
    learningOutcomes: ['Microcontroller wiring', 'Solar pump automation', 'Telemetry dashboards'],
    isPublished: true,
    createdAt: '2025-01-10',
    modules: []
  },
  {
    id: 'crs-renewable',
    title: 'Renewable Solar Engineering & Micro-Grids',
    code: 'EE-205',
    category: 'Renewable Energy & Climate',
    description: 'Design, sizing, inverter configuration, and preventive maintenance for commercial and community solar installations.',
    instructorId: 'inst-3',
    instructorName: 'Hassan Nur',
    instructorTitle: 'Clean Energy Grid Consultant',
    durationWeeks: 6,
    hoursPerWeek: 6,
    level: 'Intermediate',
    deliveryMode: 'Hybrid',
    capacity: 30,
    enrolledCount: 19,
    thumbnailUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    thumbnailAlt: 'Solar array engineering installation',
    thumbnailUrlType: 'image',
    prerequisites: ['Basic electrical principles'],
    learningOutcomes: ['Photovoltaic system design', 'Battery storage safety', 'Grid tie-ins'],
    isPublished: true,
    createdAt: '2025-01-15',
    modules: []
  }
];

const defaultEvents: SiHubEvent[] = [
  {
    id: 'evt-summit-2026',
    title: 'SiHub National Tech & Innovation Summit 2026',
    category: 'Conference',
    date: 'November 24, 2026',
    time: '09:00 AM - 05:00 PM EAT',
    locationType: 'Hybrid',
    venue: 'SiHub Main Auditorium, Mogadishu & Online Live Stream',
    description: 'Annual gathering of innovators, policymakers, diaspora investors, and researchers presenting breakthroughs in Somali tech.',
    capacity: 500,
    registeredCount: 312,
    speaker: 'Minister of Communications & Keynote Panelists',
    isUpcoming: true
  }
];

const defaultPartners: Partner[] = [
  {
    id: 'pt-undp',
    name: 'UNDP Somalia',
    type: 'Development Agency',
    country: 'International',
    collaborativePrograms: ['Youth Innovation', 'Climate Adaptation'],
    mouStatus: 'Active',
    contactPerson: 'Country Director',
    joinedYear: 2022
  },
  {
    id: 'pt-moct',
    name: 'Ministry of Communications & Tech',
    type: 'Institutional',
    country: 'Somalia',
    collaborativePrograms: ['National Digital Strategy', 'Broadband Access'],
    mouStatus: 'Active',
    contactPerson: 'Director General',
    joinedYear: 2021
  },
  {
    id: 'pt-chamber',
    name: 'Somali Chamber of Commerce & Industry',
    type: 'Corporate Sponsor',
    country: 'Somalia',
    collaborativePrograms: ['Startup Incubation', 'Commercial Trade'],
    mouStatus: 'Active',
    contactPerson: 'Trade Secretary',
    joinedYear: 2023
  },
  {
    id: 'pt-worldbank',
    name: 'World Bank Digital Development',
    type: 'Development Agency',
    country: 'International',
    collaborativePrograms: ['Skills Transformation', 'Digital Economy'],
    mouStatus: 'Active',
    contactPerson: 'Program Lead',
    joinedYear: 2023
  }
];

export const Home: React.FC = () => {
  const {
    navigateTo,
    setSelectedCourseForApply,
    setSelectedEventForRegister,
    setIsStartupModalOpen,
    language,
    t
  } = useApp();

  const { page: cmsPage } = useCmsPage<HomePageContent>('home');
  const { courses } = useCourseCatalog();
  const { items: startups } = useCmsCollection<Startup>('startup');
  const { items: programs } = useCmsCollection<Program>('program');
  const { items: events } = useCmsCollection<SiHubEvent>('event');
  const { items: partners } = useCmsCollection<Partner>('partner');
  const { items: impactEntries } = useCmsCollection<ImpactMetrics>('impact');

  const safeStartups = Array.isArray(startups) && startups.length > 0 ? startups : defaultStartups;
  const safeCourses = Array.isArray(courses) && courses.length > 0 ? courses : defaultCourses;
  const safePrograms = Array.isArray(programs) && programs.length > 0 ? programs : defaultPrograms;
  const safeEvents = Array.isArray(events) && events.length > 0 ? events : defaultEvents;
  const safePartners = Array.isArray(partners) && partners.length > 0 ? partners : defaultPartners;

  const impact: ImpactMetrics = (impactEntries && impactEntries[0]) ? impactEntries[0] : {
    totalBeneficiaries: 14200,
    learnersTrained: 5600,
    coursesDelivered: 48,
    startupsSupported: 124,
    jobsCreatedDirectly: 850,
    grantsDisbursedUSD: 450000,
    womenParticipationRate: 46,
    innovationProjectsCompleted: 38,
    partnerOrganizations: 26
  };

  const sectorIcons = [
    <Sprout key="sprout" className="w-6 h-6 text-emerald-500" />,
    <Sun key="sun" className="w-6 h-6 text-amber-500" />,
    <HeartPulse key="heart" className="w-6 h-6 text-rose-500" />,
    <Code2 key="code" className="w-6 h-6 text-cyan-500" />
  ];
  const sectors = (cmsPage?.sectors ?? []).filter(sector => sector.title && sector.description).map((sector, index) => ({
    ...sector,
    icon: sectorIcons[index % sectorIcons.length]
  }));
  const trustBadges = cmsPage?.trustBadges ?? [];
  const impactLabels = cmsPage?.impactLabels ?? ['Beneficiaries Reached', 'Startups Accelerated', 'Grant Capital Awarded', 'Women in Tech Ratio'];

  return (
    <div className="space-y-20 pb-20">
      <DynamicCmsSections pageSlug="home" placement="top" />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {cmsPage?.heroVideo
          ? <CmsMedia src={cmsPage.heroVideo} kind="video" alt={cmsPage.heroVideoAlt} caption={cmsPage.heroVideoCaption} className="absolute inset-0 h-full w-full object-cover opacity-30" autoPlay />
          : <CmsMedia src={cmsPage?.heroImage} kind={cmsPage?.heroImageType ?? 'image'} alt={cmsPage?.heroImageAlt} caption={cmsPage?.heroImageCaption} className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500 blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {cmsPage?.heroEyebrow ?? (language === 'so' ? 'Xarunta Hal-abuurka Soomaaliyeed' : 'National Digital Innovation Ecosystem')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight">
                <span className="whitespace-pre-line">{cmsPage?.heroHeading ?? 'Connecting People.\nEmpowering Ideas.\nCreating Opportunities.'}</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {cmsPage?.heroDescription ?? 'SiHub is Somalia’s institutional innovation engine—supporting entrepreneurs, university graduates, rural farmers, and youth across technology, clean energy, agriculture, and healthcare.'}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigateTo('programs')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  {cmsPage?.exploreProgramsAction ?? t.actions.explorePrograms}
                </button>

                <button
                  onClick={() => navigateTo('courses')}
                  className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  {cmsPage?.browseCoursesAction ?? t.actions.browseCourses}
                </button>

                <button
                  onClick={() => setIsStartupModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  {cmsPage?.pitchStartupAction ?? (language === 'so' ? 'Gudbi Fikradda' : 'Pitch a Startup')}
                </button>
              </div>

              {/* Quick Trust Badges */}
              {trustBadges.length > 0 && <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                {trustBadges.map((badge, index) => <div key={badge} className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${['text-emerald-400', 'text-cyan-400', 'text-amber-400'][index % 3]}`} />
                  <span>{badge}</span>
                </div>)}
              </div>}
            </div>

            {/* Right: Live Interactive Ecosystem Card */}
            <div className="lg:col-span-5" id="our-impact">
              <div className="rounded-3xl bg-slate-800/90 border border-slate-700 p-6 shadow-2xl backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> {cmsPage?.impactTitle ?? 'Live Ecosystem Impact'}
                  </span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 font-mono">
                    {cmsPage?.impactRegion ?? 'All Regions'}
                  </span>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900 font-medium">
                  {cmsPage?.impactDisclaimer ?? 'Our impact reflects our commitment to innovation, entrepreneurship, skills development, and community growth.'}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-heading">
                      {(impact.totalBeneficiaries / 1000).toFixed(0)}k+
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">{impactLabels[0]}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-heading">
                      {impact.startupsSupported}
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">{impactLabels[1]}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-heading">
                      ${(impact.grantsDisbursedUSD / 1000).toFixed(0)}k
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">{impactLabels[2]}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                    <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-heading">
                      {impact.womenParticipationRate}%
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">{impactLabels[3]}</span>
                  </div>
                </div>

                {/* Highlighted Upcoming Event Mini-Banner */}
                {safeEvents.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-800/50 space-y-2">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {cmsPage?.eventEyebrow ?? 'Next Major Milestone'}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">{safeEvents[0].title}</h4>
                    <p className="text-[11px] text-slate-300">
                      {safeEvents[0].date} • {safeEvents[0].venue}
                    </p>
                    <button
                      onClick={() => setSelectedEventForRegister(safeEvents[0])}
                      className="mt-1 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      {cmsPage?.eventAction ?? 'Register for this event'} &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Sector Innovation Focus (Crucial: Not just IT!) */}
      {sectors.length > 0 && <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">
            {cmsPage?.sectorsEyebrow ?? 'Cross-Sector Innovation'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            {cmsPage?.sectorsTitle ?? 'More Than Just Technology'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {cmsPage?.sectorsDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((sector, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="p-3 w-fit rounded-xl bg-slate-50 border border-slate-100">
                {sector.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{sector.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{sector.description}</p>
              <button
                onClick={() => navigateTo('innovation')}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 pt-2"
              >
                Explore Lab Tracks <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>}

      {/* Featured Cohort Programs */}
      <section className="bg-slate-100/70 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                {cmsPage?.programsEyebrow ?? 'Active Cohorts & Residencies'}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 font-heading mt-1">
                {cmsPage?.programsTitle ?? 'Featured Programs'}
              </h2>
            </div>
            <button
              onClick={() => navigateTo('programs')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 self-start md:self-auto"
            >
              {cmsPage?.programsAction ?? 'View All Programs'} &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {safePrograms.slice(0, 3).map(prog => (
              <div
                key={prog.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <CmsMedia src={prog.thumbnailUrl} kind={prog.thumbnailUrlType ?? 'image'} alt={prog.thumbnailAlt ?? prog.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                    <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {prog.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{prog.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{prog.summary}</p>

                    <div className="pt-2 text-xs text-slate-500 space-y-1">
                      <div>Duration: <strong className="text-slate-800">{prog.duration}</strong></div>
                      <div>Cohort Size: <strong className="text-slate-800">{prog.cohortSize} Startups/Participants</strong></div>
                      <div>Deadline: <strong className="text-rose-600">{prog.deadline}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigateTo('programs')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    {cmsPage?.programCardAction ?? 'Program Details & Apply'} &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Startups Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">
              {cmsPage?.startupsEyebrow ?? 'Venture Portfolio'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading mt-1">
              {cmsPage?.startupsTitle ?? 'Startups Driving Somali Transformation'}
            </h2>
          </div>
          <button
            onClick={() => navigateTo('startups')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 self-start md:self-auto"
          >
            {cmsPage?.startupsAction ?? 'Explore Startup Directory'} &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {safeStartups.slice(0, 3).map(st => (
            <div
              key={st.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    {st.sector}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {st.stage}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{st.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{st.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Founder:</span>
                  <strong className="text-slate-800">{st.founderName}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Location:</span>
                  <strong className="text-slate-800">{st.location}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Funding:</span>
                  <strong className="text-emerald-600 font-bold">{st.fundingRaised}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses (LMS Preview with Admin Approval Rule Callout) */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                {cmsPage?.coursesEyebrow ?? 'SiHub Academy Online'}
              </span>
              <h2 className="text-3xl font-extrabold text-white font-heading mt-1">
                {cmsPage?.coursesTitle ?? 'Featured Professional Courses'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {cmsPage?.coursesDescription ?? 'Browse published courses. Enrollment requests are reviewed before access is granted.'}
              </p>
            </div>
            <button
              onClick={() => navigateTo('courses')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start md:self-auto"
            >
              {cmsPage?.coursesAction ?? 'Browse Full LMS Catalog'} &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {safeCourses.slice(0, 3).map(course => (
              <div
                key={course.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="relative h-44">
                    <CmsMedia src={course.thumbnailUrl} kind={course.thumbnailUrlType ?? 'image'} alt={course.thumbnailAlt ?? course.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-sm font-bold text-white leading-snug">{course.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{course.description}</p>
                    <div className="text-[11px] text-slate-400">
                      Instructor: <strong className="text-slate-200">{course.instructorName}</strong> • {course.durationWeeks} Weeks
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => setSelectedCourseForApply(course)}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4" /> Apply for Enrollment (Approval Required)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Partnerships Banner */}
      {safePartners.length > 0 && <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {cmsPage?.partnersTitle ?? 'Institutional & Development Partners'}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 py-4 text-slate-600 font-bold text-sm">
          {safePartners.slice(0, 5).map(partner => <div key={partner.id} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            {partner.logoUrl && <CmsMedia src={partner.logoUrl} kind="image" alt="" className="h-8 max-w-24 object-contain" />}
            <span>{partner.name}</span>
          </div>)}
        </div>
      </section>}
      <DynamicCmsSections pageSlug="home" placement="bottom" />
    </div>
  );
};

