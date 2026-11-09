/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Master Centralized Website Builder & CMS
 * Complete administrator control of the entire public institutional website
 * from one unified location in the Admin Dashboard.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Save,
  Upload,
  History,
  Settings,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  ExternalLink,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Search,
  Globe,
  Image as ImageIcon,
  Video,
  Users,
  Quote,
  Download,
  Grid,
  RotateCcw,
  X,
  Send,
  Sliders,
  Check,
  Undo2,
  Redo2,
  Palette,
  GitPullRequest,
  LayoutTemplate,
  GripVertical
} from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';
import { CmsSectionRenderer } from '../common/CmsSectionRenderer';
import type { CmsBlockType, CmsContentBlock, CmsPageSection } from '../../types/cmsBlocks';
import { getCmsMediaIds } from '../../utils/cmsContent';
import { parseCmsMediaUrl } from '../../utils/mediaUrl';
import { useApp } from '../../context/AppContext';
import { CMSOverviewArea } from './cms/CMSOverviewArea';
import { PagesManagerArea } from './cms/PagesManagerArea';
import { NavigationManagerArea, NavCategory } from './cms/NavigationManagerArea';
import { SectionBlocksCatalogArea } from './cms/SectionBlocksCatalogArea';
import { MediaLibraryArea } from './cms/MediaLibraryArea';
import { TemplatesArea, PageTemplate } from './cms/TemplatesArea';
import { DesignStylingArea } from './cms/DesignStylingArea';
import { DraftsPublishingArea } from './cms/DraftsPublishingArea';
import { RevisionHistoryArea } from './cms/RevisionHistoryArea';
import { SEOSettingsArea } from './cms/SEOSettingsArea';
import { AboutPageEditor } from './cms/AboutPageEditor';
import { About } from '../public/About';

type CmsStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

interface CmsEntry {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary: string | null;
  content: Record<string, unknown>;
  status: CmsStatus;
  deletedAt: string | null;
  updatedAt: string;
}

interface MediaAsset {
  id: string;
  originalName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  byteSize: number;
  previewUrl: string;
}

interface CmsRevision {
  id: string;
  revisionNumber: number;
  title: string;
  status: string;
  createdAt: string;
}


const createId = () => globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const blockDisplayName = (type: CmsBlockType) => ({
  heading: 'Title', subheading: 'Subtitle', paragraph: 'Text', richText: 'Formatted text', list: 'List',
  quote: 'Quote', link: 'Link', button: 'Button', image: 'Image', video: 'Video', gallery: 'Photo gallery',
  card: 'Card', stat: 'Statistic', teamMember: 'Team profile', testimonial: 'Testimonial', partnerLogo: 'Partner logo',
  programCard: 'Program card', embed: 'Embedded media', document: 'Downloadable document', textImage: 'Text and image',
  divider: 'Divider', contactInfo: 'Contact information', faq: 'Frequently asked questions', timeline: 'Timeline',
  eventCard: 'Event', newsCard: 'News story', videoGallery: 'Video gallery', customHtml: 'Custom content'
}[type] ?? 'Content');

const withAdminMediaPreviews = (value: unknown, media: MediaAsset[]): unknown => {
  if (typeof value === 'string') {
    const assetId = value.match(/^\/api\/media\/([^/]+)\/public$/)?.[1];
    return assetId ? media.find(asset => asset.id === assetId)?.previewUrl ?? value : value;
  }
  if (Array.isArray(value)) return value.map(item => withAdminMediaPreviews(item, media));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withAdminMediaPreviews(item, media)]));
  return value;
};

const emptyLayout: CmsPageSection['layout'] = {
  desktopColumns: 2,
  tabletColumns: 2,
  mobileColumns: 1,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  spacing: 'normal',
  contentWidth: 'contained',
  borderStyle: 'none'
};

const newSection = (name = 'New Section', placement: 'top' | 'bottom' = 'bottom'): CmsPageSection => ({
  id: createId(),
  name,
  description: '',
  placement,
  order: 0,
  visible: true,
  archived: false,
  layout: { ...emptyLayout },
  blocks: [
    { id: createId(), type: 'heading', text: 'Section Heading', level: 2 },
    { id: createId(), type: 'paragraph', text: 'Provide clear, informative copy describing this initiative or service.' }
  ]
});

