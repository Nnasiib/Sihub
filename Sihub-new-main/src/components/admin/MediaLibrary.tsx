import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Image, Pencil, RefreshCw, Save, Search, Trash2, Upload, Video } from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '../../services/apiClient';

type MediaAsset = {
  id: string;
  originalName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  byteSize: number;
  createdAt: string;
  previewUrl: string;
};

const formatSize = (byteSize: number) => byteSize >= 1024 * 1024
  ? `${(byteSize / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.ceil(byteSize / 1024)} KB`;

export const MediaLibrary: React.FC = () => {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingAssetId, setEditingAssetId] = useState('');
  const [metadataTitle, setMetadataTitle] = useState('');
  const [metadataDescription, setMetadataDescription] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiGet<{ media: MediaAsset[] }>('/api/media/admin');
      setMedia(result.media);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load the media library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filteredMedia = useMemo(() => media.filter(asset => {
    const term = search.trim().toLowerCase();
    const matchesSearch = `${asset.title ?? ''} ${asset.originalName} ${asset.description ?? ''}`.toLowerCase().includes(term);
    const assetKind = asset.contentType.startsWith('image/') ? 'image' : asset.contentType.startsWith('video/') ? 'video' : 'document';
    return matchesSearch && (kind === 'all' || assetKind === kind);
  }), [kind, media, search]);

  const upload = async (file?: File) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
    const maxBytes = file.type.startsWith('video/') ? 250 * 1024 * 1024 : 25 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP, MP4, WebM, or PDF file.');
      return;
    }
    if (file.size <= 0 || file.size > maxBytes) {
      setError(file.type.startsWith('video/') ? 'Videos must be smaller than 250 MB.' : 'Images and PDFs must be smaller than 25 MB.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    try {
      const uploadDetails = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', {
        filename: file.name,
        contentType: file.type,
        byteSize: file.size
      });
      const response = await fetch(uploadDetails.uploadUrl, { method: 'PUT', headers: uploadDetails.headers, body: file });
      if (!response.ok) throw new Error('The file could not be uploaded to storage.');
      await apiPost(`/api/media/${encodeURIComponent(uploadDetails.assetId)}/complete`);
      setNotice('Upload verified and added to the library.');
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'Unable to upload this file.');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (asset: MediaAsset) => {
    if (!window.confirm(`Permanently delete ${asset.originalName}? Referenced files cannot be deleted.`)) return;
    try {
      await apiDelete(`/api/media/${encodeURIComponent(asset.id)}`);
      setMedia(current => current.filter(item => item.id !== asset.id));
      setNotice('Media asset deleted.');
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to delete this asset.');
    }
  };

  const saveMetadata = async (event: React.FormEvent, asset: MediaAsset) => {
    event.preventDefault();
    setSavingMetadata(true);
    try {
      const { asset: updated } = await apiPatch<{ asset: { id: string; title: string | null; description: string | null; originalName: string } }>(`/api/media/${encodeURIComponent(asset.id)}/metadata`, { title: metadataTitle, description: metadataDescription });
      setMedia(current => current.map(item => item.id === updated.id ? { ...item, title: updated.title, description: updated.description } : item));
      setEditingAssetId('');
      setNotice('Media metadata saved.');
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save media metadata.');
    } finally { setSavingMetadata(false); }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Private S3 storage</span>
          <h1 className="mt-1 text-xl font-extrabold text-white">Media library</h1>
          <p className="mt-1 text-xs text-slate-400">Verified images, videos, and assignment documents used across SiHub.</p>
        </div>
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
          <Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload media'}
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf" disabled={uploading} onChange={event => { void upload(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" />
        </label>
      </header>
      {error && <p role="alert" className="border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</p>}
      {notice && <p role="status" className="border border-emerald-800 bg-emerald-950/50 p-3 text-xs text-emerald-200">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, description, or filename" className="w-full border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white" />
        </label>
        <select value={kind} onChange={event => setKind(event.target.value as typeof kind)} aria-label="Filter by media type" className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">
          <option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option><option value="document">Documents</option>
        </select>
        <button onClick={() => void load()} disabled={loading} aria-label="Refresh media library" title="Refresh media library" className="border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {loading && <p className="py-8 text-center text-xs text-slate-500">Loading media…</p>}
      {!loading && filteredMedia.length === 0 && <p className="border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No matching media assets.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredMedia.map(asset => {
          const isImage = asset.contentType.startsWith('image/');
          const isVideo = asset.contentType.startsWith('video/');
          return <article key={asset.id} className="overflow-hidden border border-slate-800 bg-slate-950">
            <div className="flex h-44 items-center justify-center bg-black/30">
              {isImage ? <img src={asset.previewUrl} alt={asset.originalName} className="h-full w-full object-contain" />
                : isVideo ? <video src={asset.previewUrl} controls preload="metadata" className="h-full w-full object-contain" />
                  : <div className="flex h-full w-full items-center justify-center bg-white"><iframe title={asset.originalName} src={asset.previewUrl} className="h-full w-full" /></div>}
            </div>
            <div className="space-y-2 p-3">
              {editingAssetId === asset.id ? <form onSubmit={event => void saveMetadata(event, asset)} className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400">Title<input required maxLength={200} value={metadataTitle} onChange={event => setMetadataTitle(event.target.value)} className="mt-1 w-full border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></label>
                <label className="block text-[10px] font-semibold text-slate-400">Description<textarea maxLength={5000} rows={3} value={metadataDescription} onChange={event => setMetadataDescription(event.target.value)} className="mt-1 w-full border border-slate-700 bg-slate-900 p-2 text-xs text-white" /></label>
                <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingAssetId('')} className="px-2 py-1 text-[10px] text-slate-400">Cancel</button><button disabled={savingMetadata} className="inline-flex items-center gap-1 border border-cyan-800 px-2 py-1 text-[10px] font-semibold text-cyan-300 disabled:opacity-50"><Save className="h-3 w-3" />{savingMetadata ? 'Saving…' : 'Save'}</button></div>
              </form> : <>
                <div className="flex items-start gap-2">
                  {isImage ? <Image className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" /> : isVideo ? <Video className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                  <div className="min-w-0 flex-1"><h2 className="truncate text-xs font-semibold text-slate-100" title={asset.title ?? asset.originalName}>{asset.title || asset.originalName}</h2><p className="mt-1 truncate text-[10px] text-slate-400">{asset.description || asset.originalName}</p><p className="mt-1 text-[10px] text-slate-500">{asset.contentType} · {formatSize(asset.byteSize)} · {new Date(asset.createdAt).toLocaleDateString()}</p></div>
                  <button onClick={() => { setEditingAssetId(asset.id); setMetadataTitle(asset.title || asset.originalName); setMetadataDescription(asset.description || ''); }} aria-label={`Edit metadata for ${asset.originalName}`} className="p-1 text-slate-500 hover:text-cyan-300"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-800 pt-2">
                  <a href={asset.previewUrl} target="_blank" rel="noreferrer" download={asset.originalName} className="inline-flex items-center gap-1 border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-800"><Download className="h-3 w-3" />Open</a>
                  <button onClick={() => void remove(asset)} aria-label={`Delete ${asset.originalName}`} className="p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </>}
            </div>
          </article>;
        })}
      </div>
    </section>
  );
};
