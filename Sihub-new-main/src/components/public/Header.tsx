/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Official Public Navigation Header
 * Strictly displays the 8 approved primary navigation categories with official dropdown submenus,
 * plus a dedicated, isolated "Portal Access" section containing Learner Portal, Startup Portal,
 * and Partner Portal. Admin and internal Education Portal are strictly isolated from public navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { appViewForPath } from '../../utils/appRouting';
import { BrandLogo } from '../common/BrandLogo';
import { useCmsPage } from '../../hooks/useCmsPage';
import { apiGet } from '../../services/apiClient';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Rocket,
  Handshake,
  Globe,
  Layers,
  CheckCircle2,
  Calendar,
  Users
} from 'lucide-react';

export interface SubMenuItem {
  key: string;
  label: string;
  view?: AppView;
  url?: string;
  anchor?: string;
  query?: Record<string, string>;
  desc?: string;
  visible?: boolean;
  subItems?: SubMenuItem[];
}

export interface NavCategoryItem {
  key: string;
  label: string;
  view?: AppView;
  url?: string;
  isImpact?: boolean;
  subItems?: SubMenuItem[];
  visible?: boolean;
}

const DesktopNavigationNode: React.FC<{ item: SubMenuItem; onNavigate: (item: SubMenuItem) => void; depth?: number }> = ({ item, onNavigate, depth = 0 }) => {
  const [open, setOpen] = useState(false);
  const children = (item.subItems ?? []).filter(child => child.visible !== false);
  return <div className="relative" onMouseEnter={() => children.length > 0 && setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <div className="flex items-center rounded-lg hover:bg-cyan-50">
      <button type="button" onClick={() => onNavigate(item)} className="min-w-0 flex-1 p-2 text-left text-xs font-semibold text-slate-800 hover:text-cyan-700">{item.label}</button>
      {children.length > 0 && <button type="button" aria-label={`${open ? 'Close' : 'Open'} ${item.label} submenu`} aria-expanded={open} onKeyDown={event => { if (event.key === 'ArrowRight') setOpen(true); }} onClick={() => setOpen(value => !value)} className="p-2 text-slate-400 hover:text-cyan-700"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} /></button>}
    </div>
    {open && children.length > 0 && <div className={`absolute top-0 z-[80] w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${depth === 0 ? 'left-full' : 'left-full'}`}>{children.map(child => <DesktopNavigationNode key={child.key} item={child} onNavigate={onNavigate} depth={depth + 1} />)}</div>}
  </div>;
};

const MobileNavigationNode: React.FC<{ item: SubMenuItem; onNavigate: (item: SubMenuItem) => void; depth?: number }> = ({ item, onNavigate, depth = 0 }) => {
  const [open, setOpen] = useState(false);
  const children = (item.subItems ?? []).filter(child => child.visible !== false);
  return <div className="space-y-1">
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onNavigate(item)} className="min-h-10 min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-white"><span className="block">{item.label}</span>{item.desc && <span className="mt-0.5 block truncate text-[10px] font-normal text-slate-500">{item.desc}</span>}</button>
      {children.length > 0 && <button type="button" aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`} aria-expanded={open} onClick={() => setOpen(value => !value)} className="min-h-10 min-w-10 rounded-lg text-slate-500 hover:bg-white"><ChevronDown className={`mx-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>}
    </div>
    {open && children.length > 0 && <div className="space-y-1 border-l border-slate-200 pl-2">{children.map(child => <MobileNavigationNode key={child.key} item={child} onNavigate={onNavigate} depth={depth + 1} />)}</div>}
  </div>;
};

