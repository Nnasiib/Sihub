/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Templates Management Area
 * 6 production-grade full-page templates ready to apply or instantiate.
 */

import React, { useState } from 'react';
import { CmsPageSection, CmsSectionLayout } from '../../../types/cmsBlocks';
import {
  Sparkles,
  LayoutTemplate,
  Rocket,
  GraduationCap,
  Leaf,
  FileCode,
  CheckCircle2,
  Plus,
  ArrowRight,
  Eye,
  Sliders,
  Layers
} from 'lucide-react';

export interface PageTemplate {
  id: string;
  name: string;
  category: 'Academics' | 'Venture' | 'Events' | 'Climate' | 'Policy' | 'Hardware';
  description: string;
  thumbnail: string;
  sectionsCount: number;
  sections: CmsPageSection[];
}

interface TemplatesAreaProps {
  onApplyTemplateToPage: (template: PageTemplate) => void;
  onCreatePageFromTemplate: (template: PageTemplate, suggestedSlug: string, suggestedTitle: string) => void;
}

const defaultLayout: CmsSectionLayout = {
  desktopColumns: 2,
  tabletColumns: 2,
  mobileColumns: 1,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  spacing: 'normal'
};

const fullWidthLayout: CmsSectionLayout = {
  desktopColumns: 1,
  tabletColumns: 1,
  mobileColumns: 1,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  spacing: 'normal'
};

const statsLayout: CmsSectionLayout = {
  desktopColumns: 4,
  tabletColumns: 2,
  mobileColumns: 1,
  backgroundColor: '#f8fafc',
  textColor: '#0f172a',
  spacing: 'normal'
};

const threeColLayout: CmsSectionLayout = {
  desktopColumns: 3,
  tabletColumns: 2,
  mobileColumns: 1,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  spacing: 'normal'
};

