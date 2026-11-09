/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Navigation Manager Area
 * Comprehensive management of primary navigation categories, nested subsections,
 * reordering, custom routing, and direct live publishing to the public Header.
 */

import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Globe,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { apiPut, ApiError } from '../../../services/apiClient';

export interface NavSubItem {
  key: string;
  label: string;
  view?: string;
  url?: string;
  anchor?: string;
  desc?: string;
  query?: Record<string, string>;
  visible?: boolean;
  subItems?: NavSubItem[];
}

export interface NavCategory {
  key: string;
  label: string;
  view?: string;
  url?: string;
  subItems?: NavSubItem[];
  visible?: boolean;
}

type NavNode = NavCategory | NavSubItem;

const updateNavNode = (nodes: NavNode[], path: string[], update: (node: NavNode) => NavNode): NavNode[] => {
  if (!path.length) return nodes;
  return nodes.map(node => {
    if (node.key !== path[0]) return node;
    if (path.length === 1) return update(node);
    return { ...node, subItems: updateNavNode(node.subItems ?? [], path.slice(1), update) as NavSubItem[] };
  });
};

const updateNavChildren = (nodes: NavNode[], parentPath: string[], update: (children: NavSubItem[]) => NavSubItem[]): NavNode[] =>
  updateNavNode(nodes, parentPath, node => ({ ...node, subItems: update(node.subItems ?? []) }));

const collectNavParents = (nodes: NavNode[], parentPath: string[] = [], parentLabels: string[] = []): { path: string[]; label: string }[] =>
  nodes.flatMap(node => {
    const path = [...parentPath, node.key];
    const labelParts = [...parentLabels, node.label];
    return [{ path, label: labelParts.join(' / ') }, ...collectNavParents(node.subItems ?? [], path, labelParts)];
  });

interface NavigationManagerAreaProps {
  navItems: NavCategory[];
  setNavItems: React.Dispatch<React.SetStateAction<NavCategory[]>>;
  availablePageSlugs: string[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const NavigationManagerArea: React.FC<NavigationManagerAreaProps> = ({
  navItems,
  setNavItems,
  availablePageSlugs,
  addToast
}) => {
  const [newTopLabel, setNewTopLabel] = useState('');
  const [newTopUrl, setNewTopUrl] = useState('');
  const [selectedParentPath, setSelectedParentPath] = useState<string[]>([navItems[0]?.key || 'programmes']);
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubRouteType, setNewSubRouteType] = useState<'standard' | 'page' | 'external'>('standard');
  const [newSubView, setNewSubView] = useState('programs');
  const [newSubPageSlug, setNewSubPageSlug] = useState(availablePageSlugs[0] || 'about');
  const [newSubExternalUrl, setNewSubExternalUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    about: true,
    programmes: true,
    startups: true,
    institute: true,
    'events-media': true,
    impact: true,
    partnerships: true
  });

