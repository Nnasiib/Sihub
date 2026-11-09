/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Section & Content Blocks Catalog Area
 * Complete catalog of all 26 block types and composable section presets.
 */

import React, { useState, useMemo } from 'react';
import { CmsBlockType, CmsContentBlock, CmsPageSection } from '../../../types/cmsBlocks';
import {
  Layout,
  Type,
  Image as ImageIcon,
  Sparkles,
  MousePointerClick,
  HelpCircle,
  BarChart3,
  Users,
  Grid,
  Video,
  FileText,
  Clock,
  Layers,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Code,
  PhoneCall,
  SlidersHorizontal,
  FolderPlus
} from 'lucide-react';

interface SectionBlocksCatalogAreaProps {
  onInsertBlock?: (type: CmsBlockType) => void;
  onInsertSectionPreset?: (section: CmsPageSection) => void;
  onOpenStudio?: () => void;
  selectedPageSlug?: string;
}

interface BlockDefinition {
  type: CmsBlockType | string;
  name: string;
  category: 'Layout' | 'Content' | 'Media' | 'Interactive' | 'Ecosystem';
  description: string;
  icon: React.ReactNode;
  defaultData: Record<string, unknown>;
  previewHint: string;
}

const ALL_BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Layout
  {
    type: 'hero',
    name: 'Hero Banner',
    category: 'Layout',
    description: 'Impactful full-width hero header with eyebrow, title, subtitle, CTA button and optional background/media.',
    icon: <Sparkles className="w-5 h-5 text-cyan-600" />,
    defaultData: {
      eyebrow: 'SOMALI INNOVATION HUB',
      title: 'Empowering East African Innovators',
      subtitle: 'Building sustainable digital solutions, venture capital pathways, and technical talent across the Horn of Africa.',
      buttonText: 'Explore Ecosystem',
      buttonLink: '/programs',
      align: 'center'
    },
    previewHint: 'Full-width visual centerpiece'
  },
  {
    type: 'container',
    name: 'Content Container',
    category: 'Layout',
    description: 'Contained box with custom padding, background color, and responsive margins for grouping elements.',
    icon: <Layout className="w-5 h-5 text-indigo-600" />,
    defaultData: { padding: 'large', background: 'white' },
    previewHint: 'Responsive structured bounding container'
  },
  {
    type: 'columns',
    name: 'Multi-Column Grid',
    category: 'Layout',
    description: '2, 3, or 4 equal-width responsive layout columns that stack automatically on mobile viewports.',
    icon: <Grid className="w-5 h-5 text-blue-600" />,
    defaultData: { count: 3, gap: '6' },
    previewHint: '2 to 4 responsive columns'
  },
  {
    type: 'divider',
    name: 'Visual Divider',
    category: 'Layout',
    description: 'Clean subtle separator line with customizable style, thickness, and vertical padding.',
    icon: <SlidersHorizontal className="w-5 h-5 text-slate-500" />,
    defaultData: { style: 'solid', thickness: 1, spacing: 'medium' },
    previewHint: 'Horizontal boundary line'
  },

  // Content
  {
    type: 'heading',
    name: 'Section Heading',
    category: 'Content',
    description: 'Structured typography heading (H1 to H4) with font weighting, alignment, and accent styling.',
    icon: <Type className="w-5 h-5 text-amber-600" />,
    defaultData: { level: 2, text: 'Strategic Pillars & Hub Milestones', align: 'left' },
    previewHint: 'H1–H4 typography header'
  },
  {
    type: 'paragraph',
    name: 'Body Paragraph',
    category: 'Content',
    description: 'Rich narrative text paragraph with customizable line spacing, typography size, and color tone.',
    icon: <FileText className="w-5 h-5 text-slate-700" />,
    defaultData: { text: 'SiHub provides world-class co-working infrastructure, seed incubation capital, and mentorship to visionary Somali founders.' },
    previewHint: 'Body copy narrative text'
  },
  {
    type: 'richText',
    name: 'Rich Text Block',
    category: 'Content',
    description: 'Formatted multi-paragraph content block supporting bold, italic, bullet lists, and linked references.',
    icon: <FileText className="w-5 h-5 text-emerald-600" />,
    defaultData: { content: '<p>Comprehensive ecosystem programs designed in partnership with national universities and international development agencies.</p>' },
    previewHint: 'Rich HTML-formatted text'
  },
  {
    type: 'quote',
    name: 'Pull Quote / Callout',
    category: 'Content',
    description: 'Prominent quote box with decorative accent border, author attribution, and organization title.',
    icon: <FileText className="w-5 h-5 text-purple-600" />,
    defaultData: { quote: 'Technology and entrepreneurship are the true engines of Somali economic renewal.', author: 'Executive Director', role: 'SiHub Board' },
    previewHint: 'Attributed inspirational quote'
  },
  {
    type: 'textImage',
    name: 'Split Text & Image',
    category: 'Content',
    description: 'Two-column balanced layout featuring narrative text on one side and an optimized media asset on the other.',
    icon: <Layers className="w-5 h-5 text-cyan-700" />,
    defaultData: {
      heading: 'World-Class Innovation Labs',
      text: 'Our Mogadishu campus features clean-tech energy benches, IoT development boards, and high-speed satellite links.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      imagePosition: 'right'
    },
    previewHint: 'Balanced 50/50 split media + copy'
  },

  // Media
  {
    type: 'image',
    name: 'Adaptive Image',
    category: 'Media',
    description: 'High-definition responsive image with aspect ratio control, caption, alt text, and lightbox support.',
    icon: <ImageIcon className="w-5 h-5 text-rose-600" />,
    defaultData: {
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      alt: 'SiHub Campus Innovation Hall',
      aspectRatio: '16/9'
    },
    previewHint: 'Responsive single image'
  },
  {
    type: 'video',
    name: 'Embedded Video',
    category: 'Media',
    description: 'Responsive video embed supporting YouTube, Vimeo, or direct MP4 links with playback controls.',
    icon: <Video className="w-5 h-5 text-red-600" />,
    defaultData: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      caption: 'SiHub Annual Demo Day Keynote Highlight',
      aspectRatio: '16/9'
    },
    previewHint: 'Streaming video player'
  },
  {
    type: 'gallery',
    name: 'Media Gallery Grid',
    category: 'Media',
    description: 'Masonry or uniform grid of photos with hover effects, lightbox expansion, and captions.',
    icon: <ImageIcon className="w-5 h-5 text-fuchsia-600" />,
    defaultData: {
      images: [
        { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80', caption: 'MakerSpace Lab' },
        { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', caption: 'Incubation Studio' },
        { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80', caption: 'Demo Pitch Hall' }
      ],
      columns: 3
    },
    previewHint: 'Multi-image grid'
  },
  {
    type: 'videoGallery',
    name: 'Video Gallery',
    category: 'Media',
    description: 'A responsive collection of videos with captions.',
    icon: <Video className="w-5 h-5 text-red-600" />,
    defaultData: { items: [], aspectRatio: '16/9' },
    previewHint: 'Responsive video collection'
  },
  {
    type: 'banner',
    name: 'Promotional Banner',
    category: 'Media',
    description: 'Compact colored or gradient announcement banner for seasonal cohort applications or event dates.',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    defaultData: {
      title: 'Spring 2026 Acceleration Cohort Now Open',
      link: '/programs',
      linkText: 'Apply Today',
      variant: 'gradient'
    },
    previewHint: 'Eye-catching announcement strip'
  },

  // Interactive
  {
    type: 'button',
    name: 'Action Button',
    category: 'Interactive',
    description: 'Primary, secondary, or outline call-to-action button linking to internal pages or external portals.',
    icon: <MousePointerClick className="w-5 h-5 text-teal-600" />,
    defaultData: { text: 'Enroll Now', link: '/courses', variant: 'primary', size: 'medium' },
    previewHint: 'Standalone button element'
  },
  {
    type: 'cta',
    name: 'Call to Action Strip',
    category: 'Interactive',
    description: 'High-conversion lead card with headline, supporting text, and dual primary/secondary action triggers.',
    icon: <MousePointerClick className="w-5 h-5 text-cyan-600" />,
    defaultData: {
      title: 'Ready to Accelerate Your Somali Tech Venture?',
      description: 'Get matched with seasoned diaspora technical mentors and early seed capital.',
      primaryButtonText: 'Submit Application',
      primaryButtonLink: '/programs',
      secondaryButtonText: 'Download Prospectus',
      secondaryButtonLink: '/contact'
    },
    previewHint: 'Dual-button conversion card'
  },
  {
    type: 'faq',
    name: 'FAQ Accordion',
    category: 'Interactive',
    description: 'Collapsible questions and answers list with smooth animations, optimized for FAQ sections.',
    icon: <HelpCircle className="w-5 h-5 text-indigo-500" />,
    defaultData: { items: [] },
    previewHint: 'Expandable Q&A list'
  },
  {
    type: 'form',
    name: 'Interactive Form Card',
    category: 'Interactive',
    description: 'Embeddable contact or newsletter inquiry capture form directly routed into the admin inquiries inbox.',
    icon: <FileText className="w-5 h-5 text-emerald-700" />,
    defaultData: { title: 'Subscribe to Ecosystem Dispatch', placeholder: 'Enter your institutional email', buttonText: 'Subscribe' },
    previewHint: 'Input field & submission action'
  },

  // Ecosystem
  {
    type: 'stats',
    name: 'Impact Stats Counter',
    category: 'Ecosystem',
    description: 'Grid of numerical metric cards highlighting institutional achievements, founders funded, and graduates.',
    icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
    defaultData: {
      items: [
        { value: '45+', label: 'Venture Startups Incubated' },
        { value: '$1.8M', label: 'Follow-on Capital Raised' },
        { value: '3,200+', label: 'Digital Academy Graduates' },
        { value: '48%', label: 'Female Tech Leadership' }
      ]
    },
    previewHint: 'Key institutional KPI counters'
  },
  {
    type: 'features',
    name: 'Feature Highlights Grid',
    category: 'Ecosystem',
    description: '3 or 4 feature cards with icons, titles, and explanations showcasing core programs or facilities.',
    icon: <Sparkles className="w-5 h-5 text-cyan-500" />,
    defaultData: {
      items: [
        { title: 'MakerSpace Lab', desc: 'Hardware prototyping, 3D printers, and solar microgrid testing benches.' },
        { title: 'Seed Fund Access', desc: 'Pre-seed venture syndicate matching with diaspora angel networks.' },
        { title: 'Global Mentorship', desc: 'Direct 1-on-1 coaching from international engineering leaders.' }
      ]
    },
    previewHint: 'Cards with icons and copy'
  },
  {
    type: 'team',
    name: 'Leadership & Team Grid',
    category: 'Ecosystem',
    description: 'Team member cards with portrait photo, name, title, bio, and social/LinkedIn links.',
    icon: <Users className="w-5 h-5 text-indigo-600" />,
    defaultData: {
      items: [
        { name: 'Dr. Amina Farah', role: 'Executive Director', bio: 'Former MIT research fellow leading Somali digital policy.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
        { name: 'Hassan Nur', role: 'Head of Incubation', bio: 'Venture builder with 10+ years across East African ecosystems.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
      ]
    },
    previewHint: 'Executive portraits and bios'
  },
  {
    type: 'timeline',
    name: 'Milestone Timeline',
    category: 'Ecosystem',
    description: 'Vertical or horizontal sequential journey roadmap showing historical achievements and upcoming goals.',
    icon: <Clock className="w-5 h-5 text-amber-600" />,
    defaultData: { items: [], orientation: 'vertical' },
    previewHint: 'Chronological timeline track'
  },
  {
    type: 'eventCard',
    name: 'Event',
    category: 'Ecosystem',
    description: 'Display event details, venue, date, and an optional link.',
    icon: <Clock className="w-5 h-5 text-cyan-600" />,
    defaultData: { title: '', description: '', date: '', time: '', venue: '' },
    previewHint: 'Event information card'
  },
  {
    type: 'newsCard',
    name: 'News Story',
    category: 'Ecosystem',
    description: 'Display a news title, summary, category, and optional link.',
    icon: <FileText className="w-5 h-5 text-cyan-600" />,
    defaultData: { title: '', summary: '', publishedAt: '', category: '' },
    previewHint: 'News story card'
  },
  {
    type: 'partners',
    name: 'Partner Logo Wall',
    category: 'Ecosystem',
    description: 'Grayscale-to-color interactive logo wall featuring institutional sponsors, universities, and partners.',
    icon: <Users className="w-5 h-5 text-teal-600" />,
    defaultData: {
      items: [
        { name: 'UNDP Somalia', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' },
        { name: 'Ministry of Communications & Tech', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' }
      ]
    },
    previewHint: 'Sponsor & partner trust logos'
  },
  {
    type: 'testimonials',
    name: 'Founder Testimonials',
    category: 'Ecosystem',
    description: 'Quotes and reviews from accelerated startup founders, academy students, and enterprise partners.',
    icon: <FileText className="w-5 h-5 text-rose-500" />,
    defaultData: {
      items: [
        { quote: 'SiHub provided the seed grant and cloud credits that allowed AgriSom to reach 10,000 farmers.', author: 'Farah Abdi', venture: 'Founder, AgriSom' }
      ]
    },
    previewHint: 'Testimonials and social proof'
  },
  {
    type: 'contactInfo',
    name: 'Campus Contact Card',
    category: 'Ecosystem',
    description: 'Structured institutional contact block with physical address, phone, email, and operating hours.',
    icon: <PhoneCall className="w-5 h-5 text-emerald-600" />,
    defaultData: {
      title: 'SiHub Innovation Campus',
      address: 'Airport Road, KM4 District, Mogadishu, Somalia',
      email: 'partnerships@sihub.so',
      phone: '+252 61 500 0000',
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM EAT'
    },
    previewHint: 'Official address & contact card'
  },
  {
    type: 'customHtml',
    name: 'Sanitized Custom HTML',
    category: 'Ecosystem',
    description: 'Custom HTML embed container for third-party widgets, badges, or custom SVG illustrations (securely sanitized).',
    icon: <Code className="w-5 h-5 text-slate-700" />,
    defaultData: {
      html: '<div class="p-6 rounded-2xl bg-slate-900 text-white text-center"><p class="text-xs uppercase font-mono tracking-widest text-cyan-400">Custom Widget</p><h4 class="text-lg font-bold mt-1">Ecosystem Innovation Hub</h4></div>'
    },
    previewHint: 'Custom safe HTML block'
  }
];

const supportedBlockTypes = new Set<CmsBlockType>([
  'heading', 'subheading', 'paragraph', 'richText', 'list', 'quote', 'link', 'button',
  'image', 'video', 'gallery', 'videoGallery', 'card', 'stat', 'teamMember', 'testimonial', 'partnerLogo',
  'programCard', 'embed', 'document', 'textImage', 'divider', 'contactInfo', 'faq', 'timeline', 'eventCard', 'newsCard'
]);

export const SectionBlocksCatalogArea: React.FC<SectionBlocksCatalogAreaProps> = ({
  onInsertBlock,
  onInsertSectionPreset,
  onOpenStudio,
  selectedPageSlug = 'home'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const categories = ['All', 'Layout', 'Content', 'Media', 'Interactive', 'Ecosystem'];

  const filteredBlocks = useMemo(() => {
    return ALL_BLOCK_DEFINITIONS.filter(b => {
      if (!supportedBlockTypes.has(b.type as CmsBlockType)) return false;
      const matchCat = selectedCategory === 'All' || b.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleInsert = (blockDef: BlockDefinition) => {
    if (onInsertBlock) {
      if (!supportedBlockTypes.has(blockDef.type as CmsBlockType)) return;
      onInsertBlock(blockDef.type as CmsBlockType);
    } else if (onInsertSectionPreset) {
      // Create a section with this block
      const newSection: CmsPageSection = {
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: blockDef.name,
        placement: 'bottom',
        order: 99,
        visible: true,
        archived: false,
        layout: {
          desktopColumns: 2,
          tabletColumns: 2,
          mobileColumns: 1,
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          spacing: 'normal'
        },
        blocks: [
          {
            id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'heading',
            text: blockDef.name,
            level: 2
          }
        ]
      };
      onInsertSectionPreset(newSection);
    }
    setCopiedType(blockDef.type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
            <Layers className="w-4 h-4" /> Component Registry • {supportedBlockTypes.size} Supported Content Blocks
          </div>
          <h2 className="text-2xl font-extrabold font-heading">Sections & Content Blocks Catalog</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Explore and deploy pre-built responsive blocks directly onto any page. Every block satisfies strict enterprise schema validation and conforms to the SiHub brand design system.
          </p>
        </div>

        {onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <FolderPlus className="w-4 h-4" /> Open Visual Builder Canvas &rarr;
          </button>
        )}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search 26 blocks..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBlocks.map(block => {
          const isCopied = copiedType === block.type;
          return (
            <div
              key={block.type}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-cyan-50 group-hover:border-cyan-100 transition-colors">
                    {block.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {block.category}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">{block.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">{block.description}</p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-mono mb-4 flex items-center justify-between">
                  <span>Type: <code className="text-cyan-700 font-bold">{block.type}</code></span>
                  <span className="text-[10px] text-slate-400">{block.previewHint}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleInsert(block)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-xs'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added to Page!
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Insert into {selectedPageSlug}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