export const PRODUCTION_TEMPLATES: PageTemplate[] = [
  {
    id: 'tpl_academic_portal',
    name: 'Academic & Training Academy Portal',
    category: 'Academics',
    description: 'Structured layout for educational programs, curriculum tracks, faculty mentors, and student enrollment CTAs.',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 4,
    sections: [
      {
        id: 'sec_acad_hero',
        name: 'Academy Hero Header',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'blk_acad_h1',
            type: 'heading',
            text: 'Master Modern Software, Cloud & AI Engineering',
            level: 2,
            alignment: 'center'
          },
          {
            id: 'blk_acad_sub',
            type: 'paragraph',
            text: '12-week intensive cohort programs designed with top African tech employers and global standards.',
            alignment: 'center'
          },
          {
            id: 'blk_acad_btn',
            type: 'button',
            label: 'View All Academy Cohorts',
            url: '/courses',
            alignment: 'center',
            variant: 'primary'
          }
        ]
      },
      {
        id: 'sec_acad_stats',
        name: 'Graduate Impact Metrics',
        placement: 'top',
        order: 2,
        visible: true,
        archived: false,
        layout: statsLayout,
        blocks: [
          { id: 'st1', type: 'stat', value: '3,200+', label: 'Certified Graduates', description: 'Across all cohort tracks' },
          { id: 'st2', type: 'stat', value: '88%', label: 'Employment Rate', description: 'Within 6 months of graduation' },
          { id: 'st3', type: 'stat', value: '45+', label: 'Hiring Partners', description: 'Telecoms, banks & tech ventures' },
          { id: 'st4', type: 'stat', value: '100%', label: 'Hands-on Projects', description: 'Production-ready portfolios' }
        ]
      },
      {
        id: 'sec_acad_features',
        name: 'Core Learning Tracks',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: threeColLayout,
        blocks: [
          { id: 'c1', type: 'card', title: 'Full-Stack Web Engineering', description: 'React 19, TypeScript, Node.js and scalable cloud deployment.', badge: 'Software' },
          { id: 'c2', type: 'card', title: 'Renewable IoT & Embedded Systems', description: 'Microgrid telemetry, solar sensing and LoRaWAN networking.', badge: 'Hardware' },
          { id: 'c3', type: 'card', title: 'Data Analytics & Practical AI', description: 'Predictive modeling, automated data pipelines and Gemini integration.', badge: 'AI & Data' }
        ]
      },
      {
        id: 'sec_acad_cta',
        name: 'Admissions Call to Action',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'cta_cd',
            type: 'card',
            title: 'Applications Now Open for Next Cohort',
            description: 'Scholarships available for eligible female tech founders and regional students. Apply before registration closes.',
            buttonLabel: 'Submit Admission Application',
            url: '/courses',
            badge: 'Scholarship Cohort'
          }
        ]
      }
    ]
  },
  {
    id: 'tpl_venture_showcase',
    name: 'Startup Incubation & Investor Showcase',
    category: 'Venture',
    description: 'High-impact venture showcase presenting accelerator portfolios, seed fund metrics, and investor syndicate access.',
    thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 4,
    sections: [
      {
        id: 'sec_vent_hero',
        name: 'Venture Hero',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          { id: 'vh1', type: 'heading', text: 'Backing the Next Generation of Somali Unicorns', level: 2, alignment: 'left' },
          { id: 'vh2', type: 'paragraph', text: 'We provide pre-seed checks, diaspora syndicate co-investment, and institutional venture readiness.', alignment: 'left' },
          { id: 'vh3', type: 'button', label: 'Pitch Your Venture', url: '/programs', variant: 'primary', alignment: 'left' }
        ]
      },
      {
        id: 'sec_vent_split',
        name: 'Incubation Journey',
        placement: 'top',
        order: 2,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'v_sp',
            type: 'textImage',
            heading: 'Hands-on Venture Building in Mogadishu',
            text: 'Our 6-month residency provides dedicated desks, AWS/GCP credits, legal incorporation support, and direct pitch sessions with diaspora funds in London, Minneapolis, and Dubai.',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
            layout: 'imageRight'
          }
        ]
      },
      {
        id: 'sec_vent_testimonials',
        name: 'Founder Stories',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: defaultLayout,
        blocks: [
          { id: 't1', type: 'testimonial', quote: 'The mentorship from SiHub partners transformed our fintech prototype into a commercially licensed payment gateway.', author: 'Farhan Rageh', organization: 'HantiPay', role: 'CEO' },
          { id: 't2', type: 'testimonial', quote: 'SiHub opened doors to diaspora angel investors we could never have reached on our own.', author: 'Khadija Shire', organization: 'SolarSomalia', role: 'Founder' }
        ]
      },
      {
        id: 'sec_vent_cta',
        name: 'Investor Syndicate Link',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'v_cta',
            type: 'card',
            title: 'Join the SiHub Diaspora Angel Syndicate',
            description: 'Accredited investors receive quarterly deal flow memos and co-investment rights in top graduating startups.',
            buttonLabel: 'Request Syndicate Prospectus',
            url: '/contact'
          }
        ]
      }
    ]
  },
  {
    id: 'tpl_hackathon_event',
    name: 'National Hackathon & Summit Landing',
    category: 'Events',
    description: 'High-conversion event landing page featuring track announcements, judging criteria, timeline, and registration.',
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 4,
    sections: [
      {
        id: 'sec_hack_hero',
        name: 'Hackathon Hero',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          { id: 'hh1', type: 'heading', text: '48 Hours to Hack the Future of Somali Tech', level: 2, alignment: 'center' },
          { id: 'hh2', type: 'paragraph', text: 'Over $25,000 in non-dilutive prototype prizes across FinTech, Climate Resilience, and Digital Health.', alignment: 'center' },
          { id: 'hh3', type: 'button', label: 'Register Free Team Pass', url: '/events', variant: 'primary', alignment: 'center' }
        ]
      },
      {
        id: 'sec_hack_tracks',
        name: 'Competition Tracks',
        placement: 'top',
        order: 2,
        visible: true,
        archived: false,
        layout: threeColLayout,
        blocks: [
          { id: 'ht1', type: 'card', title: 'Track 1: Digital Remittance & FinTech', description: 'Build modern open APIs for micropayments, diaspora remittance tracking and micro-takaful.', badge: '$10k Prize' },
          { id: 'ht2', type: 'card', title: 'Track 2: Climate & Agritech Telemetry', description: 'IoT sensors for boreholes, pasture monitoring and flood warning systems in river basins.', badge: '$10k Prize' },
          { id: 'ht3', type: 'card', title: 'Track 3: AI & Public Service Access', description: 'Somali-language voice AI and automated document processing for local municipal administration.', badge: '$5k Prize' }
        ]
      },
      {
        id: 'sec_hack_time',
        name: 'Event Schedule',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: threeColLayout,
        blocks: [
          { id: 'sch1', type: 'card', title: 'Day 1: Team Formation & Keynote', description: 'Opening ceremony by Ministry of Tech, mentor pitch sessions, and workspace allocation.', badge: 'Friday' },
          { id: 'sch2', type: 'card', title: 'Day 2: 24-Hour Sprint & Mentorship', description: 'Hardware lab access, cloud credits, and midnight technical reviews.', badge: 'Saturday' },
          { id: 'sch3', type: 'card', title: 'Day 3: Pitch Stage & Grand Awards', description: 'Top 10 finalists present live on stage to institutional judges and diaspora angel funds.', badge: 'Sunday' }
        ]
      },
      {
        id: 'sec_hack_faq',
        name: 'Hackathon FAQ',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: defaultLayout,
        blocks: [
          { id: 'faq1', type: 'card', title: 'Can solo developers join without a team?', description: 'Yes! We host an interactive team matching sprint on Friday morning before kickoff.' },
          { id: 'faq2', type: 'card', title: 'Who owns the intellectual property?', description: 'Participating developers and founders retain 100% ownership of everything they create.' }
        ]
      }
    ]
  },
  {
    id: 'tpl_clean_energy',
    name: 'Climate-Tech & Renewable Energy Hub',
    category: 'Climate',
    description: 'Showcases solar microgrid testbeds, agritech pilot projects, and green technological innovation across Somalia.',
    thumbnail: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 3,
    sections: [
      {
        id: 'sec_clim_hero',
        name: 'Climate Tech Hero',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          { id: 'cl_h', type: 'heading', text: 'Engineering Renewable Resiliency for the Horn', level: 2, alignment: 'left' },
          { id: 'cl_p', type: 'paragraph', text: 'Piloting decentralized solar grids, water desalinization telemetry, and climate-smart agriculture.', alignment: 'left' },
          { id: 'cl_b', type: 'button', label: 'Explore Research Pilots', url: '/news', variant: 'primary', alignment: 'left' }
        ]
      },
      {
        id: 'sec_clim_stats',
        name: 'Energy Lab Impact',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: statsLayout,
        blocks: [
          { id: 'cst1', type: 'stat', value: '14 kW', label: 'Solar Lab Capacity', description: 'Rooftop test array' },
          { id: 'cst2', type: 'stat', value: '8', label: 'Borehole Monitors', description: 'Rural telemetry links' },
          { id: 'cst3', type: 'stat', value: '120k L', label: 'Water Purified Daily', description: 'Solar osmosis pilot' },
          { id: 'cst4', type: 'stat', value: '6', label: 'Agritech Startups', description: 'Funded & accelerated' }
        ]
      },
      {
        id: 'sec_clim_contact',
        name: 'Research Partnership Contact',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'c_cnt',
            type: 'contactInfo',
            title: 'SiHub Clean Energy Lab',
            address: 'Mogadishu Campus, Energy Testing Facility Wing B',
            email: 'climate@sihub.so',
            phone: '+252 61 500 0011',
            hours: 'Mon - Thu: 9:00 AM - 5:00 PM EAT'
          }
        ]
      }
    ]
  },
  {
    id: 'tpl_policy_publications',
    name: 'Executive Policy & Research Publications',
    category: 'Policy',
    description: 'Ideal for publishing institutional whitepapers, national ICT policy papers, and annual ecosystem reports.',
    thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 3,
    sections: [
      {
        id: 'sec_pol_hero',
        name: 'Policy Header',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          { id: 'ph1', type: 'heading', text: 'Data-Driven Insights for the Somali Digital Economy', level: 2, alignment: 'center' },
          { id: 'ph2', type: 'paragraph', text: 'Authoritative research papers, regulatory frameworks, and market reports published in partnership with international development organizations.', alignment: 'center' }
        ]
      },
      {
        id: 'sec_pol_quote',
        name: 'Director Statement',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'pq1',
            type: 'quote',
            text: 'Transparent data and forward-looking digital policy are the bedrock required to attract institutional global capital into our young entrepreneurs.',
            author: 'Executive Leadership Board',
            title: 'Somali Innovation Hub'
          }
        ]
      },
      {
        id: 'sec_pol_cta',
        name: 'Research Dispatch Subscription',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'pcta',
            type: 'card',
            title: 'Subscribe to Quarterly Policy Briefings',
            description: 'Receive executive summaries of regulatory changes, fiber optic connectivity indexes, and startup funding benchmarks.',
            buttonLabel: 'Subscribe via Email',
            url: '/contact'
          }
        ]
      }
    ]
  },
  {
    id: 'tpl_makerspace_workshop',
    name: 'MakerSpace & Prototyping Workshop',
    category: 'Hardware',
    description: 'Hardware lab details, 3D printing equipment, tool reservations, and student workshop orientation.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    sectionsCount: 3,
    sections: [
      {
        id: 'sec_make_hero',
        name: 'MakerSpace Hero',
        placement: 'top',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          { id: 'mh1', type: 'heading', text: 'Turn Physical Concepts into Verified Hardware', level: 2, alignment: 'left' },
          { id: 'mh2', type: 'paragraph', text: 'Industrial 3D printers, laser cutters, oscilloscope stations, and electronics fabrication equipment open to members.', alignment: 'left' },
          { id: 'mh3', type: 'button', label: 'Book Induction Tour', url: '/contact', variant: 'primary', alignment: 'left' }
        ]
      },
      {
        id: 'sec_make_gallery',
        name: 'Equipment Gallery',
        placement: 'bottom',
        order: 1,
        visible: true,
        archived: false,
        layout: fullWidthLayout,
        blocks: [
          {
            id: 'mg1',
            type: 'gallery',
            items: [
              { src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', alt: '3D Printing Farm' },
              { src: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', alt: 'Soldering & PCB Station' },
              { src: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80', alt: 'CNC Precision Routing' }
            ]
          }
        ]
      },
      {
        id: 'sec_make_faq',
        name: 'Workshop Safety & Access FAQ',
        placement: 'bottom',
        order: 2,
        visible: true,
        archived: false,
        layout: defaultLayout,
        blocks: [
          { id: 'mf1', type: 'card', title: 'Is training required before using machinery?', description: 'Yes. All members must complete the 2-hour lab safety and equipment certification module.' },
          { id: 'mf2', type: 'card', title: 'Are raw materials provided?', description: 'Filament and standard electronics components are subsidized and available in the inventory store.' }
        ]
      }
    ]
  }
];

export const TemplatesArea: React.FC<TemplatesAreaProps> = ({
  onApplyTemplateToPage,
  onCreatePageFromTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalTemplate, setActiveModalTemplate] = useState<PageTemplate | null>(null);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const categories = ['All', 'Academics', 'Venture', 'Events', 'Climate', 'Policy', 'Hardware'];

  const filteredTemplates = PRODUCTION_TEMPLATES.filter(
    t => selectedCategory === 'All' || t.category === selectedCategory
  );

  const handleOpenCreateModal = (tpl: PageTemplate) => {
    setActiveModalTemplate(tpl);
    const slugSuggestion = tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setNewPageSlug(slugSuggestion);
    setNewPageTitle(tpl.name);
  };

  const handleConfirmCreate = () => {
    if (!activeModalTemplate || !newPageSlug.trim()) return;
    onCreatePageFromTemplate(activeModalTemplate, newPageSlug.trim(), newPageTitle.trim() || activeModalTemplate.name);
    setActiveModalTemplate(null);
  };

  const handleApply = (tpl: PageTemplate) => {
    onApplyTemplateToPage(tpl);
    setAppliedTemplateId(tpl.id);
    setTimeout(() => setAppliedTemplateId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
            <LayoutTemplate className="w-4 h-4" /> Production Layout Blueprints
          </div>
          <h2 className="text-2xl font-extrabold font-heading">Turnkey Page Templates</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Deploy complete multi-section page structures in one click. Perfect for launching new academy cohorts, hackathons, investor syndicates, and research initiatives.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(tpl => {
          const isApplied = appliedTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={tpl.thumbnail}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-cyan-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {tpl.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-600" /> {tpl.sectionsCount} Sections
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">{tpl.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{tpl.description}</p>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                    <span className="font-semibold text-slate-700">Included Structure:</span>
                    <ul className="list-disc list-inside text-[10px] text-slate-500">
                      {tpl.sections.map(s => (
                        <li key={s.id} className="truncate">{s.name} ({s.placement})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleApply(tpl)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                  title="Appends all template sections into the currently open page"
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Applied!
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5 text-cyan-600" /> Apply to Current Page
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(tpl)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> New Page &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Page From Template Modal */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center gap-2 text-cyan-600 text-xs font-mono uppercase font-bold mb-1">
                <Sparkles className="w-4 h-4" /> Instantiate Template
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                Create Page from {activeModalTemplate.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Creates a new institutional page in your draft CMS repository populated with all {activeModalTemplate.sectionsCount} pre-configured sections.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  placeholder="e.g., Spring 2026 Innovation Summit"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page URL Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    /pages/
                  </span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 px-3 py-2 rounded-r-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="summit-2026"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModalTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!newPageSlug.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Create Page & Open Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