  const toggleExpand = (catKey: string) => {
    setExpandedCats(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handleAddTopCategory = () => {
    if (!newTopLabel.trim()) {
      addToast('error', 'Validation Error', 'Please enter a category title.');
      return;
    }
    const key = newTopLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (navItems.some(c => c.key === key)) {
      addToast('error', 'Duplicate Key', `A category with key "${key}" already exists.`);
      return;
    }
    const newCat: NavCategory = {
      key,
      label: newTopLabel.trim(),
      url: newTopUrl.trim() || undefined,
      view: newTopUrl.trim() ? undefined : 'home',
      visible: true,
      subItems: []
    };
    setNavItems(prev => [...prev, newCat]);
    setNewTopLabel('');
    setNewTopUrl('');
    addToast('success', 'Category Added', `Added "${newCat.label}" to navigation tree.`);
  };

  const handleAddSubsection = () => {
    if (!newSubLabel.trim()) {
      addToast('error', 'Validation Error', 'Please enter a subsection title.');
      return;
    }
    const subKey = newSubLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let targetView: string | undefined = undefined;
    let targetUrl: string | undefined = undefined;

    if (newSubRouteType === 'standard') {
      targetView = newSubView;
      const standardPaths: Record<string, string> = {
        programs: '/programs', courses: '/institute', startups: '/entrepreneurship',
        innovation: '/innovation', events: '/events', impact: '/impact',
        partnerships: '/partnerships', opportunities: '/opportunities',
        mentorship: '/mentorship', about: '/about', news: '/news', contact: '/contact',
        media_gallery: '/media'
      };
      targetUrl = standardPaths[newSubView] ?? `/${newSubView}`;
    } else if (newSubRouteType === 'page') {
      targetView = 'cms_page';
      targetUrl = `/pages/${newSubPageSlug}`;
    } else {
      targetUrl = newSubExternalUrl.trim() || '#';
    }

    const newSub: NavSubItem = {
      key: subKey,
      label: newSubLabel.trim(),
      desc: newSubDesc.trim() || undefined,
      view: targetView,
      url: targetUrl,
      visible: true
    };

    setNavItems(prev => updateNavChildren(prev, selectedParentPath, children => [...children, newSub]) as NavCategory[]);

    setNewSubLabel('');
    setNewSubDesc('');
    setNewSubExternalUrl('');
    addToast('success', 'Subsection Added', `Added "${newSub.label}" under "${selectedParentPath.join(' / ')}".`);
  };

  const handleMoveCategory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;
    setNavItems(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  };

  const handleDeleteCategory = (catKey: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catKey}" and all its sub-items?`)) return;
    setNavItems(prev => prev.filter(c => c.key !== catKey));
    addToast('info', 'Category Removed', `Category "${catKey}" was deleted.`);
  };

  const handleMoveSubItem = (parentPath: string[], subIndex: number, direction: -1 | 1) => {
    setNavItems(prev => updateNavChildren(prev, parentPath, children => {
      const targetIndex = subIndex + direction;
      if (targetIndex < 0 || targetIndex >= children.length) return children;
      const copy = [...children];
      const [sub] = copy.splice(subIndex, 1);
      copy.splice(targetIndex, 0, sub);
      return copy;
    }) as NavCategory[]);
  };

  const handleDeleteSubItem = (parentPath: string[], subKey: string) => {
    setNavItems(prev => updateNavChildren(prev, parentPath, children => children.filter(item => item.key !== subKey)) as NavCategory[]);
    addToast('info', 'Subsection Removed', `Deleted subsection "${subKey}".`);
  };

  const handleSaveNavigationToLive = async () => {
    setSaving(true);
    try {
      await apiPut('/api/cms/navigation', { categories: navItems });
      window.dispatchEvent(new CustomEvent('sihub-cms-update'));
      addToast('success', 'Navigation Published Live', 'The public website header has been updated with the new navigation hierarchy.');
    } catch (reason) {
      addToast('error', 'Publish Failed', reason instanceof ApiError ? reason.message : 'Unable to persist navigation changes.');
    } finally {
      setSaving(false);
    }
  };

  const navParentOptions = collectNavParents(navItems);

  const renderSubItems = (items: NavSubItem[], parentPath: string[], depth = 1): React.ReactNode => (
    <div className="space-y-2" style={{ marginLeft: `${depth * 12}px` }}>
      {items.map((item, index) => {
        const itemPath = [...parentPath, item.key];
        const updateItem = (patch: Partial<NavSubItem>) => setNavItems(prev => updateNavNode(prev, itemPath, node => ({ ...node, ...patch })) as NavCategory[]);
        return <div key={item.key} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Navigation item label" value={item.label} onChange={event => updateItem({ label: event.target.value })} className="min-w-32 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs font-bold text-white" />
            <input aria-label="Navigation destination" value={item.url ?? ''} onChange={event => updateItem({ url: event.target.value })} placeholder="Page path or HTTPS URL" className="min-w-40 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[10px] text-cyan-300" />
            <label className="inline-flex items-center gap-1 text-[10px] text-slate-400"><input type="checkbox" checked={item.visible !== false} onChange={event => updateItem({ visible: event.target.checked })} />Show</label>
            <button type="button" onClick={() => handleMoveSubItem(parentPath, index, -1)} disabled={index === 0} title="Move up" className="rounded border border-slate-700 p-1.5 text-slate-300 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
            <button type="button" onClick={() => handleMoveSubItem(parentPath, index, 1)} disabled={index === items.length - 1} title="Move down" className="rounded border border-slate-700 p-1.5 text-slate-300 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
            <button type="button" onClick={() => { setSelectedParentPath(itemPath); setNewSubLabel(''); }} title="Add nested item" className="rounded border border-cyan-800 px-2 py-1.5 text-[10px] font-semibold text-cyan-300">Add nested item</button>
            <button type="button" onClick={() => handleDeleteSubItem(parentPath, item.key)} aria-label="Delete navigation item" className="rounded border border-rose-900 p-1.5 text-rose-300"><Trash2 className="h-3 w-3" /></button>
          </div>
          <input aria-label="Navigation item description" value={item.desc ?? ''} onChange={event => updateItem({ desc: event.target.value })} placeholder="Short description (optional)" className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-[10px] text-slate-300" />
          {item.subItems?.length ? renderSubItems(item.subItems, itemPath, depth + 1) : null}
        </div>;
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Save Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-slate-950 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Website Navigation & Taxonomy Manager
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Build and reorder main categories and nested subsections. When ready, click "Save Navigation to Live Site" to immediately update the public header.
          </p>
        </div>

        <button
          onClick={() => void handleSaveNavigationToLive()}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg transition-all hover:scale-102"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Navigation…' : 'Save Navigation to Live Site'}</span>
        </button>
      </div>

      {/* Add Controls in 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Box 1: Add New Top-Level Category */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
            + Add New Top-Level Category
          </span>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Category Title</label>
              <input
                placeholder="e.g. Climate & Energy Lab"
                value={newTopLabel}
                onChange={e => setNewTopLabel(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Direct URL / Path (Optional if using dropdown)</label>
              <input
                placeholder="e.g. /climate or /pages/climate-action"
                value={newTopUrl}
                onChange={e => setNewTopUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
            </div>
            <button
              onClick={handleAddTopCategory}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              Add Top Category
            </button>
          </div>
        </div>

        {/* Box 2: Add Nested Subsection */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
            + Add Nested Subsection to Category
          </span>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Parent Category</label>
                <select
                  value={selectedParentPath.join('/')}
                  onChange={e => setSelectedParentPath(e.target.value.split('/').filter(Boolean))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {navParentOptions.map(parent => (
                    <option key={parent.path.join('/')} value={parent.path.join('/')}>{parent.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Subsection Title</label>
                <input
                  placeholder="e.g. Agri-Food Accelerator"
                  value={newSubLabel}
                  onChange={e => setNewSubLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Destination Target</label>
                <select
                  value={newSubRouteType}
                  onChange={e => setNewSubRouteType(e.target.value as never)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="standard">Standard Public Section</option>
                  <option value="page">Custom CMS Page (/pages/*)</option>
                  <option value="external">External / Custom URL</option>
                </select>
              </div>

              <div>
                {newSubRouteType === 'standard' && (
                  <>
                    <label className="text-[10px] text-slate-400 block mb-1">Standard Section</label>
                    <select
                      value={newSubView}
                      onChange={e => setNewSubView(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="programs">Our Programmes (/programs)</option>
                      <option value="courses">SiHub Institute (/institute)</option>
                      <option value="startups">Entrepreneurship & Startups (/entrepreneurship)</option>
                      <option value="innovation">Innovation Lab (/innovation)</option>
                      <option value="events">Events & Media (/events)</option>
                      <option value="media_gallery">Media Gallery (/media)</option>
                      <option value="impact">Our Impact (/impact)</option>
                      <option value="partnerships">Partnerships (/partnerships)</option>
                      <option value="opportunities">Grants & Jobs (/opportunities)</option>
                      <option value="mentorship">Mentorship (/mentorship)</option>
                      <option value="about">About SiHub (/about)</option>
                      <option value="news">News & Stories (/news)</option>
                      <option value="contact">Contact (/contact)</option>
                    </select>
                  </>
                )}

                {newSubRouteType === 'page' && (
                  <>
                    <label className="text-[10px] text-slate-400 block mb-1">Select CMS Page</label>
                    <select
                      value={newSubPageSlug}
                      onChange={e => setNewSubPageSlug(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      {availablePageSlugs.map(slug => (
                        <option key={slug} value={slug}>/pages/{slug}</option>
                      ))}
                    </select>
                  </>
                )}

                {newSubRouteType === 'external' && (
                  <>
                    <label className="text-[10px] text-slate-400 block mb-1">Full URL</label>
                    <input
                      placeholder="https://..."
                      value={newSubExternalUrl}
                      onChange={e => setNewSubExternalUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Description / Subtitle (Shown in mega-menu)</label>
              <input
                placeholder="Brief 1-sentence description"
                value={newSubDesc}
                onChange={e => setNewSubDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              onClick={handleAddSubsection}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Add Subsection
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Hierarchy Tree */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Navigation Tree ({navItems.length} Categories)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Click arrows to reorder • Changes apply live upon saving
          </span>
        </div>

        <div className="space-y-3">
          {navItems.map((cat, catIdx) => {
            const isExpanded = expandedCats[cat.key] ?? true;
            return (
              <div key={cat.key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => toggleExpand(cat.key)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{catIdx + 1}.</span>
                    <input aria-label="Category label" value={cat.label} onChange={event => setNavItems(prev => prev.map(item => item.key === cat.key ? { ...item, label: event.target.value } : item))} className="min-w-24 max-w-48 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-white" />
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">
                      {cat.subItems?.length || 0} sub-items
                    </span>
                    {cat.url && (
                      <span className="text-[10px] text-cyan-400/80 font-mono hidden sm:inline">
                        target: {cat.url}
                      </span>
                    )}
                  </div>

                  {/* Category Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <label className="mr-1 inline-flex items-center gap-1 text-[10px] text-slate-400"><input type="checkbox" checked={cat.visible !== false} onChange={event => setNavItems(prev => prev.map(item => item.key === cat.key ? { ...item, visible: event.target.checked } : item))} />Show</label>
                    <button
                      onClick={() => handleMoveCategory(catIdx, -1)}
                      disabled={catIdx === 0}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Category Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(catIdx, 1)}
                      disabled={catIdx === navItems.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Category Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.key)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subsections under Category */}
                {isExpanded && (
                  <div className="space-y-1.5 pl-6 border-l-2 border-slate-800">
                    {cat.subItems?.length ? renderSubItems(cat.subItems, [cat.key]) : <span className="text-[11px] text-slate-500 italic block py-1">No submenu items yet.</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