const createBlock = (type: CmsBlockType): CmsContentBlock => {
  const id = createId();
  switch (type) {
    case 'heading':
      return { id, type, text: 'Prominent Section Heading', level: 2, alignment: 'left', fontSize: '2xl', fontFamily: 'sans' };
    case 'subheading':
      return { id, type, text: 'Strategic Priority & Focus Area', alignment: 'left', fontSize: 'sm', fontFamily: 'sans' };
    case 'paragraph':
      return { id, type, text: 'Detailed editorial paragraph outlining institutional progress, resources, or impact metrics.', alignment: 'left', fontSize: 'base', fontFamily: 'sans' };
    case 'richText':
      return { id, type, text: 'Use **bold**, *italic*, and `code` formatting to structure high-priority notices and announcements.', alignment: 'left', fontSize: 'base', fontFamily: 'sans' };
    case 'list':
      return { id, type, items: ['First key milestone or program requirement', 'Second strategic deliverable', 'Third community outcome'], alignment: 'left' };
    case 'quote':
      return { id, type, text: 'SiHub serves as the national launchpad for young Somali pioneers creating homegrown technological solutions.', author: 'Executive Steward', title: 'SiHub Leadership', alignment: 'left' };
    case 'link':
      return { id, type, label: 'Explore Institutional Report', url: '/programs', alignment: 'left' };
    case 'button':
      return { id, type, label: 'Submit Cohort Dossier', url: '/programs', alignment: 'left', variant: 'primary' };
    case 'image':
      return { id, type, src: '', alt: 'Institutional image description', caption: '', aspectRatio: '16/9', alignment: 'center' };
    case 'video':
      return { id, type, src: '', alt: 'SiHub media video stream', caption: '', aspectRatio: '16/9', alignment: 'center' };
    case 'gallery':
      return { id, type, items: [], aspectRatio: '4/3' };
    case 'videoGallery':
      return { id, type, items: [], aspectRatio: '16/9' };
    case 'card':
      return { id, type, title: 'Strategic Initiative Card', description: 'Accelerating entrepreneurship through seed investments and diaspora mentorship.', badge: 'Residency Track', buttonLabel: 'Learn More', url: '/startups' };
    case 'stat':
      return { id, type, value: '1,400+', label: 'Somali Youth Upskilled', description: 'Across software engineering, AgriTech and renewable energy.', change: '+45% YoY' };
    case 'teamMember':
      return { id, type, name: 'Lead Coordinator', role: 'Innovation Steward', location: 'Mogadishu HQ', bio: 'Directing community acceleration and grassroots incubation programs.' };
    case 'testimonial':
      return { id, type, quote: 'Joining SiHub gave our founding team the laboratory tools and regional network to scale from prototype to commercial launch.', author: 'Founder Name', organization: 'Somali Green AgriTech', role: 'Chief Executive' };
    case 'partnerLogo':
      return { id, type, name: 'Institutional Partner', logoUrl: '', websiteUrl: 'https://sihub.so', tier: 'Strategic Partner' };
    case 'programCard':
      return { id, type, title: 'SWITI: Somali Women in Innovation', category: 'Women in Tech', description: 'Comprehensive digital leadership, coding cohorts and direct seed micro-grants.', duration: '6 Months', targetAudience: 'Women Tech Pioneers', actionUrl: '/programs' };
    case 'embed':
      return { id, type, src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', title: 'SiHub Keynote Presentation', aspectRatio: '16/9' };
    case 'document':
      return { id, type, title: 'SiHub Ecosystem Impact Whitepaper', description: 'Audited regional metrics, grant disbursements, and cohort outcomes.', fileUrl: '#', fileSize: '2.4 MB', format: 'PDF' };
    case 'textImage':
      return { id, type, heading: '', text: '', image: '', layout: 'imageLeft' };
    case 'divider':
      return { id, type, style: 'solid', height: 'md' };
    case 'contactInfo':
      return { id, type, title: '', email: '', phone: '', address: '', hours: '' };
    case 'faq':
      return { id, type, items: [] };
    case 'timeline':
      return { id, type, items: [], orientation: 'vertical' };
    case 'eventCard':
      return { id, type, title: '', description: '', date: '', time: '', venue: '' };
    case 'newsCard':
      return { id, type, title: '', summary: '', publishedAt: '', category: '' };
    case 'customHtml':
      return { id, type, html: '' };
  }
};

const officialNavHierarchy: NavCategory[] = [
  { key: 'home', label: 'Home', view: 'home' },
  {
    key: 'about', label: 'About SiHub', view: 'about',
    subItems: [
      { key: 'who-we-are', label: 'Who We Are', view: 'about', desc: 'Parent ecosystem mandate & strategic identity' },
      { key: 'vision-mission', label: 'Vision & Mission', view: 'about', desc: 'Leading center for grassroots social innovation' },
      { key: 'our-team', label: 'Our Team', view: 'about', desc: 'Executive leadership & ecosystem stewards' }
    ]
  },
  {
    key: 'programmes', label: 'Our Programmes', view: 'programs',
    subItems: [
      { key: 'digital-skills', label: 'Digital Skills Development', view: 'programs', desc: 'High-impact technology & workforce tracks' },
      { key: 'youth-empowerment', label: 'Youth Empowerment', view: 'programs', desc: 'Leadership, capacity building & pathways' },
      { key: 'social-innovation', label: 'Social Innovation', view: 'programs', desc: 'Grassroots community problem-solving' },
      { key: 'women-innovation', label: 'Women in Innovation', view: 'programs', desc: 'Gender-inclusive tech & entrepreneurship' },
      { key: 'inclusive-digital', label: 'Inclusive Digital Inclusion', view: 'programs', desc: 'Equitable access for all regions & backgrounds' },
      { key: 'green-sustainability', label: 'Green Innovation & Sustainability', view: 'programs', desc: 'Climate resilience, clean energy & AgriTech' },
      { key: 'youth-peace', label: 'Youth Peace Innovation', view: 'programs', desc: 'Community cohesion & peacebuilding solutions' },
      { key: 'community-dev', label: 'Community Development', view: 'programs', desc: 'Grassroots civic transformation initiatives' }
    ]
  },
  {
    key: 'startups', label: 'Entrepreneurship & Startups', view: 'startups',
    subItems: [
      { key: 'incubation', label: 'Startup Incubation', view: 'startups', desc: 'Seed funding, co-working & structured acceleration' },
      { key: 'directory', label: 'Startup Directory', view: 'startups', desc: 'Search venture profiles and founder directory' },
      { key: 'entrepreneurs', label: 'Entrepreneurs', view: 'startups', desc: 'Featured Somali founders & active portfolio' },
      { key: 'youth-mentorship', label: 'Youth Mentorship', view: 'mentorship', desc: '1-on-1 guidance from diaspora & industry leaders' },
      { key: 'startup-support', label: 'Startup Support', view: 'startups', desc: 'Legal sandboxes, prototyping labs & investor readiness' }
    ]
  },
  {
    key: 'institute', label: 'SiHub Institute', view: 'courses',
    subItems: [
      { key: 'digital-skills-academy', label: 'Digital Skills Academy', view: 'courses', desc: 'Software engineering, cloud & modern tech' },
      { key: 'professional-training', label: 'Professional Training', view: 'courses', desc: 'Executive masterclasses & industry diplomas' },
      { key: 'ai-emerging', label: 'AI & Emerging Technologies', view: 'courses', desc: 'Machine learning, IoT & generative AI' },
      { key: 'research-innovation', label: 'Research & Innovation', view: 'innovation', desc: 'Applied R&D labs & academic publications' },
      { key: 'certification', label: 'Certification', view: 'courses', desc: 'Public learning pathways and completion records' }
    ]
  },
  {
    key: 'events-media', label: 'Events & Media', view: 'events',
    subItems: [
      { key: 'sitalks', label: 'SiHub Talks (SiTalks)', view: 'events', desc: 'Thought leadership panels & keynote sessions' },
      { key: 'summit', label: 'Somali Innovation Summit', view: 'events', desc: 'Annual flagship Horn of Africa gathering' },
      { key: 'expo', label: 'SiHub Expo', view: 'events', desc: 'Showcase of homegrown innovations & prototypes' },
      { key: 'news-stories', label: 'News & Stories', view: 'news', desc: 'Ecosystem updates, milestones & press releases' },
      { key: 'media-gallery', label: 'Media Gallery', view: 'media_gallery', url: '/media', desc: 'Event photos, video archives & highlights' }
    ]
  },
  {
    key: 'impact', label: 'Our Impact', view: 'impact',
    subItems: [
      { key: 'success-stories', label: 'Success Stories', view: 'impact', desc: 'Inspiring founder journeys & community impact' },
      { key: 'projects-achievements', label: 'Projects & Achievements', view: 'innovation', desc: 'Tangible milestones delivered across Somalia' },
      { key: 'annual-reports', label: 'Annual Reports', view: 'news', desc: 'Audited impact assessments & publications' },
      { key: 'community-impact', label: 'Community Impact', view: 'community', desc: 'Outreach metrics across 4 regional hub stations' }
    ]
  },
  {
    key: 'partnerships', label: 'Partnerships', view: 'partnerships',
    subItems: [
      { key: 'become-partner', label: 'Become a Partner', view: 'partnerships', desc: 'Join as an academic, corporate, or civic ally' },
      { key: 'donors-supporters', label: 'Donors & Supporters', view: 'partnerships', desc: 'Multilateral agencies, foundations & diaspora' },
      { key: 'collaboration-opportunities', label: 'Collaboration Opportunities', view: 'opportunities', desc: 'Joint funding calls, pilot projects & research' }
    ]
  }
];

export const AdminWebsiteBuilder: React.FC = () => {
  const { addToast, navigateTo } = useApp();

  // Active Top Navigation Tab (11 integrated areas)
  const [activeArea, setActiveArea] = useState<
    'studio' | 'about' | 'overview' | 'pages' | 'navigation' | 'sections' | 'media' | 'templates' | 'styling' | 'publishing' | 'revisions' | 'settings'
  >('studio');

  // History Undo / Redo Stack (25 steps deep)
  const [undoStack, setUndoStack] = useState<CmsPageSection[][]>([]);
  const [redoStack, setRedoStack] = useState<CmsPageSection[][]>([]);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{ sectionId: string; blockIndex: number } | null>(null);

  const setSectionsWithHistory = (newSecs: CmsPageSection[] | ((prev: CmsPageSection[]) => CmsPageSection[])) => {
    setSections(current => {
      const resolved = typeof newSecs === 'function' ? newSecs(current) : newSecs;
      setUndoStack(prev => [...prev.slice(-25), current]);
      setRedoStack([]);
      return resolved;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, sections]);
    setSections(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setUndoStack(prev => [...prev, sections]);
    setSections(next);
  };

  // Drag and Drop reordering
  const handleDragStartSection = (index: number, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSectionIndex(index);
  };

  const handleDropSection = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlockInfo) {
      const sourceInfo = draggedBlockInfo;
      const targetSectionId = sections[targetIndex]?.id;
      if (!targetSectionId) return;
      setSectionsWithHistory(prev => {
        const source = prev.find(section => section.id === sourceInfo.sectionId);
        const target = prev.find(section => section.id === targetSectionId);
        if (!source || !target) return prev;
        const sourceBlocks = [...source.blocks];
        const [moved] = sourceBlocks.splice(sourceInfo.blockIndex, 1);
        if (!moved) return prev;
        return prev.map(section => {
          if (section.id === source.id && section.id === target.id) return { ...section, blocks: [...sourceBlocks, moved] };
          if (section.id === source.id) return { ...section, blocks: sourceBlocks };
          if (section.id === target.id) return { ...section, blocks: [...section.blocks, moved] };
          return section;
        });
      });
      setSelectedSectionId(targetSectionId);
      setSelectedBlockId(sections.find(section => section.id === draggedBlockInfo.sectionId)?.blocks[draggedBlockInfo.blockIndex]?.id ?? '');
      setDraggedBlockInfo(null);
      return;
    }
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) return;
    setSectionsWithHistory(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedSectionIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((s, order) => ({ ...s, order }));
    });
    setDraggedSectionIndex(null);
  };

  const handleDragStartBlock = (sectionId: string, blockIndex: number, e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', String(blockIndex));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBlockInfo({ sectionId, blockIndex });
  };

  const handleDropBlock = (sectionId: string, targetBlockIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedBlockInfo || (draggedBlockInfo.sectionId === sectionId && draggedBlockInfo.blockIndex === targetBlockIndex)) {
      setDraggedBlockInfo(null);
      return;
    }
    const sourceInfo = draggedBlockInfo;
    let movedBlockId = '';
    setSectionsWithHistory(prev => {
      const source = prev.find(section => section.id === sourceInfo.sectionId);
      const target = prev.find(section => section.id === sectionId);
      if (!source || !target) return prev;
      const sourceBlocks = [...source.blocks];
      const [moved] = sourceBlocks.splice(sourceInfo.blockIndex, 1);
      if (!moved) return prev;
      movedBlockId = moved.id;
      if (source.id === target.id) {
        sourceBlocks.splice(targetBlockIndex, 0, moved);
        return prev.map(section => section.id === source.id ? { ...section, blocks: sourceBlocks } : section);
      }
      return prev.map(section => {
        if (section.id === source.id) return { ...section, blocks: sourceBlocks };
        if (section.id === target.id) {
          const targetBlocks = [...section.blocks];
          targetBlocks.splice(targetBlockIndex, 0, moved);
          return { ...section, blocks: targetBlocks };
        }
        return section;
      });
    });
    setSelectedSectionId(sectionId);
    if (movedBlockId) setSelectedBlockId(movedBlockId);
    setDraggedBlockInfo(null);
  };

  // State
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [pageContent, setPageContent] = useState<Record<string, unknown>>({});
  const [aboutPreviewOpen, setAboutPreviewOpen] = useState(false);
  const [sections, setSections] = useState<CmsPageSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newVideoGalleryUrl, setNewVideoGalleryUrl] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);

  // New Page creation modal state
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageSummary, setNewPageSummary] = useState('');

  // Navigation Manager state
  const [navItems, setNavItems] = useState<NavCategory[]>(officialNavHierarchy);
  const [newTopNavLabel, setNewTopNavLabel] = useState('');
  const [selectedNavCategoryKey, setSelectedNavCategoryKey] = useState<string>('programmes');
  const [newSubNavLabel, setNewSubNavLabel] = useState('');
  const [newSubNavDesc, setNewSubNavDesc] = useState('');
  const [newSubNavView, setNewSubNavView] = useState('programs');

  // Website Settings state
  const [siteTitle, setSiteTitle] = useState('Somali Innovation Hub (SiHub)');
  const [siteMetaDesc, setSiteMetaDesc] = useState('Pioneering center for grassroots innovation, digital skills, technology ventures, and social transformation in Somalia.');
  const [contactEmail, setContactEmail] = useState('info@sihub.so');
  const [contactPhone, setContactPhone] = useState('+252 61 500 0000');
  const [contactAddress, setContactAddress] = useState('KM4 Airport Road, Wadajir District, Mogadishu, Somalia');

  // Universal Wizard State (8-step)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardCategory, setWizardCategory] = useState('Our Programmes');
  const [wizardSubsection, setWizardSubsection] = useState('Digital Skills Development');
  const [wizardCustomSub, setWizardCustomSub] = useState('');
  const [wizardPageSlug, setWizardPageSlug] = useState('programs');
  const [wizardBlockType, setWizardBlockType] = useState<CmsBlockType>('card');
  const [wizardHeading, setWizardHeading] = useState('Featured Innovation Track');
  const [wizardBody, setWizardBody] = useState('Empowering grassroots Somali creators with cutting-edge incubation and funding.');
  const [wizardPlacement, setWizardPlacement] = useState<'top' | 'bottom'>('top');
  const [wizardCols, setWizardCols] = useState<1 | 2 | 3 | 4>(3);

  const pageEntries = useMemo(() => entries.filter(entry => entry.type === 'page'), [entries]);
  const selectedPage = pageEntries.find(entry => entry.id === selectedId);
  const selectedSection = sections.find(section => section.id === selectedSectionId);
  const selectedBlock = selectedSection?.blocks.find(block => block.id === selectedBlockId);

  const draftSnapshot = useMemo(() => JSON.stringify({
    title,
    slug,
    summary,
    pageContent,
    sections: sections.map((section, order) => ({ ...section, order }))
  }), [title, slug, summary, pageContent, sections]);

  const hasUnsavedChanges = Boolean(selectedPage && draftSnapshot !== savedSnapshot);
  const hasLiveDraftSeparation = Boolean(selectedPage?.status === 'PUBLISHED' && selectedPage.content._draft);

  // Data Loading
  const loadData = async (keepSelection = true) => {
    setLoading(true);
    try {
      const [entryResult, mediaResult, navResult] = await Promise.all([
        apiGet<{ entries: CmsEntry[] }>('/api/cms/admin'),
        apiGet<{ media: MediaAsset[] }>('/api/media/admin'),
        apiGet<{ categories: NavCategory[] }>('/api/cms/navigation').catch(() => ({ categories: officialNavHierarchy }))
      ]);

      setEntries(entryResult.entries);
      setMedia(mediaResult.media);
      if (navResult.categories && navResult.categories.length) {
        setNavItems(navResult.categories);
      }

      const pages = entryResult.entries.filter(entry => entry.type === 'page');
      const next = keepSelection ? pages.find(page => page.id === selectedId) ?? pages[0] : pages[0];
      if (next) {
        selectPage(next);
      } else {
        setSelectedId('');
        setSections([]);
        setTitle('');
        setSlug('');
        setSummary('');
      }
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load CMS configuration from server.');
    } finally {
      setLoading(false);
    }
  };

  const selectPage = (page: CmsEntry) => {
    // Check if there is a working draft saved inside content._draft
    const draftEnvelope = page.content._draft && typeof page.content._draft === 'object'
      ? page.content._draft as Record<string, unknown>
      : null;
    const draftContent = draftEnvelope?.content && typeof draftEnvelope.content === 'object' && !Array.isArray(draftEnvelope.content)
      ? draftEnvelope.content as Record<string, unknown>
      : page.content._published && typeof page.content._published === 'object' && !Array.isArray(page.content._published)
        ? page.content._published as Record<string, unknown>
        : page.content;

    const storedSections = Array.isArray(draftContent.sections) ? draftContent.sections as CmsPageSection[] : [];
    const orderedSections = [...storedSections].sort((a, b) => a.order - b.order);

    setSelectedId(page.id);
    setTitle(String(draftContent.title || page.title));
    setSlug(String(draftContent.slug || page.slug));
    setSummary(String(draftContent.summary ?? page.summary ?? ''));
    setSections(orderedSections);
    const { sections: _sections, _draft: _draft, _published: _published, ...contentFields } = draftContent;
    setPageContent(contentFields);
    setSelectedSectionId(orderedSections[0]?.id ?? '');
    setSelectedBlockId(orderedSections[0]?.blocks[0]?.id ?? '');

    const snapshot = JSON.stringify({
      title: String(draftContent.title || page.title),
      slug: String(draftContent.slug || page.slug),
      summary: String(draftContent.summary ?? page.summary ?? ''),
      pageContent: contentFields,
      sections: orderedSections.map((s, order) => ({ ...s, order }))
    });
    setSavedSnapshot(snapshot);
    if (page.slug !== 'about') setAboutPreviewOpen(false);

    setRevisions([]);
    void apiGet<{ revisions: CmsRevision[] }>(`/api/cms/admin/${encodeURIComponent(page.id)}/revisions`)
      .then(res => setRevisions(res.revisions))
      .catch(() => setRevisions([]));
  };

  useEffect(() => {
    void loadData(false);
  }, []);

  // Page Operations
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      setError('Title and slug are required.');
      return;
    }
    try {
      const initialSection = newSection('Welcome Section', 'top');
      const result = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', {
        type: 'page',
        title: newPageTitle.trim(),
        slug: newPageSlug.trim().toLowerCase(),
        summary: newPageSummary.trim(),
        content: { sections: [initialSection] }
      });
      setIsNewPageModalOpen(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setNewPageSummary('');
      await loadData(false);
      selectPage(result.entry);
      setActiveArea('studio');
      addToast('success', 'Page Created', `Page "${result.entry.title}" is ready in the visual builder.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to create the page.');
    }
  };

  const duplicateCurrentPage = async () => {
    if (!selectedPage) return;
    const newSlug = `${selectedPage.slug.slice(0, 130)}-copy-${createId().slice(0, 6)}`;
    const contentPayload: Record<string, unknown> = {
      ...pageContent,
      sections: sections.map((s, order) => ({ ...s, order }))
    };
    delete contentPayload.mediaAssetIds;
    contentPayload.mediaAssetIds = getCmsMediaIds(contentPayload);

    try {
      const result = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', {
        type: 'page',
        title: `${title || selectedPage.title} (Copy)`.slice(0, 240),
        slug: newSlug,
        summary,
        content: contentPayload
      });
      await loadData(false);
      selectPage(result.entry);
      addToast('success', 'Page Duplicated', 'Duplicated page is ready as a draft.');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Failed to duplicate page.');
    }
  };

  const selectPageBySlug = (targetSlug: string) => {
    const p = pageEntries.find(item => item.slug === targetSlug);
    if (p) {
      selectPage(p);
    } else {
      void apiGet<{ entry: CmsEntry }>(`/api/cms/pages/${targetSlug}`)
        .then(res => {
          if (res.entry) selectPage(res.entry);
        })
        .catch(err => console.warn(err));
    }
    setActiveArea('studio');
  };

  const createPageWithTemplate = async (template: PageTemplate, targetSlug: string, targetTitle: string) => {
    try {
      const result = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', {
        type: 'page',
        title: targetTitle,
        slug: targetSlug.toLowerCase(),
        summary: template.description,
        content: {
          sections: template.sections.map((s, idx) => ({
            ...s,
            id: createId(),
            order: idx,
            blocks: s.blocks.map(b => ({ ...b, id: createId() }))
          }))
        }
      });
      await loadData(false);
      selectPage(result.entry);
      setActiveArea('studio');
      addToast('success', 'Page Created from Template', `Page "${result.entry.title}" initialized with ${template.sectionsCount} sections.`);
    } catch (err) {
      addToast('error', 'Failed to Create Page', err instanceof ApiError ? err.message : 'Unknown error');
    }
  };

  // Section Operations
  const handleAddSection = (placement: 'top' | 'bottom' = 'bottom') => {
    const s = newSection(`Section ${sections.length + 1}`, placement);
    s.order = sections.length;
    setSectionsWithHistory(prev => [...prev, s]);
    setSelectedSectionId(s.id);
    setSelectedBlockId(s.blocks[0]?.id ?? '');
  };

  const handleUpdateSection = (sectionId: string, patch: Partial<CmsPageSection>) => {
    setSectionsWithHistory(prev => prev.map(s => s.id === sectionId ? { ...s, ...patch } : s));
  };

  const handleDuplicateSection = (sec: CmsPageSection) => {
    const copy: CmsPageSection = {
      ...sec,
      id: createId(),
      name: `${sec.name} (Copy)`,
      order: sections.length,
      blocks: sec.blocks.map(b => ({ ...b, id: createId() } as CmsContentBlock))
    };
    setSectionsWithHistory(prev => [...prev, copy]);
    setSelectedSectionId(copy.id);
    setSelectedBlockId(copy.blocks[0]?.id ?? '');
  };

  const handleReorderSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSectionsWithHistory(reordered.map((s, order) => ({ ...s, order })));
  };

  const handleDeleteSection = (sectionId: string) => {
    setSectionsWithHistory(prev => prev.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId('');
      setSelectedBlockId('');
    }
  };

  // Block Operations
  const handleAddBlock = (type: CmsBlockType) => {
    if (!selectedSection) return;
    const block = createBlock(type);
    handleUpdateSection(selectedSection.id, {
      blocks: [...selectedSection.blocks, block]
    });
    setSelectedBlockId(block.id);
  };

  const handleUpdateBlock = (blockId: string, patch: Partial<CmsContentBlock>) => {
    if (!selectedSection) return;
    const updatedBlocks = selectedSection.blocks.map(b =>
      b.id === blockId ? ({ ...b, ...patch } as CmsContentBlock) : b
    );
    handleUpdateSection(selectedSection.id, { blocks: updatedBlocks });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!selectedSection) return;
    const updatedBlocks = selectedSection.blocks.filter(b => b.id !== blockId);
    handleUpdateSection(selectedSection.id, { blocks: updatedBlocks });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(updatedBlocks[0]?.id ?? '');
    }
  };

  const handleReorderBlock = (index: number, direction: -1 | 1) => {
    if (!selectedSection) return;
    const target = index + direction;
    if (target < 0 || target >= selectedSection.blocks.length) return;
    const reordered = [...selectedSection.blocks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    handleUpdateSection(selectedSection.id, { blocks: reordered });
  };

  // Media Library Integration
  const handleUploadMedia = async (file: File, targetBlockId?: string): Promise<{ id: string; url: string } | null> => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    const targetBlock = targetBlockId ? selectedSection?.blocks.find(block => block.id === targetBlockId) : undefined;
    if (!allowed.includes(file.type)) {
      setError('Please choose a JPEG, PNG, WebP, MP4, or WebM file.');
      return null;
    }
    if (targetBlock?.type === 'gallery' && file.type.startsWith('video/')) {
      setError('Photo galleries accept images. Add a video gallery for video files.');
      return null;
    }
    if (targetBlock?.type === 'videoGallery' && !file.type.startsWith('video/')) {
      setError('Video galleries accept MP4 and WebM files.');
      return null;
    }
    setUploading(true);
    setError('');
    try {
      const presign = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', {
        filename: file.name,
        contentType: file.type,
        byteSize: file.size
      });
      const response = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: presign.headers,
        body: file
      });
      if (!response.ok) throw new Error('File upload to storage failed.');
      await apiPost(`/api/media/${encodeURIComponent(presign.assetId)}/complete`);

      const publicSrc = `/api/media/${presign.assetId}/public`;
      const isVideo = file.type.startsWith('video/');

      if (targetBlockId && selectedSection) {
        const target = selectedSection.blocks.find(b => b.id === targetBlockId);
        if (target?.type === 'gallery' || target?.type === 'videoGallery') {
          handleUpdateBlock(targetBlockId, {
            items: [...target.items, { src: publicSrc, alt: file.name }]
          });
        } else {
          handleUpdateBlock(targetBlockId, {
            src: publicSrc,
            alt: file.name,
            type: isVideo ? 'video' : 'image'
          } as Partial<CmsContentBlock>);
        }
      }

      addToast('success', 'Asset Uploaded', `${file.name} saved to media library.`);
      await refreshMedia();
      return { id: presign.assetId, url: publicSrc };
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Media upload failed.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const refreshMedia = async () => {
    try {
      const res = await apiGet<{ media: MediaAsset[] }>('/api/media/admin');
      setMedia(res.media);
    } catch {
      // ignore
    }
  };

  const assignLibraryAsset = (asset: MediaAsset, targetBlockId: string) => {
    if (!selectedSection) return;
    const src = `/api/media/${asset.id}/public`;
    const alt = asset.title || asset.originalName;
    const caption = asset.description || undefined;
    const isVideo = asset.contentType.startsWith('video/');
    const target = selectedSection.blocks.find(b => b.id === targetBlockId);

    if (target?.type === 'gallery' || target?.type === 'videoGallery') {
      if (target.type === 'gallery' && isVideo || target.type === 'videoGallery' && !isVideo) {
        setError(target.type === 'gallery' ? 'Choose an image for this photo gallery.' : 'Choose a video for this video gallery.');
        return;
      }
      handleUpdateBlock(targetBlockId, {
        items: [...target.items, { src, alt, caption }]
      });
    } else {
      handleUpdateBlock(targetBlockId, {
        src,
        alt,
        caption,
        type: isVideo ? 'video' : 'image'
      } as Partial<CmsContentBlock>);
    }
    addToast('info', 'Asset Selected', `Applied ${asset.originalName} to block.`);
  };

  const addVideoGalleryUrl = (targetBlockId: string) => {
    if (!selectedSection) return;
    const target = selectedSection.blocks.find(block => block.id === targetBlockId);
    if (target?.type !== 'videoGallery') return;
    try {
      const parsed = parseCmsMediaUrl(newVideoGalleryUrl, 'video');
      handleUpdateBlock(targetBlockId, { items: [...target.items, { src: parsed.url, alt: 'Video gallery item', caption: '' }] });
      setNewVideoGalleryUrl('');
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Enter a supported video URL.');
    }
  };

  // Draft vs Publish Separation (User requirement & Error resolution #1)
  const handleSaveDraft = async (): Promise<boolean> => {
    if (!selectedPage) return false;
    try {
      const contentPayload: Record<string, unknown> = {
        ...pageContent,
        title,
        slug,
        summary,
        sections: sections.map((s, order) => ({ ...s, order }))
      };
      delete contentPayload.mediaAssetIds;
      contentPayload.mediaAssetIds = getCmsMediaIds(contentPayload);

      // PATCH preserves published status if page is PUBLISHED, storing changes in _draft
      const result = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}`, {
        type: 'page',
        title,
        slug,
        summary,
        content: contentPayload
      });

      setEntries(prev => prev.map(e => e.id === result.entry.id ? result.entry : e));
      setSavedSnapshot(JSON.stringify({
        title,
        slug,
        summary,
        pageContent,
        sections: sections.map((s, order) => ({ ...s, order }))
      }));

      addToast('success', 'Draft Saved', selectedPage.status === 'PUBLISHED'
        ? 'Working draft preserved. Live website remains intact!'
        : 'Draft saved to database.');

      // Refresh revisions
      void apiGet<{ revisions: CmsRevision[] }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/revisions`)
        .then(res => setRevisions(res.revisions))
        .catch(() => {});

      return true;
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save draft.');
      return false;
    }
  };

  const handlePublishLive = async () => {
    if (!selectedPage) return;
    try {
      // First save draft content with publishNow flag
      const contentPayload: Record<string, unknown> = {
        ...pageContent,
        title,
        slug,
        summary,
        sections: sections.map((s, order) => ({ ...s, order }))
      };
      delete contentPayload.mediaAssetIds;
      contentPayload.mediaAssetIds = getCmsMediaIds(contentPayload);

      const publishResult = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}`, {
        type: 'page',
        title,
        slug,
        summary,
        content: contentPayload,
        publishNow: true
      });
      setEntries(prev => prev.map(e => e.id === publishResult.entry.id ? publishResult.entry : e));
      selectPage(publishResult.entry);
      addToast('success', 'Published Live!', `"${title}" is now live on the public website with all updates.`);
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to publish page.');
    }
  };

  const handleDiscardDraft = async () => {
    if (!selectedPage) return;
    if (!window.confirm('Discard all uncommitted working draft changes and revert to the live published version?')) return;
    try {
      const res = await apiPost<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/discard-draft`);
      setEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
      selectPage(res.entry);
      addToast('info', 'Draft Discarded', 'Restored live published version.');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Failed to discard draft.');
    }
  };

  const handleStatusChange = async (status: CmsStatus) => {
    if (!selectedPage) return;
    try {
      const res = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/status`, {
        status
      });
      setEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
      addToast('info', 'Status Updated', `Status is now ${status.toLowerCase().replace('_', ' ')}.`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Failed to update status.');
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!selectedPage) return;
    try {
      const res = await apiPost<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/revisions/${encodeURIComponent(revId)}/restore`);
      setEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
      selectPage(res.entry);
      setIsRevisionModalOpen(false);
      addToast('success', 'Revision Restored', 'Historical revision restored as working draft.');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Failed to restore revision.');
    }
  };

  // Navigation Manager Functions
  const handleAddTopNav = () => {
    if (!newTopNavLabel.trim()) return;
    const key = newTopNavLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: NavCategory = {
      key,
      label: newTopNavLabel.trim(),
      view: 'home',
      subItems: []
    };
    const updated = [...navItems, newCat];
    setNavItems(updated);
    setNewTopNavLabel('');
    addToast('success', 'Navigation Added', `Added "${newCat.label}" to primary navigation.`);
  };

  const handleAddSubNav = () => {
    if (!newSubNavLabel.trim()) return;
    const cat = navItems.find(c => c.key === selectedNavCategoryKey);
    if (!cat) return;
    const subKey = newSubNavLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSub = {
      key: subKey,
      label: newSubNavLabel.trim(),
      desc: newSubNavDesc.trim() || undefined,
      view: newSubNavView
    };
    const updated = navItems.map(c => c.key === selectedNavCategoryKey ? { ...c, subItems: [...(c.subItems || []), newSub] } : c);
    setNavItems(updated);
    setNewSubNavLabel('');
    setNewSubNavDesc('');
    addToast('success', 'Sub-Navigation Added', `Added "${newSub.label}" under "${cat.label}".`);
  };

  const handleDeleteNavCategory = (catKey: string) => {
    if (!window.confirm('Delete this navigation category?')) return;
    setNavItems(prev => prev.filter(c => c.key !== catKey));
  };

  const handleDeleteSubNav = (catKey: string, subKey: string) => {
    setNavItems(prev => prev.map(c => c.key === catKey ? { ...c, subItems: (c.subItems || []).filter(s => s.key !== subKey) } : c));
  };

  // Universal Wizard Finish (8-Step Execution)
  const handleWizardSubmit = async (publishImmediately: boolean) => {
    try {
      // Find or target page
      let targetPage = pageEntries.find(p => p.slug === wizardPageSlug);
      if (!targetPage) {
        // Create destination page
        const newPageRes = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', {
          type: 'page',
          title: wizardHeading,
          slug: wizardPageSlug,
          summary: wizardBody.slice(0, 200),
          content: { sections: [] }
        });
        targetPage = newPageRes.entry;
      }

      // Build section & block
      const section = newSection(wizardHeading, wizardPlacement);
      section.layout.desktopColumns = wizardCols;
      const block = createBlock(wizardBlockType);

      // Customize block based on type
      if (block.type === 'card' || block.type === 'programCard') {
        block.title = wizardHeading;
        block.description = wizardBody;
      } else if (block.type === 'heading') {
        block.text = wizardHeading;
      } else if (block.type === 'paragraph' || block.type === 'richText') {
        block.text = wizardBody;
      }

      section.blocks = [
        { id: createId(), type: 'heading', text: wizardHeading, level: 2 },
        block
      ];

      const existingSections = Array.isArray(targetPage.content.sections) ? targetPage.content.sections as CmsPageSection[] : [];
      const updatedSections = wizardPlacement === 'top'
        ? [section, ...existingSections]
        : [...existingSections, section];

      const contentPayload = {
        ...targetPage.content,
        sections: updatedSections.map((s, order) => ({ ...s, order }))
      };

      await apiPatch(`/api/cms/admin/${encodeURIComponent(targetPage.id)}`, {
        type: 'page',
        title: targetPage.title,
        slug: targetPage.slug,
        summary: targetPage.summary,
        content: contentPayload,
        publishNow: publishImmediately
      });

      if (publishImmediately) {
        await apiPatch(`/api/cms/admin/${encodeURIComponent(targetPage.id)}/status`, {
          status: 'PUBLISHED'
        });
      }

      setIsWizardModalOpen(false);
      setWizardStep(1);
      await loadData(false);
      selectPage(targetPage);
      setActiveArea('studio');
      addToast('success', publishImmediately ? 'Published!' : 'Draft Saved!', `New content section successfully placed on /${targetPage.slug}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Wizard creation failed.');
    }
  };

  // Preview Width Helper
  const previewWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Toolbar */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
              6.0 Centralized CMS
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-slate-300 text-xs font-semibold">SiHub Website Builder</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Website Builder & Content Management
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Universal administrator control over public pages, official 8-category navigation, nested subsections, multi-column sections, media assets, and instant live publishing.
          </p>
        </div>

        {/* Global Action Desk */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal 8-Step Wizard Trigger */}
          <button
            onClick={() => {
              setWizardStep(1);
              setIsWizardModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-cyan-900/30 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Content (Guided Wizard)</span>
          </button>

          <button
            onClick={() => setIsNewPageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Page</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>View Live Site</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </header>

      {/* 11 Integrated Areas Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        {[
          { key: 'studio', label: 'Visual Studio & Canvas', icon: <Sliders className="w-4 h-4" /> },
          { key: 'about', label: 'About Page Content', icon: <FileText className="w-4 h-4" /> },
          { key: 'overview', label: 'CMS Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: 'pages', label: 'Pages Manager', icon: <FileText className="w-4 h-4" />, count: pageEntries.length },
          { key: 'navigation', label: 'Navigation Manager', icon: <Layers className="w-4 h-4" /> },
          { key: 'sections', label: 'Sections & Blocks Catalog', icon: <Grid className="w-4 h-4" /> },
          { key: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" />, count: media.length },
          { key: 'templates', label: 'Page Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
          { key: 'styling', label: 'Design & Styling', icon: <Palette className="w-4 h-4" /> },
          { key: 'publishing', label: 'Drafts & Publishing', icon: <GitPullRequest className="w-4 h-4" /> },
          { key: 'revisions', label: 'Revision History', icon: <History className="w-4 h-4" />, count: revisions.length },
          { key: 'settings', label: 'SEO & Website Settings', icon: <Settings className="w-4 h-4" /> }
        ].filter(tab => tab.key !== 'about' || selectedPage?.slug === 'about').map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveArea(tab.key as never)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeArea === tab.key
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeArea === tab.key ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global Notice / Error Banners */}
      {error && (
        <div role="alert" className="p-3 rounded-xl border border-rose-800 bg-rose-950/60 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="p-3 rounded-xl border border-emerald-800 bg-emerald-950/50 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="p-1 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {activeArea === 'about' && selectedPage?.slug === 'about' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <p className="text-xs font-bold text-white">About SiHub · /about</p>
              <p className="mt-1 text-[11px] text-slate-400">Preview your changes, then save them as a draft or publish them to the website.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAboutPreviewOpen(value => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"><Eye className="h-3.5 w-3.5 text-cyan-400" />{aboutPreviewOpen ? 'Back to editing' : 'Preview page'}</button>
              <button type="button" onClick={() => void handleSaveDraft()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"><Save className="h-3.5 w-3.5 text-cyan-400" />Save Draft</button>
              <button type="button" onClick={() => void handlePublishLive()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" />Publish Live</button>
            </div>
          </div>
          {aboutPreviewOpen
            ? <div className="overflow-hidden rounded-xl border border-slate-300 bg-white"><About previewContent={withAdminMediaPreviews({ ...pageContent, title, summary, sections: sections.map((section, order) => ({ ...section, order })) }, media) as Record<string, unknown>} /></div>
            : <AboutPageEditor
            content={pageContent}
            media={media}
            onChange={setPageContent}
            onUpload={async file => (await handleUploadMedia(file))?.url ?? null}
          />}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA 1: VISUAL STUDIO & RESPONSIVE CANVAS (Centerpiece 3-Panel Experience) */}
      {/* ========================================================================= */}
      {activeArea === 'studio' && (
        <div className="space-y-4">
          {/* Studio Top Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            {/* Left: Active Page Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editing Page:</span>
              <select
                value={selectedId}
                onChange={e => {
                  const p = pageEntries.find(item => item.id === e.target.value);
                  if (p && p.id !== selectedId && hasUnsavedChanges && !window.confirm('You have unsaved changes on this page. Leave without saving?')) return;
                  if (p) selectPage(p);
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:outline-hidden focus:border-cyan-500"
              >
                {pageEntries.map(p => (
                  <option key={p.id} value={p.id}>
                    /{p.slug} — {p.title} ({p.status})
                  </option>
                ))}
              </select>

              {/* Status Badge */}
              {selectedPage && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedPage.status === 'PUBLISHED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : selectedPage.status === 'APPROVED'
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    : selectedPage.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedPage.status}
                </span>
              )}

              {/* Working Draft Notice */}
              {hasLiveDraftSeparation && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-700">
                  Unpublished Working Draft Active
                </span>
              )}
            </div>

            {/* Center: Undo/Redo & Device Viewport Switches */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                  title="Undo last change"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                  title="Redo"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    device === 'desktop' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop (100% full-width)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    device === 'tablet' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    device === 'mobile' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>
            </div>

            {/* Right: Draft & Publish Action Cluster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleSaveDraft()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                title="Save working draft without altering live published version"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => void handlePublishLive()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                title="Promote working draft to live production site"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Live</span>
              </button>

              {hasLiveDraftSeparation && (
                <button
                  onClick={() => void handleDiscardDraft()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800"
                  title="Discard working draft and revert to live version"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
              )}

              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
                title="View revision history and audit trail"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>History ({revisions.length})</span>
              </button>
            </div>
          </div>

          {hasUnsavedChanges && <p role="status" className="rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">You have unsaved changes. Save them as a draft before leaving this page.</p>}

          {/* 3-Panel Visual Canvas Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_340px] gap-4 items-start">
            {/* PANEL 1: SECTIONS & BLOCKS TREE (LEFT) */}
            <aside className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Section Navigator</span>
                <span className="text-[10px] text-slate-500 font-mono">{sections.length} sections</span>
              </div>

              {/* Add Section Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddSection('top')}
                  className="py-1.5 px-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-[10px] font-bold text-center"
                >
                  + Add Top Section
                </button>
                <button
                  onClick={() => handleAddSection('bottom')}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-center"
                >
                  + Add Bottom Section
                </button>
              </div>

              {/* Section List */}
              <div className="space-y-2">
                {sections.map((sec, idx) => {
                  const isSelected = sec.id === selectedSectionId;
                  return (
                    <div
                      key={sec.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStartSection(idx, e)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={(e) => handleDropSection(idx, e)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500 shadow-sm'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5 shrink-0" title="Drag to reorder section">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSectionId(sec.id);
                            setSelectedBlockId(sec.blocks[0]?.id ?? '');
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">{idx + 1}.</span>
                            <span className="text-xs font-bold text-white truncate block">{sec.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                            <span className="uppercase font-semibold">{sec.placement}</span>
                            <span>•</span>
                            <span>{sec.blocks.length} blocks</span>
                            <span>•</span>
                            <span>{sec.layout.desktopColumns} cols</span>
                          </div>
                        </button>

                        {/* Reorder and Section Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleReorderSection(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move section up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleReorderSection(idx, 1)}
                            disabled={idx === sections.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                            title="Move section down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDuplicateSection(sec)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400"
                            title="Duplicate section"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Delete section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Nested Blocks List within Section */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1 pl-2">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Section Blocks
                          </div>
                          {sec.blocks.map((blk, blkIdx) => {
                            const isBlkSelected = blk.id === selectedBlockId;
                            return (
                              <div
                                key={blk.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStartBlock(sec.id, blkIdx, e)}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => handleDropBlock(sec.id, blkIdx, e)}
                                onClick={() => setSelectedBlockId(blk.id)}
                                className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing ${
                                  isBlkSelected
                                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-800 font-bold'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                <span className="truncate text-[11px] flex items-center gap-1">
                                  <GripVertical className="w-3 h-3 text-slate-600" />
                                  {blkIdx + 1}. <strong className="capitalize">{blockDisplayName(blk.type)}</strong>
                                </span>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReorderBlock(blkIdx, -1);
                                    }}
                                    disabled={blkIdx === 0}
                                    className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                                  >
                                    <ArrowUp className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReorderBlock(blkIdx, 1);
                                    }}
                                    disabled={blkIdx === sec.blocks.length - 1}
                                    className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                                  >
                                    <ArrowDown className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBlock(blk.id);
                                    }}
                                    className="p-0.5 text-slate-500 hover:text-rose-400"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Add Block Dropdown */}
                          <div className="pt-2">
                            <select
                              value=""
                              onChange={e => {
                                if (e.target.value) handleAddBlock(e.target.value as CmsBlockType);
                              }}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-[10px] text-cyan-300 font-semibold"
                            >
                              <option value="">+ Add Block to Section…</option>
                              <optgroup label="Typography & Editorial">
                                <option value="heading">Heading</option>
                                <option value="subheading">Subheading</option>
                                <option value="paragraph">Paragraph</option>
                                <option value="richText">Rich Text</option>
                                <option value="list">Bullet List</option>
                                <option value="quote">Quote / Excerpt</option>
                              </optgroup>
                              <optgroup label="Interactive & CTAs">
                                <option value="button">Call-to-Action Button</option>
                                <option value="link">Editorial Link</option>
                                <option value="document">Document / PDF Download</option>
                              </optgroup>
                              <optgroup label="Media & Showcase">
                                <option value="image">Image Display</option>
                                <option value="video">Video Player</option>
                                <option value="gallery">Photo Gallery</option>
                                <option value="embed">Embed (Video/Map)</option>
                              </optgroup>
                              <optgroup label="Structural Components">
                                <option value="card">Feature Card</option>
                                <option value="stat">Metric / KPI Stat</option>
                                <option value="teamMember">Team Member Profile</option>
                                <option value="testimonial">Testimonial Quote</option>
                                <option value="partnerLogo">Partner Logo</option>
                                <option value="programCard">Program Card</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {sections.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No sections on this page. Click "+ Add Top Section" to create your first content container.
                  </div>
                )}
              </div>
            </aside>

            {/* PANEL 2: RESPONSIVE LIVE CANVAS (CENTER) */}
            <main className="flex flex-col items-center min-w-0">
              <div className="w-full mb-2 flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold">Canvas View: {device.toUpperCase()} ({previewWidth})</span>
                <span className="text-[11px] font-mono">Real-time live component rendering</span>
              </div>

              {/* Viewport Frame */}
              <div
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-4 shadow-2xl transition-all duration-300 min-h-[70vh] overflow-y-auto"
                style={{ maxWidth: previewWidth }}
              >
                {/* Simulated Header Bar */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 rounded-t-xl flex items-center justify-between shadow-2xs mb-4">
                  <span className="font-extrabold text-xs text-slate-900 tracking-tight">SiHub • /{selectedPage?.slug}</span>
                  <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-full">
                    Live Component Preview
                  </span>
                </div>

                {/* Section Renderer */}
                <div className="space-y-6 bg-white rounded-xl shadow-xs overflow-hidden">
                  {sections
                    .filter(s => s.visible && !s.archived)
                    .sort((a, b) => a.order - b.order)
                    .map(sec => (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`cursor-pointer transition-all ${
                          sec.id === selectedSectionId
                            ? 'ring-2 ring-cyan-500 ring-offset-2'
                            : ''
                        }`}
                      >
                        <CmsSectionRenderer section={{ ...sec, visible: true }} />
                      </div>
                    ))}

                  {sections.length === 0 && (
                    <div className="p-16 text-center text-slate-400 space-y-3">
                      <Layers className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">This canvas is currently blank.</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Add a section from the left panel or use the 8-Step Wizard above to populate this page with rich blocks.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* PANEL 3: INSPECTOR & STYLING PROPERTIES (RIGHT) */}
            <aside className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-5 max-h-[82vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Inspector Desk</span>
                <span className="text-[10px] text-slate-500">Live styling</span>
              </div>

              {/* SECTION PROPERTIES */}
              {selectedSection && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Section Configuration: {selectedSection.name}
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Section Name</label>
                    <input
                      value={selectedSection.name}
                      onChange={e => handleUpdateSection(selectedSection.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Placement</label>
                    <select
                      value={selectedSection.placement}
                      onChange={e => handleUpdateSection(selectedSection.id, { placement: e.target.value as 'top' | 'bottom' })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="top">Top (Before main content)</option>
                      <option value="bottom">Bottom (After main content)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Desktop Cols</label>
                      <select
                        value={selectedSection.layout.desktopColumns}
                        onChange={e => handleUpdateSection(selectedSection.id, {
                          layout: { ...selectedSection.layout, desktopColumns: Number(e.target.value) as 1 | 2 | 3 | 4 }
                        })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      >
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} col</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Tablet Cols</label>
                      <select
                        value={selectedSection.layout.tabletColumns}
                        onChange={e => handleUpdateSection(selectedSection.id, {
                          layout: { ...selectedSection.layout, tabletColumns: Number(e.target.value) as 1 | 2 | 3 }
                        })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      >
                        {[1, 2, 3].map(n => <option key={n} value={n}>{n} col</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Mobile Cols</label>
                      <select
                        value={selectedSection.layout.mobileColumns}
                        onChange={e => handleUpdateSection(selectedSection.id, {
                          layout: { ...selectedSection.layout, mobileColumns: Number(e.target.value) as 1 | 2 }
                        })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      >
                        {[1, 2].map(n => <option key={n} value={n}>{n} col</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[9px] text-slate-400">Section width
                      <select value={selectedSection.layout.contentWidth ?? 'contained'} onChange={event => handleUpdateSection(selectedSection.id, { layout: { ...selectedSection.layout, contentWidth: event.target.value as 'contained' | 'wide' | 'full' } })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white">
                        <option value="contained">Contained</option><option value="wide">Wide</option><option value="full">Full width</option>
                      </select>
                    </label>
                    <label className="block text-[9px] text-slate-400">Section border
                      <select value={selectedSection.layout.borderStyle ?? 'none'} onChange={event => handleUpdateSection(selectedSection.id, { layout: { ...selectedSection.layout, borderStyle: event.target.value as 'none' | 'solid' | 'dashed' } })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white">
                        <option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Background</label>
                      <input
                        type="color"
                        value={selectedSection.layout.backgroundColor}
                        onChange={e => handleUpdateSection(selectedSection.id, {
                          layout: { ...selectedSection.layout, backgroundColor: e.target.value }
                        })}
                        className="w-full h-8 rounded border border-slate-700 bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Text Color</label>
                      <input
                        type="color"
                        value={selectedSection.layout.textColor}
                        onChange={e => handleUpdateSection(selectedSection.id, {
                          layout: { ...selectedSection.layout, textColor: e.target.value }
                        })}
                        className="w-full h-8 rounded border border-slate-700 bg-slate-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1">Vertical Padding Spacing</label>
                    <select
                      value={selectedSection.layout.spacing}
                      onChange={e => handleUpdateSection(selectedSection.id, {
                        layout: { ...selectedSection.layout, spacing: e.target.value as 'compact' | 'normal' | 'spacious' }
                      })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                    >
                      <option value="compact">Compact (1.5rem)</option>
                      <option value="normal">Normal (2.5rem)</option>
                      <option value="spacious">Spacious (4.0rem)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* BLOCK PROPERTIES */}
              {selectedBlock && selectedSection && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-cyan-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Block: {blockDisplayName(selectedBlock.type)}
                    </span>
                    <button
                      onClick={() => handleDeleteBlock(selectedBlock.id)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Heading & Subheading & Paragraph text controls */}
                  {(selectedBlock.type === 'heading' || selectedBlock.type === 'subheading' || selectedBlock.type === 'paragraph') && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block">Text Content</label>
                      {selectedBlock.type === 'paragraph' ? (
                        <textarea
                          rows={4}
                          value={selectedBlock.text}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                        />
                      ) : (
                        <input
                          value={selectedBlock.text}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                        />
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Alignment</label>
                          <select
                            value={selectedBlock.alignment ?? 'left'}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { alignment: e.target.value as 'left' | 'center' | 'right' })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Font Size</label>
                          <select
                            value={selectedBlock.fontSize ?? 'base'}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { fontSize: e.target.value as 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          >
                            <option value="sm">Small</option>
                            <option value="base">Normal</option>
                            <option value="lg">Large</option>
                            <option value="xl">XL</option>
                            <option value="2xl">2XL</option>
                            <option value="3xl">3XL</option>
                          </select>
                        </div>
                      </div>

                      {selectedBlock.type === 'heading' && (
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">Heading Level</label>
                          <select
                            value={selectedBlock.level}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { level: Number(e.target.value) as 2 | 3 | 4 })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          >
                            <option value={2}>H2 Primary Heading</option>
                            <option value={3}>H3 Sub-section Heading</option>
                            <option value={4}>H4 Minor Heading</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rich Text Editor */}
                  {selectedBlock.type === 'richText' && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block">Formatted text</label>
                      <div className="flex gap-1">
                        {(['bold', 'italic'] as const).map(style => <button key={style} type="button" onMouseDown={event => event.preventDefault()} onClick={() => {
                          const area = document.getElementById(`rich-text-${selectedBlock.id}`) as HTMLTextAreaElement | null;
                          const text = selectedBlock.text;
                          const start = area?.selectionStart ?? text.length;
                          const end = area?.selectionEnd ?? text.length;
                          const selectedText = text.slice(start, end) || 'text';
                          const marker = style === 'bold' ? '**' : '*';
                          handleUpdateBlock(selectedBlock.id, { text: `${text.slice(0, start)}${marker}${selectedText}${marker}${text.slice(end)}` });
                          window.requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(start + marker.length, start + marker.length + selectedText.length); });
                        }} aria-label={style === 'bold' ? 'Bold selected text' : 'Italicize selected text'} className={`rounded border border-slate-700 px-2.5 py-1 text-xs text-white ${style === 'bold' ? 'font-bold' : 'italic'}`}>{style === 'bold' ? 'B' : 'I'}</button>)}
                      </div>
                      <textarea
                        id={`rich-text-${selectedBlock.id}`}
                        rows={6}
                        value={selectedBlock.text}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { text: e.target.value })}
                        placeholder="Write your text here. Use the buttons to add emphasis."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      />
                    </div>
                  )}

                  {/* List items */}
                  {selectedBlock.type === 'list' && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block">List Items (One per line)</label>
                      <textarea
                        rows={4}
                        value={selectedBlock.items.join('\n')}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { items: e.target.value.split('\n') })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      />
                    </div>
                  )}

                  {/* Button & Link */}
                  {(selectedBlock.type === 'button' || selectedBlock.type === 'link') && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Label Text</label>
                        <input
                          value={selectedBlock.label}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { label: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">URL / Link Target</label>
                        <input
                          value={selectedBlock.url}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { url: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                        />
                      </div>
                      {selectedBlock.type === 'button' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Button Variant</label>
                          <select
                            value={selectedBlock.variant ?? 'primary'}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { variant: e.target.value as 'primary' | 'secondary' | 'outline' })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          >
                            <option value="primary">Primary Brand</option>
                            <option value="secondary">Dark Slate</option>
                            <option value="outline">Outlined</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quote Block */}
                  {selectedBlock.type === 'quote' && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block">Quote Text</label>
                      <textarea
                        rows={3}
                        value={selectedBlock.text}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { text: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white italic"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Author"
                          value={selectedBlock.author ?? ''}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { author: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                        />
                        <input
                          placeholder="Title / Org"
                          value={selectedBlock.title ?? ''}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { title: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image / Video / Gallery Media Selector */}
                  {(selectedBlock.type === 'image' || selectedBlock.type === 'video' || selectedBlock.type === 'gallery' || selectedBlock.type === 'videoGallery') && (
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-400 block">Choose Stored Media</label>
                      <select
                        value=""
                        onChange={e => {
                          const asset = media.find(item => item.id === e.target.value);
                          if (asset) assignLibraryAsset(asset, selectedBlock.id);
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      >
                        <option value="">Select from Media Library…</option>
                        {media.filter(asset => {
                          const wantsVideo = selectedBlock.type === 'video' || selectedBlock.type === 'videoGallery';
                          const wantsImage = selectedBlock.type === 'image' || selectedBlock.type === 'gallery';
                          return (!wantsVideo && !wantsImage) || (wantsVideo ? asset.contentType.startsWith('video/') : asset.contentType.startsWith('image/'));
                        }).map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.originalName} ({asset.contentType})
                          </option>
                        ))}
                      </select>

                      <div>
                        <label className="text-[9px] text-slate-400 block mb-1">Direct Upload to Storage</label>
                        <input
                          type="file"
                          accept={selectedBlock.type === 'video' || selectedBlock.type === 'videoGallery' ? 'video/mp4,video/webm' : selectedBlock.type === 'image' || selectedBlock.type === 'gallery' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,video/mp4,video/webm'}
                          disabled={uploading}
                          onChange={e => {
                            const file = e.currentTarget.files?.[0];
                            if (file) void handleUploadMedia(file, selectedBlock.id);
                            e.currentTarget.value = '';
                          }}
                          className="text-[10px] text-slate-300 w-full"
                        />
                        {uploading && <p className="text-[10px] text-cyan-400 mt-1">Uploading asset…</p>}
                      </div>

                      {(selectedBlock.type === 'gallery' || selectedBlock.type === 'videoGallery') && (
                        <div className="space-y-2">
                          {selectedBlock.items.map((item, index) => <div key={`${item.src}-${index}`} className="flex items-center justify-between gap-2 rounded border border-slate-700 p-2 text-[10px] text-slate-300"><span className="truncate">{item.alt || `Media ${index + 1}`}</span><button type="button" onClick={() => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.filter((_, itemIndex) => itemIndex !== index) })} className="text-rose-300">Remove</button></div>)}
                          {selectedBlock.type === 'videoGallery' && <div className="flex gap-2"><input type="url" value={newVideoGalleryUrl} onChange={event => setNewVideoGalleryUrl(event.target.value)} placeholder="YouTube, Vimeo, or HTTPS video URL" className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><button type="button" onClick={() => addVideoGalleryUrl(selectedBlock.id)} className="rounded border border-cyan-800 px-2 text-[10px] font-semibold text-cyan-300">Add video</button></div>}
                        </div>
                      )}

                      {selectedBlock.type !== 'gallery' && selectedBlock.type !== 'videoGallery' && (
                        <>
                          <input
                            value={selectedBlock.src}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { src: e.target.value })}
                            placeholder="URL or media path"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          />
                          <input
                            value={selectedBlock.alt}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { alt: e.target.value })}
                            placeholder="Alt text"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          />
                          <select
                            value={selectedBlock.aspectRatio ?? '16/9'}
                            onChange={e => handleUpdateBlock(selectedBlock.id, { aspectRatio: e.target.value as 'auto' | '1/1' | '4/3' | '16/9' | '9/16' })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                          >
                            <option value="16/9">16:9 Landscape</option>
                            <option value="4/3">4:3 Standard</option>
                            <option value="1/1">1:1 Square</option>
                            <option value="9/16">9:16 Vertical</option>
                            <option value="auto">Auto</option>
                          </select>
                        </>
                      )}
                    </div>
                  )}

                  {/* Feature Card Properties */}
                  {selectedBlock.type === 'card' && (
                    <div className="space-y-2">
                      <input
                        placeholder="Card Title"
                        value={selectedBlock.title}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { title: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <textarea
                        rows={3}
                        placeholder="Description"
                        value={selectedBlock.description}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { description: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Badge label"
                        value={selectedBlock.badge ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { badge: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Link URL"
                        value={selectedBlock.url ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { url: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {/* Stat KPI Properties */}
                  {selectedBlock.type === 'stat' && (
                    <div className="space-y-2">
                      <input
                        placeholder="Value (e.g. 1,400+)"
                        value={selectedBlock.value}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { value: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white font-mono font-bold"
                      />
                      <input
                        placeholder="Label"
                        value={selectedBlock.label}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { label: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Description"
                        value={selectedBlock.description ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { description: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Change badge (e.g. +45% YoY)"
                        value={selectedBlock.change ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { change: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {/* Team Member Properties */}
                  {selectedBlock.type === 'teamMember' && (
                    <div className="space-y-2">
                      <input
                        placeholder="Full Name"
                        value={selectedBlock.name}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Role / Title"
                        value={selectedBlock.role}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { role: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Location (e.g. Mogadishu HQ)"
                        value={selectedBlock.location ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { location: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <textarea
                        rows={2}
                        placeholder="Short Bio"
                        value={selectedBlock.bio ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { bio: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {/* Testimonial Properties */}
                  {selectedBlock.type === 'testimonial' && (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Testimonial Quote"
                        value={selectedBlock.quote}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { quote: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white italic"
                      />
                      <input
                        placeholder="Author"
                        value={selectedBlock.author}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { author: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Organization"
                        value={selectedBlock.organization ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { organization: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {selectedBlock.type === 'faq' && <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400">Questions and answers</h4>
                    {selectedBlock.items.map((item, index) => <div key={index} className="space-y-2 rounded-lg border border-slate-700 p-2.5">
                      <input aria-label={`Question ${index + 1}`} placeholder="Question" value={item.question} onChange={event => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.map((current, currentIndex) => currentIndex === index ? { ...current, question: event.target.value } : current) })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />
                      <textarea aria-label={`Answer ${index + 1}`} placeholder="Answer" rows={3} value={item.answer} onChange={event => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.map((current, currentIndex) => currentIndex === index ? { ...current, answer: event.target.value } : current) })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />
                      <button type="button" onClick={() => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.filter((_, itemIndex) => itemIndex !== index) })} className="text-[10px] font-semibold text-rose-300">Remove question</button>
                    </div>)}
                    <button type="button" onClick={() => handleUpdateBlock(selectedBlock.id, { items: [...selectedBlock.items, { question: '', answer: '' }] })} className="rounded border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200">Add question</button>
                  </div>}

                  {selectedBlock.type === 'timeline' && <div className="space-y-3">
                    <label className="block text-[10px] text-slate-400">Display style<select value={selectedBlock.orientation ?? 'vertical'} onChange={event => handleUpdateBlock(selectedBlock.id, { orientation: event.target.value as 'vertical' | 'horizontal' })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="vertical">Vertical</option><option value="horizontal">Horizontal cards</option></select></label>
                    {selectedBlock.items.map((item, index) => <div key={index} className="space-y-2 rounded-lg border border-slate-700 p-2.5">
                      <input aria-label={`Timeline date ${index + 1}`} placeholder="Date or year" value={item.date} onChange={event => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.map((current, currentIndex) => currentIndex === index ? { ...current, date: event.target.value } : current) })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />
                      <input aria-label={`Timeline milestone ${index + 1}`} placeholder="Milestone title" value={item.title} onChange={event => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.map((current, currentIndex) => currentIndex === index ? { ...current, title: event.target.value } : current) })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />
                      <textarea aria-label={`Timeline description ${index + 1}`} placeholder="Description" rows={2} value={item.description ?? ''} onChange={event => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.map((current, currentIndex) => currentIndex === index ? { ...current, description: event.target.value } : current) })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />
                      <button type="button" onClick={() => handleUpdateBlock(selectedBlock.id, { items: selectedBlock.items.filter((_, itemIndex) => itemIndex !== index) })} className="text-[10px] font-semibold text-rose-300">Remove milestone</button>
                    </div>)}
                    <button type="button" onClick={() => handleUpdateBlock(selectedBlock.id, { items: [...selectedBlock.items, { date: '', title: '', description: '' }] })} className="rounded border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200">Add milestone</button>
                  </div>}

                  {selectedBlock.type === 'eventCard' && <div className="space-y-2">
                    {(['title', 'date', 'time', 'venue', 'url', 'image', 'imageAlt'] as const).map(field => <label key={field} className="block text-[10px] capitalize text-slate-400">{field === 'url' ? 'Details link' : field === 'imageAlt' ? 'Image description' : field}<input value={selectedBlock[field] ?? ''} onChange={event => handleUpdateBlock(selectedBlock.id, { [field]: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /></label>)}
                    <label className="block text-[10px] text-slate-400">Event description<textarea rows={3} value={selectedBlock.description ?? ''} onChange={event => handleUpdateBlock(selectedBlock.id, { description: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /></label>
                  </div>}

                  {selectedBlock.type === 'newsCard' && <div className="space-y-2">
                    {(['title', 'publishedAt', 'category', 'url', 'image', 'imageAlt'] as const).map(field => <label key={field} className="block text-[10px] capitalize text-slate-400">{field === 'url' ? 'Story link' : field === 'imageAlt' ? 'Image description' : field}<input value={selectedBlock[field] ?? ''} onChange={event => handleUpdateBlock(selectedBlock.id, { [field]: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /></label>)}
                    <label className="block text-[10px] text-slate-400">Story summary<textarea rows={3} value={selectedBlock.summary ?? ''} onChange={event => handleUpdateBlock(selectedBlock.id, { summary: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /></label>
                  </div>}

                  {/* Document Download Properties */}
                  {selectedBlock.type === 'document' && (
                    <div className="space-y-2">
                      <input
                        placeholder="Document Title"
                        value={selectedBlock.title}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { title: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="Description"
                        value={selectedBlock.description ?? ''}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { description: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <input
                        placeholder="File URL or path"
                        value={selectedBlock.fileUrl}
                        onChange={e => handleUpdateBlock(selectedBlock.id, { fileUrl: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="File size (e.g. 2.4 MB)"
                          value={selectedBlock.fileSize ?? ''}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { fileSize: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                        />
                        <input
                          placeholder="Format (e.g. PDF)"
                          value={selectedBlock.format ?? 'PDF'}
                          onChange={e => handleUpdateBlock(selectedBlock.id, { format: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedBlock && (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Click on any block or section in the canvas or navigator to inspect and customize its live styles.
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA 2: CMS OVERVIEW                                                     */}
      {/* ========================================================================= */}
      {activeArea === 'overview' && (
        <CMSOverviewArea
          entries={entries}
          media={media}
          navCategoriesCount={navItems.length}
          onNavigateToArea={(area) => setActiveArea(area as any)}
          onOpenNewPageModal={() => setIsNewPageModalOpen(true)}
          onSelectPage={(p) => {
            selectPage(p as unknown as CmsEntry);
            setActiveArea('studio');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 3: PAGES MANAGER                                                    */}
      {/* ========================================================================= */}
      {activeArea === 'pages' && (
        <PagesManagerArea
          entries={entries}
          onSelectPage={(p) => {
            selectPage(p as unknown as CmsEntry);
            setActiveArea('studio');
          }}
          onOpenStudio={() => setActiveArea('studio')}
          onOpenNewPageModal={() => setIsNewPageModalOpen(true)}
          onDuplicatePage={async (p) => {
            selectPage(p as unknown as CmsEntry);
            await duplicateCurrentPage();
          }}
          onDeletePage={async (id) => {
            if (!window.confirm('Delete this page? It can be restored within 30 days.')) return;
            try {
              await apiDelete(`/api/cms/admin/${encodeURIComponent(id)}`);
              setEntries(prev => prev.filter(e => e.id !== id));
              addToast('success', 'Page Deleted', 'Page moved to trash.');
            } catch (err) {
              addToast('error', 'Delete Failed', err instanceof ApiError ? err.message : 'Unknown error');
            }
          }}
          onRestorePage={async (id) => {
            try {
              const res = await apiPost<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(id)}/restore`);
              setEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
              addToast('success', 'Page Restored', 'Page restored from trash.');
            } catch (err) {
              addToast('error', 'Restore Failed', err instanceof ApiError ? err.message : 'Unknown error');
            }
          }}
          onUpdateStatus={async (id, status) => {
            try {
              const res = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(id)}/status`, { status });
              setEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
              addToast('info', 'Status Updated', `Status changed to ${status}.`);
            } catch (err) {
              addToast('error', 'Status Update Failed', err instanceof ApiError ? err.message : 'Unknown error');
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 4: NAVIGATION MANAGER                                               */}
      {/* ========================================================================= */}
      {activeArea === 'navigation' && (
        <NavigationManagerArea
          navItems={navItems}
          setNavItems={setNavItems}
          availablePageSlugs={pageEntries.map(p => p.slug)}
          addToast={addToast}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 5: SECTIONS & CONTENT BLOCKS CATALOG                                 */}
      {/* ========================================================================= */}
      {activeArea === 'sections' && (
        <SectionBlocksCatalogArea
          onInsertBlock={(type) => {
            handleAddBlock(type);
            setActiveArea('studio');
            addToast('success', 'Block Inserted', `Block of type "${type}" added to current section.`);
          }}
          onOpenStudio={() => setActiveArea('studio')}
          selectedPageSlug={slug}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 6: MEDIA LIBRARY                                                    */}
      {/* ========================================================================= */}
      {activeArea === 'media' && (
        <MediaLibraryArea
          onSelectAsset={(_url, asset) => {
            if (selectedBlockId) {
              assignLibraryAsset(asset, selectedBlockId);
            }
            setActiveArea('studio');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 7: PAGE TEMPLATES                                                   */}
      {/* ========================================================================= */}
      {activeArea === 'templates' && (
        <TemplatesArea
          onApplyTemplateToPage={(tpl) => {
            setSectionsWithHistory(prev => [
              ...prev,
              ...tpl.sections.map((s, idx) => ({
                ...s,
                id: createId(),
                order: prev.length + idx,
                blocks: s.blocks.map(b => ({ ...b, id: createId() }))
              }))
            ]);
            setActiveArea('studio');
            addToast('success', 'Template Applied', `Sections from "${tpl.name}" loaded into page.`);
          }}
          onCreatePageFromTemplate={(tpl, targetSlug, targetTitle) => {
            void createPageWithTemplate(tpl, targetSlug, targetTitle);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 8: DESIGN & BRAND STYLING                                           */}
      {/* ========================================================================= */}
      {activeArea === 'styling' && (
        <DesignStylingArea />
      )}

      {/* ========================================================================= */}
      {/* AREA 9: DRAFTS & PUBLISHING                                              */}
      {/* ========================================================================= */}
      {activeArea === 'publishing' && (
        <DraftsPublishingArea
          onOpenPageInStudio={(pageSlug) => selectPageBySlug(pageSlug)}
        />
      )}

      {/* ========================================================================= */}
      {/* AREA 10: REVISION HISTORY & ROLLBACK                                     */}
      {/* ========================================================================= */}
      {activeArea === 'revisions' && (
        <RevisionHistoryArea />
      )}

      {/* ========================================================================= */}
      {/* AREA 11: SEO & WEBSITE SETTINGS                                          */}
      {/* ========================================================================= */}
      {activeArea === 'settings' && (
        <SEOSettingsArea />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UNIVERSAL CONTENT CREATION WIZARD (8-Step Workflow)             */}
      {/* ========================================================================= */}
      {isWizardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white space-y-6 shadow-2xl animate-in zoom-in-95 my-8">
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Universal Content Workflow • Step {wizardStep} of 8
                </span>
                <h3 className="text-lg font-bold">
                  {wizardStep === 1 && 'Step 1: Choose Main Navigation Category'}
                  {wizardStep === 2 && 'Step 2: Choose or Define Subsection'}
                  {wizardStep === 3 && 'Step 3: Choose Destination Page'}
                  {wizardStep === 4 && 'Step 4: Select Content Block Type'}
                  {wizardStep === 5 && 'Step 5: Customize Content & Editorial'}
                  {wizardStep === 6 && 'Step 6: Placement & Ordering'}
                  {wizardStep === 7 && 'Step 7: Live Preview'}
                  {wizardStep === 8 && 'Step 8: Save Draft or Publish'}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Main Category */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Select which primary SiHub pillar this content belongs to:</p>
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setWizardCategory(cat.label)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        wizardCategory === cat.label
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Subsection */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Choose an existing subsection or create a new one under <strong>{wizardCategory}</strong>:</p>
                <div className="space-y-2">
                  {navItems.find(c => c.label === wizardCategory)?.subItems?.map(sub => (
                    <button
                      key={sub.key}
                      onClick={() => {
                        setWizardSubsection(sub.label);
                        setWizardCustomSub('');
                      }}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        wizardSubsection === sub.label && !wizardCustomSub
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {sub.desc && <span className="text-[10px] opacity-75">{sub.desc}</span>}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="text-xs text-slate-400 block mb-1">Or define a new subsection:</label>
                  <input
                    placeholder="e.g. AgriTech Laboratory & Seed Fund"
                    value={wizardCustomSub}
                    onChange={e => {
                      setWizardCustomSub(e.target.value);
                      setWizardSubsection(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Destination Page */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Where should this content section be anchored?</p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {pageEntries.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setWizardPageSlug(p.slug)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        wizardPageSlug === p.slug
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{p.title}</div>
                      <div className="text-[10px] opacity-75">/{p.slug}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Block Type */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Select the visual component layout for this section:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'card', label: 'Feature Cards Grid', desc: 'Prominent highlight blocks' },
                    { type: 'stat', label: 'Metric Stats Row', desc: 'KPI figures with tabular nums' },
                    { type: 'programCard', label: 'Cohort Residency Card', desc: 'Residency with application CTA' },
                    { type: 'teamMember', label: 'Steward Profiles', desc: 'Team & mentorship profiles' },
                    { type: 'testimonial', label: 'Founder Testimonials', desc: 'Impact quote showcases' },
                    { type: 'image', label: 'Photographic Showcase', desc: 'High-res image banner' },
                    { type: 'video', label: 'Video Showcase', desc: 'Embedded stream or MP4' },
                    { type: 'gallery', label: 'Photo Gallery', desc: 'Multi-image grid' },
                    { type: 'document', label: 'Document Downloads', desc: 'PDF and report attachments' }
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => setWizardBlockType(item.type as CmsBlockType)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        wizardBlockType === item.type
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Customize Content */}
            {wizardStep === 5 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Section Title</label>
                  <input
                    value={wizardHeading}
                    onChange={e => setWizardHeading(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Editorial Description</label>
                  <textarea
                    rows={4}
                    value={wizardBody}
                    onChange={e => setWizardBody(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Placement & Ordering */}
            {wizardStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Section Position on Page</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWizardPlacement('top')}
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        wizardPlacement === 'top'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Top Placement (Before existing content)
                    </button>
                    <button
                      onClick={() => setWizardPlacement('bottom')}
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        wizardPlacement === 'bottom'
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Bottom Placement (After existing content)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-2">Grid Desktop Columns</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(c => (
                      <button
                        key={c}
                        onClick={() => setWizardCols(c as 1 | 2 | 3 | 4)}
                        className={`p-2.5 rounded-xl border text-xs font-bold ${
                          wizardCols === c
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {c} Column{c > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Live Preview */}
            {wizardStep === 7 && (
              <div className="space-y-3">
                <span className="text-xs text-slate-400 block">Previewing section before committing:</span>
                <div className="p-4 rounded-2xl bg-white text-slate-900 shadow-md">
                  <h3 className="text-xl font-bold">{wizardHeading}</h3>
                  <p className="text-xs text-slate-600 mt-1">{wizardBody}</p>
                </div>
              </div>
            )}

            {/* Step 8: Save Draft or Publish Immediately */}
            {wizardStep === 8 && (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold">Section Configured & Validated</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ready to deploy to <strong>/{wizardPageSlug}</strong>. Choose whether to save as a working draft or publish live immediately.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => void handleWizardSubmit(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
                  >
                    Save as Working Draft
                  </button>
                  <button
                    onClick={() => void handleWizardSubmit(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                  >
                    Publish Live Now
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => setWizardStep(s => Math.max(1, s - 1))}
                disabled={wizardStep === 1}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-30"
              >
                Back
              </button>

              {wizardStep < 8 && (
                <button
                  onClick={() => setWizardStep(s => Math.min(8, s + 1))}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW PAGE MODAL                                                   */}
      {/* ========================================================================= */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreatePage} className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Institutional Page</h3>
              <button type="button" onClick={() => setIsNewPageModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Page Title</label>
              <input
                required
                value={newPageTitle}
                onChange={e => {
                  setNewPageTitle(e.target.value);
                  setNewPageSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                }}
                placeholder="e.g. AgriTech Lab"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">URL Slug</label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                <span>https://sihub.so/</span>
                <input
                  required
                  value={newPageSlug}
                  onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  className="bg-transparent text-white focus:outline-hidden font-mono flex-1 ml-0.5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Summary / SEO Description</label>
              <textarea
                rows={3}
                value={newPageSummary}
                onChange={e => setNewPageSummary(e.target.value)}
                placeholder="Brief summary of the page mandate..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewPageModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Create Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVISION HISTORY MODAL                                          */}
      {/* ========================================================================= */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Revision History & Audit Trail</h3>
                <p className="text-xs text-slate-400">/{selectedPage?.slug} — Historical Snapshots</p>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {revisions.map(rev => (
                <div key={rev.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white block">Revision #{rev.revisionNumber}: {rev.title}</span>
                    <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleString()} · {rev.status}</span>
                  </div>
                  <button
                    onClick={() => void handleRestoreRevision(rev.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold"
                  >
                    Restore as Draft
                  </button>
                </div>
              ))}
              {revisions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No historical revisions recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
