/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - CMS Media Library Area
 * Centralized media asset manager with instant URL selection for visual builder.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  Trash2,
  Pencil,
  Save,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  FolderOpen
} from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPatch, ApiError } from '../../../services/apiClient';
import { useApp } from '../../../context/AppContext';

export interface MediaAsset {
  id: string;
  originalName: string;
  title: string | null;
  description: string | null;
  contentType: string;
  byteSize: number;
  createdAt: string;
  previewUrl: string;
}

interface MediaLibraryAreaProps {
  onSelectAsset?: (url: string, asset: MediaAsset) => void;
  selectMode?: boolean;
}

const formatSize = (byteSize: number) =>
  byteSize >= 1024 * 1024
    ? `${(byteSize / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(byteSize / 1024)} KB`;

export const MediaLibraryArea: React.FC<MediaLibraryAreaProps> = ({
  onSelectAsset,
  selectMode = false
}) => {
  const { addToast } = useApp();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ media: MediaAsset[] }>('/api/media/admin');
      setMedia(res.media || []);
    } catch (err) {
      console.warn('Could not load media assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addToast('error', 'Invalid File Type', 'Please upload a JPEG, PNG, WebP, MP4, WebM or PDF.');
      return;
    }

    setUploading(true);
    try {
      const upload = await apiPost<{ assetId: string; uploadUrl: string; headers: Record<string, string> }>('/api/media/presign', {
        filename: file.name,
        contentType: file.type,
        byteSize: file.size
      });
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file });
      if (!response.ok) throw new Error('The file could not be uploaded to storage.');
      await apiPost(`/api/media/${encodeURIComponent(upload.assetId)}/complete`);

      addToast('success', 'File Uploaded', `${file.name} saved to institutional media repository.`);
      await loadMedia();
    } catch (err) {
      addToast('error', 'Upload Failed', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete ${asset.title || asset.originalName}?`)) return;
    try {
      await apiDelete(`/api/media/${encodeURIComponent(asset.id)}`);
      addToast('info', 'Asset Deleted', 'Media asset removed.');
      setMedia(prev => prev.filter(m => m.id !== asset.id));
    } catch (err) {
      addToast('error', 'Delete Failed', err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const handleSaveMetadata = async (assetId: string) => {
    try {
      await apiPatch(`/api/media/${encodeURIComponent(assetId)}/metadata`, {
        title: editTitle,
        description: editDesc
      });
      addToast('success', 'Metadata Updated', 'Saved asset details.');
      setMedia(prev =>
        prev.map(m => (m.id === assetId ? { ...m, title: editTitle, description: editDesc } : m))
      );
      setEditingId(null);
    } catch (err) {
      addToast('error', 'Save Failed', err instanceof ApiError ? err.message : 'Failed');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast('info', 'Link Copied', 'Asset URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = useMemo(() => {
    return media.filter(asset => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        `${asset.title ?? ''} ${asset.originalName} ${asset.description ?? ''}`
          .toLowerCase()
          .includes(term);
      const isImg = asset.contentType.startsWith('image/');
      const isVid = asset.contentType.startsWith('video/');
      const assetKind = isImg ? 'image' : isVid ? 'video' : 'document';
      return matchesSearch && (kind === 'all' || assetKind === kind);
    });
  }, [media, search, kind]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      {!selectMode && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-1">
              <FolderOpen className="w-4 h-4" /> Cloud Storage & Asset Manager
            </div>
            <h2 className="text-2xl font-extrabold font-heading">Institutional Media Library</h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Upload, organize, and inspect high-resolution images, video assets, and PDF publications. Select assets directly within the Visual Builder canvas.
            </p>
          </div>

          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload New Media'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={e => handleUpload(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Kind filters */}
        <div className="flex items-center gap-1.5">
          {(['all', 'image', 'video', 'document'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                kind === k
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {k === 'all' ? 'All Files' : `${k}s`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search media assets..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Assets */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading asset repository...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No media assets found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload images, videos, or documents to use across your website sections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMedia.map(asset => {
            const isImage = asset.contentType.startsWith('image/');
            const isVideo = asset.contentType.startsWith('video/');
            const isCopied = copiedId === asset.id;
            const isEditing = editingId === asset.id;

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Media Preview Box */}
                <div className="relative h-36 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.title || asset.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : isVideo ? (
                    <video
                      src={asset.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-amber-500" />
                  )}

                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-mono px-2 py-0.5 rounded-full">
                    {formatSize(asset.byteSize)}
                  </div>

                  {onSelectAsset && (
                    <button
                      type="button"
                      onClick={() => onSelectAsset(`/api/media/${encodeURIComponent(asset.id)}/public`, asset)}
                      className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-extrabold gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Use in Block
                    </button>
                  )}
                </div>

                {/* Info & Metadata */}
                <div className="p-3.5 space-y-2">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg"
                        placeholder="Title"
                      />
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full px-2 py-1 text-[11px] border rounded-lg"
                        placeholder="Description"
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveMetadata(asset.id)}
                          className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className="text-xs font-bold text-slate-900 truncate"
                          title={asset.title || asset.originalName}
                        >
                          {asset.title || asset.originalName}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(asset.id);
                            setEditTitle(asset.title || asset.originalName);
                            setEditDesc(asset.description || '');
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset.previewUrl, asset.id)}
                          className="flex items-center gap-1 hover:text-cyan-600 transition-colors"
                        >
                          {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Copied' : 'Copy URL'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(asset)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
