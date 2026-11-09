import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText, Image, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';
import { cmsContentReferencesAsset, findCmsMediaPath, getCmsMediaIds, getCmsValueAtPath, removeCmsMediaAsset, setCmsValueAtPath } from '../../utils/cmsContent';
import { CmsMedia } from '../common/CmsMedia';
import { parseCmsMediaUrl, type CmsMediaKind } from '../../utils/mediaUrl';
import { StructuredContentEditor } from './cms/StructuredContentEditor';

type CmsStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
type CmsEntry = { id: string; type: string; slug: string; title: string; summary: string | null; content: Record<string, unknown>; status: CmsStatus; deletedAt: string | null; updatedAt: string };
type CmsMediaAsset = { id: string; originalName: string; title: string | null; description: string | null; contentType: string; byteSize: number; createdAt: string; previewUrl: string };
const contentTypes = ['program', 'event', 'startup', 'innovation', 'opportunity', 'partner', 'mentor', 'news', 'story', 'gallery', 'community-member', 'community-topic', 'impact'];
const statusStyles: Record<CmsStatus, string> = {
  DRAFT: 'text-slate-300 bg-slate-800',
  PENDING_APPROVAL: 'text-amber-300 bg-amber-950',
  APPROVED: 'text-cyan-300 bg-cyan-950',
  PUBLISHED: 'text-emerald-300 bg-emerald-950',
  REJECTED: 'text-rose-300 bg-rose-950',
  ARCHIVED: 'text-slate-400 bg-slate-900'
};

const renderContentPreview = (value: unknown): React.ReactNode => {
  if (Array.isArray(value)) return <ul className="list-disc space-y-1 pl-5">{value.map((item, index) => <li key={index}>{renderContentPreview(item)}</li>)}</ul>;
  if (value && typeof value === 'object') return <dl className="space-y-2">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key}><dt className="font-semibold text-slate-300">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('-', ' ')}</dt><dd className="mt-0.5 text-slate-400">{renderContentPreview(item)}</dd></div>)}</dl>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value ?? '');
};

interface BackendCMSManagerProps {
  allowedTypes?: readonly string[];
  initialType?: string;
  heading?: string;
  description?: string;
}

