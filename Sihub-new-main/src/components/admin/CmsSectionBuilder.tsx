import React, { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';
import { CmsSectionRenderer } from '../common/CmsSectionRenderer';
import type { CmsContentBlock, CmsPageSection } from '../../types/cmsBlocks';
import { getCmsMediaIds } from '../../utils/cmsContent';

type CmsEntry = { id: string; type: string; slug: string; title: string; summary: string | null; content: Record<string, unknown>; status: string; deletedAt: string | null; updatedAt: string };
type MediaAsset = { id: string; originalName: string; title: string | null; description: string | null; contentType: string; byteSize: number; previewUrl: string };
type CmsRevision = { id: string; revisionNumber: number; title: string; status: string; createdAt: string };
const createId = () => globalThis.crypto.randomUUID();
const emptyLayout: CmsPageSection['layout'] = { desktopColumns: 2, tabletColumns: 2, mobileColumns: 1, backgroundColor: '#ffffff', textColor: '#172033', spacing: 'normal' };

const newSection = (): CmsPageSection => ({
  id: createId(), name: 'New section', description: '', placement: 'bottom', order: 0, visible: true, archived: false,
  layout: { ...emptyLayout },
  blocks: [
    { id: createId(), type: 'heading', text: 'Section heading', level: 2 },
    { id: createId(), type: 'paragraph', text: 'Add your content here.' }
  ]
});

const newBlock = (type: CmsContentBlock['type']): CmsContentBlock => {
  const id = createId();
  switch (type) {
    case 'heading': return { id, type, text: 'New heading', level: 2 };
    case 'paragraph': return { id, type, text: 'New paragraph' };
    case 'richText': return { id, type, text: 'Use **bold**, *italic*, and `code` formatting in this text.' };
    case 'list': return { id, type, items: ['First item'] };
    case 'link': return { id, type, label: 'Learn more', url: '/' };
    case 'button': return { id, type, label: 'Take action', url: '/' };
    case 'image': return { id, type, src: '', alt: '', aspectRatio: '16/9' };
    case 'video': return { id, type, src: '', alt: '', aspectRatio: '16/9' };
    case 'gallery': return { id, type, items: [], aspectRatio: '4/3' };
  }
};

export const CmsSectionBuilder: React.FC = () => {
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [sections, setSections] = useState<CmsPageSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const pageEntries = useMemo(() => entries.filter(entry => entry.type === 'page'), [entries]);
  const selectedPage = pageEntries.find(entry => entry.id === selectedId);
  const selectedSection = sections.find(section => section.id === selectedSectionId);
  const previewWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%';
  const draftSnapshot = JSON.stringify({ title, slug, summary, sections: sections.map((section, order) => ({ ...section, order })) });
  const hasUnsavedChanges = Boolean(selectedPage && draftSnapshot !== savedSnapshot);

  const load = async (keepSelection = true) => {
    setLoading(true);
    try {
      const [entryResult, mediaResult] = await Promise.all([
        apiGet<{ entries: CmsEntry[] }>('/api/cms/admin'),
        apiGet<{ media: MediaAsset[] }>('/api/media/admin')
      ]);
      const pages = entryResult.entries.filter(entry => entry.type === 'page');
      setEntries(entryResult.entries);
      setMedia(mediaResult.media);
      const next = keepSelection ? pages.find(page => page.id === selectedId) ?? pages[0] : pages[0];
      if (next && next.id !== selectedId) selectPage(next);
      else if (!next) { setSelectedId(''); setSections([]); setTitle(''); setSlug(''); setSummary(''); }
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load pages and media from the server.');
    } finally { setLoading(false); }
  };

  const selectPage = (page: CmsEntry) => {
    const storedSections = Array.isArray(page.content.sections) ? page.content.sections as CmsPageSection[] : [];
    const orderedSections = [...storedSections].sort((left, right) => left.order - right.order);
    setSelectedId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setSummary(page.summary ?? '');
    setSections(orderedSections);
    setSelectedSectionId(storedSections[0]?.id ?? '');
    setSavedSnapshot(JSON.stringify({ title: page.title, slug: page.slug, summary: page.summary ?? '', sections: orderedSections.map((section, order) => ({ ...section, order })) }));
    setRevisions([]);
    void apiGet<{ revisions: CmsRevision[] }>(`/api/cms/admin/${encodeURIComponent(page.id)}/revisions`).then(result => setRevisions(result.revisions)).catch(() => setRevisions([]));
  };

  useEffect(() => { void load(false); }, []);

  const createPage = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', { type: 'page', title: newPageTitle, slug: newPageSlug, summary: '', content: { sections: [] } });
      setNewPageTitle(''); setNewPageSlug('');
      await load(false);
      selectPage(result.entry);
      setNotice('Page draft created.'); setError('');
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to create the page.'); }
  };

  const duplicatePage = async () => {
    if (!selectedPage) return;
    const slug = `${selectedPage.slug.slice(0, 140)}-copy-${createId().slice(0, 8)}`;
    const content: Record<string, unknown> = {
      ...selectedPage.content,
      sections: sections.map((section, order) => ({ ...section, order }))
    };
    delete content.mediaAssetIds;
    content.mediaAssetIds = getCmsMediaIds(content);
    try {
      const result = await apiPost<{ entry: CmsEntry }>('/api/cms/admin', {
        type: 'page',
        title: `${title || selectedPage.title} copy`.slice(0, 240),
        slug,
        summary,
        content
      });
      await load(false);
      selectPage(result.entry);
      setNotice('Page duplicated as a new draft.');
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to duplicate the page.');
    }
  };

  const updateSection = (sectionId: string, patch: Partial<CmsPageSection>) => setSections(current => current.map(section => section.id === sectionId ? { ...section, ...patch } : section));
  const updateBlock = (sectionId: string, blockId: string, patch: Partial<CmsContentBlock>) => setSections(current => current.map(section => section.id === sectionId ? { ...section, blocks: section.blocks.map(block => block.id === blockId ? { ...block, ...patch } as CmsContentBlock : block) } : section));

  const addSection = () => {
    const section = newSection();
    section.order = sections.length;
    setSections(current => [...current, section]);
    setSelectedSectionId(section.id);
  };

  const reorderSection = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSections(reordered.map((section, order) => ({ ...section, order })));
  };

  const duplicateSection = (section: CmsPageSection) => {
    const copy = { ...section, id: createId(), name: `${section.name} copy`, order: sections.length, blocks: section.blocks.map(block => ({ ...block, id: createId() } as CmsContentBlock)) };
    setSections(current => [...current, copy]); setSelectedSectionId(copy.id);
  };

  const addBlock = (type: CmsContentBlock['type']) => {
    if (!selectedSection) return;
    updateSection(selectedSection.id, { blocks: [...selectedSection.blocks, newBlock(type)] });
  };

  const addLibraryAsset = (asset: MediaAsset, blockId: string) => {
    if (!selectedSection) return;
    const src = `/api/media/${asset.id}/public`;
    const alt = asset.title || asset.originalName;
    const caption = asset.description || undefined;
    const kind = asset.contentType.startsWith('video/') ? 'video' : 'image';
    const target = selectedSection.blocks.find(block => block.id === blockId);
    if (target?.type === 'gallery') updateBlock(selectedSection.id, blockId, { items: [...target.items, { src, alt, caption }] });
    else updateBlock(selectedSection.id, blockId, { src, alt, caption, type: kind } as Partial<CmsContentBlock>);
  };

  const uploadMedia = async (file: File, blockId: string) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) { setError('Choose a JPEG, PNG, WebP, MP4, or WebM file.'); return; }
    setUploading(true); setError('');
    try {
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', { filename: file.name, contentType: file.type, byteSize: file.size });
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!response.ok) throw new Error('Media upload failed.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);
      const src = `/api/media/${upload.assetId}/public`;
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      const target = selectedSection?.blocks.find(block => block.id === blockId);
      if (target?.type === 'gallery') updateBlock(selectedSection!.id, blockId, { items: [...target.items, { src, alt: file.name }] });
      else if (selectedSection) updateBlock(selectedSection.id, blockId, { src, alt: file.name, type: kind } as Partial<CmsContentBlock>);
      setNotice('Media uploaded and verified. Save the page draft to retain this reference.');
      await loadMedia();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Upload failed.'); }
    finally { setUploading(false); }
  };

  const loadMedia = async () => {
    try { const result = await apiGet<{ media: MediaAsset[] }>('/api/media/admin'); setMedia(result.media); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to refresh media library.'); }
  };

  const saveDraft = async (): Promise<boolean> => {
    if (!selectedPage) return false;
    try {
      const contentWithoutAssetList: Record<string, unknown> = { ...selectedPage.content, sections: sections.map((section, order) => ({ ...section, order })) };
      delete contentWithoutAssetList['mediaAssetIds'];
      const content = { ...contentWithoutAssetList, mediaAssetIds: getCmsMediaIds(contentWithoutAssetList) };
      const result = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}`, { type: 'page', title, slug, summary, content });
      setEntries(current => current.map(entry => entry.id === result.entry.id ? result.entry : entry));
      setSavedSnapshot(JSON.stringify({ title, slug, summary, sections: sections.map((section, order) => ({ ...section, order })) }));
      setNotice('Draft saved to the database.'); setError('');
      const revisionResult = await apiGet<{ revisions: CmsRevision[] }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/revisions`);
      setRevisions(revisionResult.revisions);
      return true;
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Unable to save draft.'); return false; }
  };

  const changeStatus = async (status: 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'DRAFT') => {
    if (!selectedPage) return;
    if (hasUnsavedChanges) {
      const saved = await saveDraft();
      if (!saved) return;
      setNotice(status === 'DRAFT'
        ? 'Changes were saved as a draft and are no longer published.'
        : 'Changes were saved as a draft. Submit the updated page for review before publishing it.');
      return;
    }
    try {
      const result = await apiPatch<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/status`, { status });
      setEntries(current => current.map(entry => entry.id === result.entry.id ? result.entry : entry));
      setNotice(`Page status is now ${status.toLowerCase().replace('_', ' ')}.`); setError('');
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to change page status.'); }
  };

  const restoreRevision = async (revisionId: string) => {
    if (!selectedPage) return;
    try {
      const result = await apiPost<{ entry: CmsEntry }>(`/api/cms/admin/${encodeURIComponent(selectedPage.id)}/revisions/${encodeURIComponent(revisionId)}/restore`);
      setEntries(current => current.map(entry => entry.id === result.entry.id ? result.entry : entry));
      selectPage(result.entry); setNotice('Revision restored as a draft.'); setError('');
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Unable to restore that revision.'); }
  };

  const renderBlockEditor = (block: CmsContentBlock) => <article key={block.id} className="space-y-2 border border-slate-700 bg-slate-900 p-3">
    <div className="flex justify-between text-[10px] font-bold uppercase text-cyan-300"><span>{block.type}</span><button type="button" onClick={() => selectedSection && updateSection(selectedSection.id, { blocks: selectedSection.blocks.filter(item => item.id !== block.id) })} className="text-rose-300">Remove block</button></div>
    {(block.type === 'heading' || block.type === 'paragraph') && <><input value={block.text} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { text: event.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><div className="grid grid-cols-2 gap-2"><select value={block.fontSize ?? 'base'} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { fontSize: event.target.value as 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' })} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="sm">Small</option><option value="base">Normal</option><option value="lg">Large</option><option value="xl">XL</option><option value="2xl">2XL</option><option value="3xl">3XL</option></select><select value={block.fontFamily ?? 'sans'} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { fontFamily: event.target.value as 'sans' | 'serif' | 'mono' })} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select></div><div className="flex items-center gap-2"><label className="text-[10px] text-slate-400">Text color<input type="color" value={block.color ?? selectedSection?.layout.textColor ?? '#172033'} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { color: event.target.value })} className="ml-2 h-7 w-10 align-middle" /></label><select value={block.alignment ?? 'left'} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { alignment: event.target.value as 'left' | 'center' | 'right' })} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>{block.type === 'heading' && <select value={block.level} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { level: Number(event.target.value) as 2 | 3 | 4 })} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>}</>}
    {block.type === 'richText' && <textarea value={block.text} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { text: event.target.value })} rows={6} placeholder="Use **bold**, *italic*, and `code` formatting" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />}
    {block.type === 'list' && <textarea value={block.items.join('\n')} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { items: event.target.value.split('\n') })} rows={4} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" />}
    {(block.type === 'link' || block.type === 'button') && <><input value={block.label} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { label: event.target.value })} placeholder="Link label" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><input value={block.url} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { url: event.target.value })} placeholder="https://… or /path" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /></>}
    {(block.type === 'image' || block.type === 'video' || block.type === 'gallery') && <><select value="" onChange={event => { const asset = media.find(item => item.id === event.target.value); if (asset) addLibraryAsset(asset, block.id); }} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="">Use media library…</option>{media.map(asset => <option key={asset.id} value={asset.id}>{asset.originalName} · {asset.contentType}</option>)}</select><label className="block text-[10px] text-slate-400">Upload image/video<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={uploading} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadMedia(file, block.id); event.currentTarget.value = ''; }} className="mt-1 block w-full text-[10px]" /></label>{block.type !== 'gallery' && <><input value={block.src} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { src: event.target.value })} placeholder="HTTPS media URL or uploaded asset" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><input value={block.alt} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { alt: event.target.value })} placeholder="Alternative text" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><input value={block.caption ?? ''} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { caption: event.target.value })} placeholder="Caption" className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white" /><select value={block.aspectRatio ?? '16/9'} onChange={event => selectedSection && updateBlock(selectedSection.id, block.id, { aspectRatio: event.target.value as 'auto' | '1/1' | '4/3' | '16/9' | '9/16' })} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs text-white"><option value="auto">Auto</option><option value="1/1">Square</option><option value="4/3">4:3</option><option value="16/9">16:9</option><option value="9/16">9:16</option></select></>}</>}
  </article>;

  return (
    <section className="space-y-5 border-b border-slate-800 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Existing CMS · Dynamic sections</span><h2 className="mt-1 text-xl font-extrabold text-white">Page and section builder</h2><p className="mt-1 text-xs text-slate-400">Build sections inside existing CMS pages. Changes remain drafts until published.</p></div><div className="flex flex-wrap gap-2"><form onSubmit={createPage} className="flex flex-wrap gap-2"><input required value={newPageTitle} onChange={event => { setNewPageTitle(event.target.value); setNewPageSlug(event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} placeholder="New page title" className="rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" /><button className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Create page</button></form><button type="button" onClick={() => void duplicatePage()} disabled={!selectedPage} className="rounded border border-slate-700 px-3 py-2 text-[10px] font-bold text-slate-300 disabled:opacity-40">Duplicate selected</button></div></header>
      {error && <p role="alert" className="border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}{notice && <p role="status" className="border border-emerald-800 bg-emerald-950/50 p-3 text-xs text-emerald-200">{notice}</p>}
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-2 border border-slate-800 bg-slate-950 p-3"><label className="block text-[10px] font-bold uppercase text-slate-400">Page<select value={selectedId} onChange={event => { const page = pageEntries.find(item => item.id === event.target.value); if (page) selectPage(page); }} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Select a page</option>{pageEntries.map(page => <option key={page.id} value={page.id}>{page.title} · {page.status}</option>)}</select></label><div className="space-y-1">{sections.map((section, index) => <div key={section.id} className={`border p-2 ${section.id === selectedSectionId ? 'border-cyan-700 bg-cyan-950/30' : 'border-slate-800'}`}><button onClick={() => setSelectedSectionId(section.id)} className="block w-full truncate text-left text-xs font-semibold text-slate-100">{index + 1}. {section.name}</button><div className="mt-2 flex flex-wrap gap-1"><button onClick={() => reorderSection(index, -1)} className="px-1 text-[9px] text-slate-400" aria-label="Move section up">Up</button><button onClick={() => reorderSection(index, 1)} className="px-1 text-[9px] text-slate-400" aria-label="Move section down">Down</button><button onClick={() => duplicateSection(section)} className="px-1 text-[9px] text-cyan-300">Duplicate</button><button onClick={() => updateSection(section.id, { visible: !section.visible })} className="px-1 text-[9px] text-amber-300">{section.visible ? 'Hide' : 'Show'}</button><button onClick={() => updateSection(section.id, { archived: !section.archived })} className="px-1 text-[9px] text-rose-300">{section.archived ? 'Restore' : 'Archive'}</button><button onClick={() => { setSections(items => items.filter(item => item.id !== section.id)); if (section.id === selectedSectionId) setSelectedSectionId(''); }} className="px-1 text-[9px] text-rose-400">Delete</button></div></div>)}</div><button onClick={addSection} disabled={!selectedPage} className="w-full rounded border border-slate-700 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-40">Add section</button></aside>
        <div className="space-y-4">
          {selectedPage && <div className="grid gap-2 border border-slate-800 bg-slate-950 p-3 sm:grid-cols-3"><input value={title} onChange={event => setTitle(event.target.value)} aria-label="Page title" className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input value={slug} onChange={event => setSlug(event.target.value)} aria-label="Page slug" className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><input value={summary} onChange={event => setSummary(event.target.value)} aria-label="Page summary" className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></div>}
          {selectedSection && <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-sm font-bold text-white">Section settings</h3><input value={selectedSection.name} onChange={event => updateSection(selectedSection.id, { name: event.target.value })} placeholder="Section name" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><textarea value={selectedSection.description ?? ''} onChange={event => updateSection(selectedSection.id, { description: event.target.value })} placeholder="Section description" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white" /><label className="block text-[10px] text-slate-400">Placement<select value={selectedSection.placement} onChange={event => updateSection(selectedSection.id, { placement: event.target.value as 'top' | 'bottom' })} className="mt-1 block rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="top">Before page content</option><option value="bottom">After page content</option></select></label><div className="grid grid-cols-3 gap-2">{(['mobileColumns', 'tabletColumns', 'desktopColumns'] as const).map(track => <label key={track} className="text-[9px] text-slate-400">{track.replace('Columns', '')} columns<select value={selectedSection.layout[track]} onChange={event => updateSection(selectedSection.id, { layout: { ...selectedSection.layout, [track]: Number(event.target.value) } as CmsPageSection['layout'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white">{(track === 'desktopColumns' ? [1, 2, 3, 4] : track === 'tabletColumns' ? [1, 2, 3] : [1, 2]).map(number => <option key={number} value={number}>{number}</option>)}</select></label>)}</div><div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-400">Background<input type="color" value={selectedSection.layout.backgroundColor} onChange={event => updateSection(selectedSection.id, { layout: { ...selectedSection.layout, backgroundColor: event.target.value } })} className="mt-1 block h-9 w-full" /></label><label className="text-[10px] text-slate-400">Text color<input type="color" value={selectedSection.layout.textColor} onChange={event => updateSection(selectedSection.id, { layout: { ...selectedSection.layout, textColor: event.target.value } })} className="mt-1 block h-9 w-full" /></label></div><label className="block text-[10px] text-slate-400">Spacing<select value={selectedSection.layout.spacing} onChange={event => updateSection(selectedSection.id, { layout: { ...selectedSection.layout, spacing: event.target.value as 'compact' | 'normal' | 'spacious' } })} className="mt-1 block rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="compact">Compact</option><option value="normal">Normal</option><option value="spacious">Spacious</option></select></label>
              <label className="block text-[10px] text-slate-400">Add content block<select value="" onChange={event => { if (event.target.value) addBlock(event.target.value as CmsContentBlock['type']); }} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="">Choose block…</option>{['heading', 'paragraph', 'richText', 'list', 'link', 'button', 'image', 'video', 'gallery'].map(type => <option key={type} value={type}>{type === 'richText' ? 'Rich text' : type}</option>)}</select></label>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">{selectedSection.blocks.map(renderBlockEditor)}</div>
          </div>}
          {selectedPage && <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-slate-950 p-3"><div className="flex flex-wrap gap-2"><button onClick={() => void saveDraft()} className="rounded bg-cyan-700 px-3 py-2 text-[10px] font-bold text-white">Save draft</button>{selectedPage.status === 'DRAFT' || selectedPage.status === 'REJECTED' ? <button onClick={() => void changeStatus('PENDING_APPROVAL')} className="rounded bg-amber-800 px-3 py-2 text-[10px] font-bold text-white">Submit review</button> : null}{selectedPage.status === 'PENDING_APPROVAL' ? <button onClick={() => void changeStatus('APPROVED')} className="rounded bg-indigo-800 px-3 py-2 text-[10px] font-bold text-white">Approve</button> : null}{selectedPage.status === 'APPROVED' ? <button onClick={() => void changeStatus('PUBLISHED')} className="rounded bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white">Publish</button> : null}{selectedPage.status === 'PUBLISHED' ? <button onClick={() => void changeStatus('DRAFT')} className="rounded bg-amber-800 px-3 py-2 text-[10px] font-bold text-white">Unpublish</button> : null}</div><div className="flex gap-1"><button onClick={() => setDevice('mobile')} className={`px-2 py-1 text-[10px] ${device === 'mobile' ? 'bg-cyan-800 text-white' : 'text-slate-400'}`}>Mobile</button><button onClick={() => setDevice('tablet')} className={`px-2 py-1 text-[10px] ${device === 'tablet' ? 'bg-cyan-800 text-white' : 'text-slate-400'}`}>Tablet</button><button onClick={() => setDevice('desktop')} className={`px-2 py-1 text-[10px] ${device === 'desktop' ? 'bg-cyan-800 text-white' : 'text-slate-400'}`}>Desktop</button></div></div>}
          {selectedPage && <div className="mx-auto overflow-x-auto border border-dashed border-slate-600 bg-white p-2" style={{ maxWidth: previewWidth }}><div className="space-y-3">{sections.filter(section => !section.archived && section.blocks.length).sort((a, b) => a.order - b.order).map(section => <CmsSectionRenderer key={section.id} section={{ ...section, visible: true }} />)}</div></div>}
          {selectedPage && <div className="space-y-2 border border-slate-800 bg-slate-950 p-3"><h3 className="text-xs font-bold text-white">Revision history</h3>{revisions.map(revision => <div key={revision.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 py-2 text-[10px] text-slate-300"><span>Revision {revision.revisionNumber} · {revision.title} · {revision.status} · {new Date(revision.createdAt).toLocaleString()}</span><button onClick={() => void restoreRevision(revision.id)} className="text-cyan-300">Restore as draft</button></div>)}{!revisions.length && <p className="text-[10px] text-slate-500">No revisions yet.</p>}</div>}
        </div>
      </div>
    </section>
  );
};
