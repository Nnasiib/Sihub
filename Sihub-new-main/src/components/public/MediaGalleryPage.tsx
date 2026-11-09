import React, { useState } from 'react';
import { Images, Search, X } from 'lucide-react';
import { useCmsCollection } from '../../hooks/useCmsCollection';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsMedia } from '../common/CmsMedia';
import { DynamicCmsSections } from './DynamicCmsSections';

type GalleryItem = {
  src?: string;
  url?: string;
  image?: string;
  video?: string;
  kind?: string;
  type?: string;
  mediaType?: string;
  alt?: string;
  caption?: string;
  title?: string;
};

type GalleryEntry = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  mediaType?: string;
  image?: string;
  imageType?: string;
  imageAlt?: string;
  imageCaption?: string;
  coverImage?: string;
  coverImageType?: string;
  coverImageAlt?: string;
  video?: string;
  videoAlt?: string;
  videoCaption?: string;
  items?: GalleryItem[];
};

type GalleryMedia = {
  id: string;
  title: string;
  category: string;
  src: string;
  kind: 'image' | 'video';
  alt: string;
  caption: string;
};

const isVideoItem = (item: GalleryItem, fallback?: string) => {
  const declaredType = `${item.kind ?? ''} ${item.type ?? ''} ${item.mediaType ?? fallback ?? ''}`.toLowerCase();
  const source = item.src ?? item.url ?? item.image ?? item.video ?? '';
  return declaredType.includes('video') || /\.(mp4|webm|mov|m4v|ogv)(?:\?|$)/i.test(source);
};

export const MediaGalleryPage: React.FC = () => {
  const { page, loading: pageLoading } = useCmsPage('media-gallery');
  const { items: entries, loading, error } = useCmsCollection<GalleryEntry>('gallery');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selected, setSelected] = useState<GalleryMedia | null>(null);

  const media: GalleryMedia[] = entries.flatMap(entry => {
    const listed = (entry.items ?? []).map((item, index) => {
      const source = item.src ?? item.url ?? item.image ?? item.video ?? '';
      const kind: 'image' | 'video' = isVideoItem(item, entry.mediaType) ? 'video' : 'image';
      return source ? [{
        id: `${entry.id}-${index}`,
        title: item.title || entry.title,
        category: entry.category || 'SiHub Media',
        src: source,
        kind,
        alt: item.alt || item.title || entry.title,
        caption: item.caption || entry.summary || ''
      }] : [];
    }).flat();
    const direct: GalleryMedia[] = [];
    const image = entry.image || entry.coverImage;
    if (image) direct.push({
      id: `${entry.id}-image`, title: entry.title, category: entry.category || 'SiHub Media', src: image,
      kind: entry.imageType === 'video' || entry.coverImageType === 'video' ? 'video' : 'image',
      alt: entry.imageAlt || entry.coverImageAlt || entry.title, caption: entry.imageCaption || entry.summary || ''
    });
    if (entry.video) direct.push({
      id: `${entry.id}-video`, title: entry.title, category: entry.category || 'SiHub Media', src: entry.video,
      kind: 'video', alt: entry.videoAlt || entry.title, caption: entry.videoCaption || entry.summary || ''
    });
    return [...listed, ...direct];
  });

  const filtered = media.filter(item => {
    const matchesType = filter === 'all' || item.kind === filter;
    const matchesQuery = `${item.title} ${item.category} ${item.caption}`.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <DynamicCmsSections pageSlug="media-gallery" placement="top" />
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Events &amp; Media</span>
        <h1 className="text-3xl font-extrabold text-slate-900">{page?.title ?? 'Media Gallery'}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{page?.summary ?? 'Photos and videos from SiHub programmes, events, and community activities.'}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" role="group" aria-label="Filter gallery media">
          {(['all', 'image', 'video'] as const).map(kind => <button key={kind} type="button" onClick={() => setFilter(kind)} aria-pressed={filter === kind} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${filter === kind ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{kind === 'all' ? 'All media' : `${kind}s`}</button>)}
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search gallery" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900" />
        </label>
      </div>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">Gallery content could not be loaded.</p>}
      {loading || pageLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading gallery…</p> : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-cyan-400 hover:shadow-md">
            <div className="aspect-[4/3] bg-slate-100"><CmsMedia src={item.src} kind={item.kind} alt={item.alt} className="h-full w-full object-cover" /></div>
            <div className="space-y-1 p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">{item.category} · {item.kind}</span><h2 className="font-bold text-slate-900">{item.title}</h2>{item.caption && <p className="line-clamp-2 text-xs text-slate-600">{item.caption}</p>}</div>
          </button>)}
        </div>
      ) : <div className="border border-dashed border-slate-300 p-10 text-center"><Images className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-800">No media to display</h2><p className="mt-1 text-xs text-slate-500">Published gallery items will appear here.</p></div>}

      <DynamicCmsSections pageSlug="media-gallery" placement="bottom" />

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}>
        <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white" onClick={event => event.stopPropagation()}>
          <button type="button" onClick={() => setSelected(null)} aria-label="Close media preview" className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white"><X className="h-5 w-5" /></button>
          <CmsMedia src={selected.src} kind={selected.kind} alt={selected.alt} caption={selected.caption} className="max-h-[75vh] w-full bg-black object-contain" />
          <div className="p-4"><p className="text-xs font-bold uppercase text-cyan-700">{selected.category}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{selected.title}</h2>{selected.caption && <p className="mt-2 text-sm text-slate-600">{selected.caption}</p>}</div>
        </div>
      </div>}
    </main>
  );
};