export const BackendCMSManager: React.FC<BackendCMSManagerProps> = ({
  allowedTypes,
  initialType = 'news',
  heading = 'Website content',
  description = 'Draft, review, preview, publish, and archive structured SiHub content.'
}) => {
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [editing, setEditing] = useState<CmsEntry | null>(null);
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('{\n  "body": ""\n}');
  const [imageField, setImageField] = useState('coverImage');
  const [mediaKind, setMediaKind] = useState<CmsMediaKind>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaAlt, setMediaAlt] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [mediaAssets, setMediaAssets] = useState<CmsMediaAsset[]>([]);
  const [mediaError, setMediaError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ entries: CmsEntry[] }>('/api/cms/admin');
      setEntries(allowedTypes
        ? result.entries.filter(entry => allowedTypes.includes(entry.type))
        : result.entries.filter(entry => entry.type !== 'page'));
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load persistent CMS content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleCmsUpdate = () => { void load(); };
    void load();
    window.addEventListener('sihub-cms-update', handleCmsUpdate);
    return () => window.removeEventListener('sihub-cms-update', handleCmsUpdate);
  }, []);

  const loadImages = async () => {
    try {
      const result = await apiGet<{ media: CmsMediaAsset[] }>('/api/media/admin');
      setMediaAssets(result.media);
      setMediaError('');
    } catch (reason) {
      setMediaError(reason instanceof ApiError ? reason.message : 'Unable to load stored images.');
    }
  };

  useEffect(() => { void loadImages(); }, []);

  useEffect(() => {
    let active = true;
    const assetIds = getCmsMediaIds(editing?.content ?? {});
    Promise.all(assetIds.map(async assetId => {
      try {
        const result = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(assetId)}/download?inline=true`);
        return [assetId, result.url] as const;
      } catch {
        return null;
      }
    })).then(results => {
      if (active) setPreviewUrls(Object.fromEntries(results.filter((result): result is readonly [string, string] => result !== null)));
    });
    return () => { active = false; };
  }, [editing?.id]);

  const beginEdit = (entry: CmsEntry) => {
    setEditing(entry);
    setType(entry.type);
    setTitle(entry.title);
    setSlug(entry.slug);
    setSummary(entry.summary || '');
    setContent(JSON.stringify(entry.content, null, 2));
    setImageField(findCmsMediaPath(entry.content));
    setMediaKind(/video/i.test(findCmsMediaPath(entry.content)) ? 'video' : 'image');
    setMediaAlt('');
    setMediaCaption('');
    setMediaUrl('');
    setPreviewOpen(false);
  };

  const resetForm = () => {
    setEditing(null);
    setType(initialType);
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('{\n  "body": ""\n}');
    setImageField('coverImage');
    setMediaKind('image');
    setMediaUrl('');
    setMediaAlt('');
    setMediaCaption('');
    setPreviewUrls({});
    setPreviewOpen(false);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    const allowedTypes = mediaKind === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : ['video/mp4', 'video/webm'];
    const maxBytes = mediaKind === 'image' ? 25 * 1024 * 1024 : 250 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setError(mediaKind === 'image' ? 'Choose a JPEG, PNG, or WebP image.' : 'Choose an MP4 or WebM video.');
      return;
    }
    if (file.size <= 0 || file.size > maxBytes) {
      setError(mediaKind === 'image' ? 'Images must be smaller than 25 MB.' : 'Videos must be smaller than 250 MB.');
      return;
    }

    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(content) as Record<string, unknown>;
      if (!parsedContent || Array.isArray(parsedContent) || typeof parsedContent !== 'object') throw new Error('Content must be a JSON object');
      setCmsValueAtPath(parsedContent, imageField, '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Finish editing the content details before uploading media.');
      return;
    }

    setUploadingImage(true);
    setError('');
    try {
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', {
        filename: file.name,
        contentType: file.type,
        byteSize: file.size
      });
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!response.ok) throw new Error('The image could not be uploaded to storage.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);

      setCmsValueAtPath(parsedContent, imageField, `/api/media/${upload.assetId}/public`);
      setCmsValueAtPath(parsedContent, `${imageField}Type`, mediaKind);
      setCmsValueAtPath(parsedContent, `${imageField}Provider`, 's3');
      setCmsValueAtPath(parsedContent, `${imageField}Alt`, mediaAlt || file.name);
      setCmsValueAtPath(parsedContent, `${imageField}Caption`, mediaCaption);
      const retainedIds = getCmsMediaIds(parsedContent).filter(assetId => assetId !== upload.assetId);
      const replacedValue = getCmsValueAtPath(JSON.parse(content) as Record<string, unknown>, imageField);
      const replacedAssetId = typeof replacedValue === 'string' ? replacedValue.match(/^\/api\/media\/([^/]+)\/public$/)?.[1] : undefined;
      if (replacedAssetId && !cmsContentReferencesAsset(parsedContent, replacedAssetId)) {
        parsedContent.mediaAssetIds = retainedIds.filter(assetId => assetId !== replacedAssetId);
      } else {
        parsedContent.mediaAssetIds = retainedIds;
      }
      parsedContent.mediaAssetIds = [...new Set([...getCmsMediaIds(parsedContent), upload.assetId])];
      setContent(JSON.stringify(parsedContent, null, 2));
      const preview = await apiGet<{ url: string }>(`/api/media/${encodeURIComponent(upload.assetId)}/download?inline=true`);
      setPreviewUrls(current => ({ ...current, [upload.assetId]: preview.url }));
      await loadImages();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const assignMediaUrl = () => {
    try {
      const parsedContent = JSON.parse(content) as Record<string, unknown>;
      const parsedUrl = parseCmsMediaUrl(mediaUrl, mediaKind);
      const previousValue = getCmsValueAtPath(parsedContent, imageField);
      const previousAssetId = typeof previousValue === 'string' ? previousValue.match(/^\/api\/media\/([^/]+)\/public$/)?.[1] : undefined;
      setCmsValueAtPath(parsedContent, imageField, parsedUrl.url);
      setCmsValueAtPath(parsedContent, `${imageField}Type`, mediaKind);
      setCmsValueAtPath(parsedContent, `${imageField}Provider`, parsedUrl.provider);
      setCmsValueAtPath(parsedContent, `${imageField}EmbedUrl`, parsedUrl.embedUrl ?? '');
      setCmsValueAtPath(parsedContent, `${imageField}Alt`, mediaAlt);
      setCmsValueAtPath(parsedContent, `${imageField}Caption`, mediaCaption);
      if (previousAssetId && !cmsContentReferencesAsset(parsedContent, previousAssetId)) {
        parsedContent.mediaAssetIds = getCmsMediaIds(parsedContent).filter(assetId => assetId !== previousAssetId);
      }
      setContent(JSON.stringify(parsedContent, null, 2));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Enter a valid external media URL.');
    }
  };

  const removeImage = (assetId: string) => {
    if (!window.confirm('Remove this image from the content draft? The stored file will remain in the image library until you delete it there.')) return;
    try {
      const parsedContent = JSON.parse(content) as Record<string, unknown>;
      setContent(JSON.stringify(removeCmsMediaAsset(parsedContent, assetId), null, 2));
    } catch {
      setError('Unable to update this media reference. Please reload the entry and try again.');
    }
  };

  const useLibraryImage = (image: CmsMediaAsset) => {
    try {
      const parsedContent = JSON.parse(content) as Record<string, unknown>;
      const previousValue = getCmsValueAtPath(parsedContent, imageField);
      const previousAssetId = typeof previousValue === 'string' ? previousValue.match(/^\/api\/media\/([^/]+)\/public$/)?.[1] : undefined;
      const imageKind = image.contentType.startsWith('video/') ? 'video' : 'image';
      setMediaKind(imageKind);
      setCmsValueAtPath(parsedContent, imageField, `/api/media/${image.id}/public`);
      setCmsValueAtPath(parsedContent, `${imageField}Type`, imageKind);
      setCmsValueAtPath(parsedContent, `${imageField}Provider`, 's3');
      setCmsValueAtPath(parsedContent, `${imageField}EmbedUrl`, '');
      setCmsValueAtPath(parsedContent, `${imageField}Alt`, mediaAlt);
      setCmsValueAtPath(parsedContent, `${imageField}Caption`, mediaCaption);
      let ids = [...new Set([...getCmsMediaIds(parsedContent), image.id])];
      if (previousAssetId && previousAssetId !== image.id && !cmsContentReferencesAsset(parsedContent, previousAssetId)) {
        ids = ids.filter(assetId => assetId !== previousAssetId);
      }
      parsedContent.mediaAssetIds = ids;
      setContent(JSON.stringify(parsedContent, null, 2));
      setPreviewUrls(current => ({ ...current, [image.id]: image.previewUrl }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this media reference. Please reload the entry and try again.');
    }
  };

  const deleteImage = async (image: CmsMediaAsset) => {
    if (!window.confirm(`Permanently delete ${image.originalName}? Media referenced by website or lesson content cannot be deleted.`)) return;
    try {
      await apiDelete(`/api/media/${encodeURIComponent(image.id)}`);
      setMediaAssets(current => current.filter(item => item.id !== image.id));
      setPreviewUrls(current => { const next = { ...current }; delete next[image.id]; return next; });
    } catch (reason) {
      setMediaError(reason instanceof ApiError ? reason.message : 'Unable to delete image.');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(content) as Record<string, unknown>;
      if (!parsedContent || Array.isArray(parsedContent) || typeof parsedContent !== 'object') throw new Error('Content must be a JSON object');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Content must be valid JSON.');
      return;
    }
    const payload = { type, title, slug, summary, content: parsedContent };
    try {
      if (editing) await apiPatch(`/api/cms/admin/${encodeURIComponent(editing.id)}`, payload);
      else await apiPost('/api/cms/admin', payload);
      resetForm();
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save CMS content.');
    }
  };

  const setStatus = async (entry: CmsEntry, status: CmsStatus) => {
    try {
      await apiPatch(`/api/cms/admin/${encodeURIComponent(entry.id)}/status`, { status });
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to update publication state.');
    }
  };

  const remove = async (entry: CmsEntry) => {
    if (!window.confirm(`Archive “${entry.title}”? This is a soft delete; it will remain in the audit history.`)) return;
    try {
      await apiDelete(`/api/cms/admin/${encodeURIComponent(entry.id)}`);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to archive content.');
    }
  };

  const restore = async (entry: CmsEntry) => {
    try {
      await apiPost(`/api/cms/admin/${encodeURIComponent(entry.id)}/restore`);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to restore content.');
    }
  };

  const autoSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
  let currentImagePreview = '';
  try {
    const parsedContent = JSON.parse(content) as Record<string, unknown>;
    const imageValue = getCmsValueAtPath(parsedContent, imageField);
    if (typeof imageValue === 'string') {
      const assetId = imageValue.match(/^\/api\/media\/([^/]+)\/public$/)?.[1];
      currentImagePreview = assetId ? previewUrls[assetId] ?? '' : /^https?:\/\//i.test(imageValue) ? imageValue : '';
    }
  } catch {
    currentImagePreview = '';
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Persistent CMS • PostgreSQL</span>
          <h2 className="mt-1 text-xl font-extrabold text-white">{heading}</h2>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <button onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500"><Plus className="h-4 w-4" /> New entry</button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-2">
          {loading && <p className="py-6 text-center text-xs text-slate-500">Loading persistent content…</p>}
          {!loading && entries.length === 0 && <p className="border border-slate-800 bg-slate-950 p-5 text-xs text-slate-400">No CMS records found. Run the initial data seed after applying the database migration.</p>}
          {entries.map(entry => (
            <article key={entry.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-300">{entry.type}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${statusStyles[entry.status]}`}>{entry.status.replace('_', ' ')}</span>
                </div>
                <h3 className="mt-1 truncate text-sm font-bold text-white">{entry.title}</h3>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">/{entry.slug} · Updated {new Date(entry.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {!entry.deletedAt && entry.status !== 'ARCHIVED' && <button onClick={() => beginEdit(entry)} className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-800">Edit</button>}
                {!entry.deletedAt && (entry.status === 'DRAFT' || entry.status === 'REJECTED') ? <button onClick={() => void setStatus(entry, 'PENDING_APPROVAL')} className="rounded bg-amber-900/70 px-2 py-1 text-[10px] font-semibold text-amber-200"><Send className="mr-1 inline h-3 w-3" />Review</button> : null}
                {!entry.deletedAt && entry.status === 'PENDING_APPROVAL' ? <button onClick={() => void setStatus(entry, 'APPROVED')} className="rounded bg-cyan-900/70 px-2 py-1 text-[10px] font-semibold text-cyan-200"><CheckCircle2 className="mr-1 inline h-3 w-3" />Approve</button> : null}
                {!entry.deletedAt && entry.status === 'APPROVED' ? <button onClick={() => void setStatus(entry, 'PUBLISHED')} className="rounded bg-emerald-900/70 px-2 py-1 text-[10px] font-semibold text-emerald-200">Publish</button> : null}
                {!entry.deletedAt && entry.status === 'PUBLISHED' ? <button onClick={() => void setStatus(entry, 'DRAFT')} className="rounded bg-amber-900/70 px-2 py-1 text-[10px] font-semibold text-amber-200">Unpublish</button> : null}
                {(entry.deletedAt || entry.status === 'ARCHIVED')
                  ? <button onClick={() => void restore(entry)} aria-label={`Restore ${entry.title}`} className="inline-flex items-center gap-1 rounded border border-emerald-900 px-2 py-1 text-[10px] font-semibold text-emerald-300"><RotateCcw className="h-3 w-3" />Restore</button>
                  : <button onClick={() => void remove(entry)} aria-label={`Archive ${entry.title}`} className="rounded p-1.5 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            </article>
          ))}
        </div>

        <form onSubmit={save} className="space-y-3 border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><FileText className="h-4 w-4 text-cyan-400" />{editing ? 'Edit content' : 'Create content'}</h3>
            <button type="button" onClick={() => setPreviewOpen(!previewOpen)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300"><Eye className="h-3.5 w-3.5" />{previewOpen ? 'Hide preview' : 'Preview'}</button>
          </div>
          <label className="block text-[10px] font-semibold text-slate-400">Content type
            {allowedTypes
              ? <select value={type} onChange={event => setType(event.target.value)} required className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">{allowedTypes.map(value => <option key={value} value={value}>{value.replaceAll('-', ' ')}</option>)}</select>
              : <select value={type} onChange={event => setType(event.target.value)} required className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">{contentTypes.map(value => <option key={value} value={value}>{value.replaceAll('-', ' ')}</option>)}</select>}
          </label>
          <label className="block text-[10px] font-semibold text-slate-400">Title
            <input value={title} onChange={event => { setTitle(event.target.value); if (!editing) setSlug(autoSlug(event.target.value)); }} required maxLength={240} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
          </label>
          <div className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-[10px] text-slate-400">Page address, created from the title: <span className="font-mono text-cyan-300">/{slug || 'new-entry'}</span></div>
          <label className="block text-[10px] font-semibold text-slate-400">Summary
            <textarea value={summary} onChange={event => setSummary(event.target.value)} rows={2} maxLength={10000} className="mt-1 w-full resize-y rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
          </label>
          <StructuredContentEditor
            value={(() => {
              try {
                const parsed = JSON.parse(content) as unknown;
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
              } catch {
                return {};
              }
            })()}
            onChange={next => setContent(JSON.stringify(next, null, 2))}
          />
              <div className="space-y-3 border-t border-slate-800 pt-3">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300"><Image className="h-3.5 w-3.5" />Image and video</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-semibold text-slate-400">Media type
                    <select value={mediaKind} onChange={event => setMediaKind(event.target.value as CmsMediaKind)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-400">Where should it appear?
                    <select value={imageField} onChange={event => { setImageField(event.target.value); setMediaKind(/video/i.test(event.target.value) ? 'video' : 'image'); }} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white">
                      <option value="coverImage">Cover image</option><option value="heroImage">Page hero image</option><option value="heroVideo">Page hero video</option><option value="image">Main image</option><option value="logoUrl">Logo</option><option value="avatarUrl">Profile image</option><option value="video">Video</option><option value="banner.image">Banner image</option><option value="banner.video">Banner video</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-semibold text-slate-400">Image description for accessibility
                    <input value={mediaAlt} onChange={event => setMediaAlt(event.target.value)} maxLength={500} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-400">Caption
                    <input value={mediaCaption} onChange={event => setMediaCaption(event.target.value)} maxLength={500} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                  </label>
                </div>
                {currentImagePreview && <div className="border border-slate-800 p-2"><CmsMedia src={currentImagePreview} kind={mediaKind} alt={mediaAlt} caption={mediaCaption} className="max-h-48 w-full object-contain" /></div>}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input value={mediaUrl} onChange={event => setMediaUrl(event.target.value)} type="url" inputMode="url" placeholder={mediaKind === 'image' ? 'https://example.com/image.jpg' : 'https://youtu.be/... or direct video URL'} className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white" />
                  <button type="button" onClick={assignMediaUrl} className="rounded border border-cyan-800 px-3 py-2 text-[10px] font-semibold text-cyan-300">Preview URL</button>
                </div>
                {mediaUrl && <div className="border border-slate-800 p-2"><CmsMedia src={mediaUrl} kind={mediaKind} alt={mediaAlt} caption={mediaCaption} className="max-h-48 w-full object-contain" /></div>}
                <label className="block text-[10px] font-semibold text-slate-400">Upload from device (images up to 25 MB; MP4/WebM video up to 250 MB)
                  <input type="file" accept={mediaKind === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'} disabled={uploadingImage} onChange={event => { void uploadImage(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} className="mt-1 block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
                </label>
                {uploadingImage && <p className="text-[10px] text-cyan-300">Uploading and verifying {mediaKind}…</p>}
                {getCmsMediaIds((() => { try { return JSON.parse(content) as Record<string, unknown>; } catch { return {}; } })()).map(assetId => {
                  const asset = mediaAssets.find(item => item.id === assetId);
                  const kind: CmsMediaKind = asset?.contentType.startsWith('video/') ? 'video' : 'image';
                  return <div key={assetId} className="flex items-center gap-3 border border-slate-800 p-2">
                    <CmsMedia src={previewUrls[assetId] ?? `/api/media/${encodeURIComponent(assetId)}/public`} kind={kind} alt={asset?.originalName ?? 'Uploaded media preview'} className="h-14 w-20 object-cover" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-slate-300">{asset?.title || asset?.originalName || 'Uploaded media'}</span>
                    <button type="button" onClick={() => removeImage(assetId)} className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-rose-300">Remove reference</button>
                  </div>;
                })}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">Stored media library</h4>
                  <button type="button" onClick={() => void loadImages()} className="text-[10px] font-semibold text-cyan-300">Refresh</button>
                </div>
                {mediaError && <p role="alert" className="text-[10px] text-amber-300">{mediaError}</p>}
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {mediaAssets.map(asset => {
                    const kind: CmsMediaKind = asset.contentType.startsWith('video/') ? 'video' : 'image';
                    return <div key={asset.id} className="flex items-center gap-2 border border-slate-800 p-2">
                      <CmsMedia src={asset.previewUrl} kind={kind} alt={asset.originalName} className="h-12 w-16 shrink-0 object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-[10px] text-slate-200">{asset.title || asset.originalName}</p><p className="text-[9px] text-slate-500">{asset.contentType} · {Math.ceil(asset.byteSize / 1024)} KB</p></div>
                      <button type="button" onClick={() => useLibraryImage(asset)} className="rounded border border-slate-700 px-2 py-1 text-[9px] font-semibold text-cyan-300">Use</button>
                      <button type="button" onClick={() => void deleteImage(asset)} aria-label={`Permanently delete ${asset.originalName}`} className="rounded p-1 text-slate-500 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>;
                  })}
                  {!mediaError && mediaAssets.length === 0 && <p className="text-[10px] text-slate-500">No stored media found.</p>}
                </div>
              </div>
          {previewOpen && <div className="max-h-72 space-y-3 overflow-auto border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300"><div><h4 className="font-bold text-white">{title || 'Untitled'}</h4>{summary && <p className="mt-1 text-slate-400">{summary}</p>}</div>{renderContentPreview((() => { try { return JSON.parse(content); } catch { return {}; } })())}</div>}
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            {editing && <button type="button" onClick={resetForm} className="rounded border border-slate-700 px-3 py-2 text-[10px] font-bold text-slate-300">Cancel</button>}
            <button type="submit" className="inline-flex items-center gap-1.5 rounded bg-cyan-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-cyan-500"><Save className="h-3.5 w-3.5" />Save draft</button>
          </div>
        </form>
      </div>
    </section>
  );
};