export const Header: React.FC = () => {
  const {
    currentView,
    navigateTo,
    setCurrentView,
    language,
    setLanguage,
  } = useApp();
  const { page: cmsNavigation } = useCmsPage('header');
  const navLabels = (cmsNavigation?.labels && typeof cmsNavigation.labels === 'object' ? cmsNavigation.labels : {}) as Record<string, string>;
  const navDescriptions = (cmsNavigation?.descriptions && typeof cmsNavigation.descriptions === 'object' ? cmsNavigation.descriptions : {}) as Record<string, string>;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState<string | null>(null);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<NavCategoryItem[] | null>(null);

  useEffect(() => {
    const fetchNav = () => {
      apiGet<{ categories: NavCategoryItem[] }>('/api/cms/navigation')
        .then(res => {
          if (res.categories && res.categories.length > 0) {
            setDbCategories(res.categories);
          }
        })
        .catch(() => {});
    };
    fetchNav();
    window.addEventListener('sihub-cms-update', fetchNav);
    return () => window.removeEventListener('sihub-cms-update', fetchNav);
  }, []);

  const navContainerRef = useRef<HTMLElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node) &&
        portalDropdownRef.current &&
        !portalDropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDesktopDropdown(null);
        setPortalDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDesktopDropdown(null);
        setPortalDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // The 8 Official Primary Public Navigation Categories & Submenus
  const officialNavCategories: NavCategoryItem[] = [
    {
      key: 'home',
      label: 'Home',
      view: 'home'
    },
    {
      key: 'about',
      label: 'About SiHub',
      view: 'about',
      subItems: [
        { key: 'who-we-are', label: 'Who We Are', view: 'about', anchor: 'who-we-are', desc: 'Parent ecosystem mandate & strategic identity' },
        { key: 'vision-mission', label: 'Vision & Mission', view: 'about', anchor: 'vision-mission', desc: 'Leading center for grassroots social innovation' },
        { key: 'our-team', label: 'Our Team', view: 'about', anchor: 'our-team', desc: 'Executive leadership & ecosystem stewards' }
      ]
    },
    {
      key: 'programmes',
      label: 'Our Programmes',
      view: 'programs',
      subItems: [
        { key: 'digital-skills', label: 'Digital Skills Development', view: 'programs', query: { track: 'digital-skills' }, desc: 'High-impact technology & workforce tracks' },
        { key: 'youth-empowerment', label: 'Youth Empowerment', view: 'programs', query: { track: 'youth-empowerment' }, desc: 'Leadership, capacity building & pathways' },
        { key: 'social-innovation', label: 'Social Innovation', view: 'programs', query: { track: 'social-innovation' }, desc: 'Grassroots community problem-solving' },
        { key: 'women-innovation', label: 'Women in Innovation', view: 'programs', query: { track: 'women-in-innovation' }, desc: 'Gender-inclusive tech & entrepreneurship' },
        { key: 'inclusive-digital', label: 'Inclusive Digital Inclusion', view: 'programs', query: { track: 'inclusive-digital' }, desc: 'Equitable access for all regions & backgrounds' },
        { key: 'green-sustainability', label: 'Green Innovation & Sustainability', view: 'programs', query: { track: 'green-sustainability' }, desc: 'Climate resilience, clean energy & AgriTech' },
        { key: 'youth-peace', label: 'Youth Peace Innovation', view: 'programs', query: { track: 'youth-peace' }, desc: 'Community cohesion & peacebuilding solutions' },
        { key: 'community-dev', label: 'Community Development', view: 'programs', query: { track: 'community-development' }, desc: 'Grassroots civic transformation initiatives' }
      ]
    },
    {
      key: 'startups',
      label: 'Entrepreneurship & Startups',
      view: 'startups',
      subItems: [
        { key: 'incubation', label: 'Startup Incubation', view: 'startups', desc: 'Seed funding, co-working & structured acceleration' },
        { key: 'directory', label: 'Startup Directory', view: 'startups', anchor: 'directory', desc: 'Search venture profiles and founder directory' },
        { key: 'entrepreneurs', label: 'Entrepreneurs', view: 'startups', desc: 'Featured Somali founders & active portfolio' },
        { key: 'youth-mentorship', label: 'Youth Mentorship', view: 'mentorship', desc: '1-on-1 guidance from diaspora & industry leaders' },
        { key: 'startup-support', label: 'Startup Support', view: 'startups', desc: 'Legal sandboxes, prototyping labs & investor readiness' }
      ]
    },
    {
      key: 'institute',
      label: 'SiHub Institute',
      view: 'courses',
      subItems: [
        { key: 'digital-skills-academy', label: 'Digital Skills Academy', view: 'courses', query: { category: 'technology-software' }, desc: 'Software engineering, cloud & modern tech' },
        { key: 'professional-training', label: 'Professional Training', view: 'courses', query: { category: 'digital-entrepreneurship' }, desc: 'Executive masterclasses & industry diplomas' },
        { key: 'ai-emerging', label: 'AI & Emerging Technologies', view: 'courses', query: { category: 'data-ai' }, desc: 'Machine learning, IoT & generative AI' },
        { key: 'research-innovation', label: 'Research & Innovation', view: 'innovation', desc: 'Applied R&D labs & academic publications' },
        { key: 'certification', label: 'Certification', view: 'courses', anchor: 'certification', desc: 'Public learning pathways and completion records' }
      ]
    },
    {
      key: 'events-media',
      label: 'Events & Media',
      view: 'events',
      subItems: [
        { key: 'sitalks', label: 'SiHub Talks (SiTalks)', view: 'events', query: { type: 'conference' }, desc: 'Thought leadership panels & keynote sessions' },
        { key: 'summit', label: 'Somali Innovation Summit', view: 'events', query: { type: 'summit' }, desc: 'Annual flagship Horn of Africa gathering' },
        { key: 'expo', label: 'SiHub Expo', view: 'events', query: { type: 'demoday' }, desc: 'Showcase of homegrown innovations & prototypes' },
        { key: 'news-stories', label: 'News & Stories', view: 'news', desc: 'Ecosystem updates, milestones & press releases' },
        { key: 'media-gallery', label: 'Media Gallery', view: 'media_gallery', url: '/media', desc: 'Event photos, video archives & highlights' }
      ]
    },
    {
      key: 'impact',
      label: 'Our Impact',
      view: 'impact',
      isImpact: true,
      subItems: [
        { key: 'success-stories', label: 'Success Stories', view: 'impact', anchor: 'our-impact', desc: 'Inspiring founder journeys & community impact' },
        { key: 'projects-achievements', label: 'Projects & Achievements', view: 'innovation', desc: 'Tangible milestones delivered across Somalia' },
        { key: 'annual-reports', label: 'Annual Reports', view: 'news', desc: 'Audited impact assessments & publications' },
        { key: 'community-impact', label: 'Community Impact', view: 'community', desc: 'Outreach metrics across 4 regional hub stations' }
      ]
    },
    {
      key: 'partnerships',
      label: 'Partnerships',
      view: 'partnerships',
      subItems: [
        { key: 'become-partner', label: 'Become a Partner', view: 'partnerships', anchor: 'become-partner', desc: 'Join as an academic, corporate, or civic ally' },
        { key: 'donors-supporters', label: 'Donors & Supporters', view: 'partnerships', anchor: 'donors', desc: 'Multilateral agencies, foundations & diaspora' },
        { key: 'collaboration-opportunities', label: 'Collaboration Opportunities', view: 'opportunities', desc: 'Joint funding calls, pilot projects & research' }
      ]
    }
  ];

  // Dedicated Portal Access Section (Strictly Isolated from Admin and Internal Education Portal)
  const portalAccessItems = [
    {
      key: 'learner_portal',
      label: 'Learner Portal',
      view: 'learner_portal' as AppView,
      desc: 'Enrolled student courses, learning progress & certificates',
      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
      badge: 'Student LMS'
    },
    {
      key: 'startup_portal',
      label: 'Startup Portal',
      view: 'startup_portal' as AppView,
      desc: 'Founder accelerator dashboard, milestones & pitches',
      icon: <Rocket className="w-4 h-4 text-cyan-600" />,
      badge: 'Incubation'
    },
    {
      key: 'partner_portal',
      label: 'Partner Portal',
      view: 'partner_portal' as AppView,
      desc: 'Donor & partner impact tracking, proposals & reports',
      icon: <Handshake className="w-4 h-4 text-indigo-600" />,
      badge: 'Ecosystem'
    }
  ];
  const baseCategories = dbCategories && dbCategories.length > 0 ? dbCategories : officialNavCategories;
  const managedNavCategories = baseCategories.filter(category => category.key !== 'portal-access' && category.visible !== false).map(category => ({
    ...category,
    label: navLabels[category.key] ?? category.label,
    subItems: category.subItems?.filter(item => item.visible !== false).map(item => ({
      ...item,
      label: navLabels[item.key] ?? item.label,
      desc: navDescriptions[item.key] ?? item.desc
    }))
  }));
  const managedPortalItems = portalAccessItems.map(portal => ({ ...portal, label: navLabels[portal.key] ?? portal.label }));

  const handleNavigateWithAnchor = (view: AppView = 'home', anchorId?: string, query?: Record<string, string>, destinationUrl?: string) => {
    let destination: URL | null = null;
    if (destinationUrl) {
      try {
        destination = new URL(destinationUrl, window.location.origin);
      } catch {
        destination = null;
      }
      if (!destination || !['http:', 'https:'].includes(destination.protocol)) return;
      if (destination.origin !== window.location.origin) {
        window.location.assign(destination.href);
        setActiveDesktopDropdown(null);
        setPortalDropdownOpen(false);
        setMobileMenuOpen(false);
        return;
      }
      const destinationView = appViewForPath(destination.pathname);
      if (!destinationView) {
        window.location.assign(destination.href);
        return;
      }
      if (destinationView === 'cms_page') {
        window.history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
        setCurrentView('cms_page');
      } else {
        navigateTo(destinationView);
        window.history.replaceState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
      }
      view = destinationView;
      anchorId = anchorId ?? destination.hash.slice(1);
    } else if (currentView !== view) {
      navigateTo(view);
    }

    const params = new URLSearchParams(destination?.search ?? window.location.search);
    Object.entries(query ?? {}).forEach(([key, value]) => params.set(key, value));
    const path = destination?.pathname ?? window.location.pathname;
    const hash = destination?.hash ?? (anchorId ? `#${anchorId}` : '');
    if (query || destination) window.history.replaceState({}, '', `${path}${params.size ? `?${params}` : ''}${hash}`);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 140);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveDesktopDropdown(null);
    setPortalDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleCategoryClick = (cat: NavCategoryItem) => {
    handleNavigateWithAnchor(cat.view ?? 'home', cat.isImpact ? 'our-impact' : undefined, undefined, cat.url);
  };

  const handleSubItemNavigate = (item: SubMenuItem) => handleNavigateWithAnchor(item.view, item.anchor, item.query, item.url);

  const isPortalActive =
    currentView === 'learner_portal' ||
    currentView === 'startup_portal' ||
    currentView === 'partner_portal';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 2xl:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <BrandLogo
                size="md"
                showSubtitle={true}
                onClick={() => handleNavigateWithAnchor('home')}
              />
            </div>

            {/* Desktop Navigation: 8 Primary Categories with Submenus */}
            <nav ref={navContainerRef} className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-0">
              {managedNavCategories.map(cat => {
                const isActive = cat.view ? currentView === cat.view : false;
                const hasSub = Boolean(cat.subItems?.some(item => item.visible !== false));
                const isDropdownOpen = activeDesktopDropdown === cat.key;

                return (
                  <div
                    key={cat.key}
                    className="relative shrink-0"
                    onMouseEnter={() => hasSub && setActiveDesktopDropdown(cat.key)}
                    onMouseLeave={() => hasSub && setActiveDesktopDropdown(null)}
                    onKeyDown={event => {
                      if (event.key === 'Escape') setActiveDesktopDropdown(null);
                    }}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => handleCategoryClick(cat)}
                        className={`relative px-1.5 2xl:px-2 py-2 rounded-lg text-[11px] 2xl:text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                        isActive || isDropdownOpen
                          ? 'text-cyan-600 bg-cyan-50/80 font-bold'
                          : 'text-slate-700 hover:text-cyan-600 hover:bg-slate-50'
                      }`}
                      >
                        <span>{cat.label}</span>
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-600 rounded-full" />
                        )}
                      </button>
                      {hasSub && (
                        <button
                          type="button"
                          aria-label={`${isDropdownOpen ? 'Close' : 'Open'} ${cat.label} submenu`}
                          aria-haspopup="true"
                          aria-expanded={isDropdownOpen}
                          aria-controls={`nav-submenu-${cat.key}`}
                          onKeyDown={event => {
                            if (event.key === 'ArrowDown') {
                              event.preventDefault();
                              setActiveDesktopDropdown(cat.key);
                            }
                          }}
                          onClick={() => setActiveDesktopDropdown(isDropdownOpen ? null : cat.key)}
                          className="px-1.5 py-2 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-cyan-600' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Desktop Submenu Dropdown */}
                    {hasSub && isDropdownOpen && (
                      <div id={`nav-submenu-${cat.key}`} className={`absolute top-full w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-[70] animate-in fade-in zoom-in-95 ${managedNavCategories.indexOf(cat) >= 5 ? 'right-0' : 'left-0'}`}>
                        <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                          {cat.label}
                        </div>
                        <div className="px-2 space-y-0.5 max-h-96 overflow-y-auto">
                          {cat.subItems?.filter(sub => sub.visible !== false).map(sub => <DesktopNavigationNode key={sub.key} item={sub} onNavigate={handleSubItemNavigate} />)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Subtle Divider before Dedicated Portal Access */}
              <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

              {/* Dedicated Portal Access Section (Learner, Startup, Partner) */}
              <div className="relative shrink-0" ref={portalDropdownRef}>
                <button
                  onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
                    portalDropdownOpen || isPortalActive
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:text-cyan-700 hover:bg-cyan-50/60 border-slate-200'
                  }`}
                  aria-expanded={portalDropdownOpen}
                  title="Access Dedicated Ecosystem Portals"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Portal Access</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      portalDropdownOpen ? 'rotate-180' : 'opacity-70'
                    }`}
                  />
                </button>

                {portalDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-[70] animate-in fade-in zoom-in-95">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Ecosystem Portals
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                        Secure Preview
                      </span>
                    </div>

                    <div className="px-2 pt-2 space-y-1.5">
                      {managedPortalItems.map(portal => {
                        const isActive = currentView === portal.view;
                        return (
                          <button
                            key={portal.key}
                            onClick={() => handleNavigateWithAnchor(portal.view)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between group ${
                              isActive
                                ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-200/80'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors shrink-0">
                                {portal.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 group-hover:text-cyan-700 truncate">
                                    {portal.label}
                                  </span>
                                  <span className="text-[9px] font-semibold text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-100">
                                    {portal.badge}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate group-hover:text-cyan-600/80">
                                  {portal.desc}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-600 shrink-0 ml-2" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Right Utilities */}
            <div className="hidden xl:flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors whitespace-nowrap"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'en' ? 'Somali' : 'English'}</span>
              </button>

            </div>

            {/* Mobile Header Controls: Compact Header with Language & Hamburger Menu */}
            <div className="xl:hidden flex items-center gap-2 shrink-0">
              <button
                onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                aria-label="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'en' ? 'SO' : 'EN'}</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors active:scale-95 ${
                  mobileMenuOpen
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 xl:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white h-full flex flex-col shadow-2xl ml-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <BrandLogo size="sm" showSubtitle={false} onClick={() => handleNavigateWithAnchor('home')} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-200"
                aria-label="Close navigation"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Public Navigation Hierarchy with Expandable Accordions */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Public Navigation
                </div>
                {managedNavCategories.map(cat => {
                  const isActive = currentView === cat.view;
                  const hasSub = Boolean(cat.subItems?.some(item => item.visible !== false));
                  const isExpanded = expandedMobileCategory === cat.key;

                  return (
                    <div key={cat.key} className="rounded-xl overflow-hidden border border-transparent">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleCategoryClick(cat)}
                          className={`flex-1 min-h-[44px] text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-cyan-50 text-cyan-700 font-bold'
                              : 'text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm">{cat.label}</span>
                          {!hasSub && <ChevronRight className="w-4 h-4 text-slate-300" />}
                        </button>
                        {hasSub && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMobileCategory(isExpanded ? null : cat.key);
                            }}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                            aria-label={`Toggle ${cat.label} submenu`}
                            aria-expanded={isExpanded}
                            aria-controls={`mobile-submenu-${cat.key}`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-cyan-600' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Expandable Sub-items for Mobile */}
                      {hasSub && isExpanded && (
                        <div id={`mobile-submenu-${cat.key}`} className="bg-slate-50/80 px-2 py-1 space-y-1 border-t border-slate-100">
                          {cat.subItems?.filter(sub => sub.visible !== false).map(sub => <MobileNavigationNode key={sub.key} item={sub} onNavigate={handleSubItemNavigate} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dedicated Portal Access Section (Strictly Isolated, No Admin/Education) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Portal Access
                  </span>
                  <span className="text-[9px] font-bold uppercase text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                    Separate Section
                  </span>
                </div>
                <div className="space-y-1.5">
                  {managedPortalItems.map(portal => {
                    const isActive = currentView === portal.view;
                    return (
                      <button
                        key={portal.key}
                        onClick={() => handleNavigateWithAnchor(portal.view)}
                        className={`w-full min-h-[44px] text-left p-3 rounded-xl border transition-all active:scale-98 flex items-center justify-between ${
                          isActive
                            ? 'bg-cyan-50/80 border-cyan-300 text-cyan-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
                            {portal.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {portal.label}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 px-1.5 py-0.2 rounded-md bg-white border border-slate-200">
                                {portal.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {portal.desc}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="text-center text-[10px] text-slate-500">
                Somali Innovation Hub • Mogadishu HQ & 4 Regional Hubs
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

