import React from 'react';
import { CmsMedia } from './CmsMedia';
import type { CmsContentBlock, CmsPageSection } from '../../types/cmsBlocks';

const fontFamilies = { sans: 'sans-serif', serif: 'serif', mono: 'monospace' } as const;
const fontSizes = { sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' } as const;
const spacing = { compact: '1.5rem', normal: '2.5rem', spacious: '4rem' } as const;
const renderRichText = (text: string) => text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
  if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
  if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-black/5 px-1">{part.slice(1, -1)}</code>;
  return part;
});

const TextBlock: React.FC<{ block: Extract<CmsContentBlock, { type: 'heading' | 'subheading' | 'paragraph' | 'richText' | 'list' | 'quote' }> }> = ({ block }) => {
  const style: React.CSSProperties = {
    textAlign: block.alignment,
    color: block.color,
    fontFamily: ('fontFamily' in block && block.fontFamily) ? fontFamilies[block.fontFamily] : undefined,
    fontSize: ('fontSize' in block && block.fontSize) ? fontSizes[block.fontSize] : undefined
  };
  if (block.type === 'heading') {
    const Tag: React.ElementType = `h${block.level}`;
    return <Tag style={style} className="font-bold leading-tight">{block.text}</Tag>;
  }
  if (block.type === 'subheading') return <p style={style} className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{block.text}</p>;
  if (block.type === 'paragraph') return <p style={style} className="whitespace-pre-wrap leading-relaxed">{block.text}</p>;
  if (block.type === 'richText') return <div style={style} className="space-y-3 leading-relaxed">{block.text.split(/\n{2,}/).map((paragraph, index) => <p key={`${block.id}-${index}`} className="whitespace-pre-wrap">{renderRichText(paragraph)}</p>)}</div>;
  if (block.type === 'quote') {
    return (
      <blockquote style={style} className="border-l-4 border-cyan-500 pl-4 py-2 italic my-2 bg-slate-500/5 rounded-r">
        <p className="text-base font-medium">"{block.text}"</p>
        {(block.author || block.title) && (
          <footer className="mt-2 text-xs font-semibold not-italic opacity-80">
            {block.author} {block.title ? `— ${block.title}` : ''}
          </footer>
        )}
      </blockquote>
    );
  }
  return <ul style={style} className="list-disc space-y-1 pl-5">{block.items.map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}</ul>;
};

const MediaBlock: React.FC<{ block: Extract<CmsContentBlock, { type: 'image' | 'video' | 'gallery' | 'videoGallery' | 'embed' | 'document' }> }> = ({ block }) => {
  if (block.type === 'gallery') return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{block.items.map((item, index) => <CmsMedia key={`${block.id}-${index}`} src={item.src} kind="image" alt={item.alt} caption={item.caption} className="h-full max-h-80 w-full object-cover rounded-xl shadow-sm" />)}</div>;
  if (block.type === 'videoGallery') return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{block.items.map((item, index) => <CmsMedia key={`${block.id}-${index}`} src={item.src} kind="video" alt={item.alt} caption={item.caption} className="h-full max-h-96 w-full rounded-xl bg-black object-contain shadow-sm" />)}</div>;
  if (block.type === 'embed') {
    return (
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl shadow" style={{ aspectRatio: block.aspectRatio === 'auto' ? '16/9' : block.aspectRatio }}>
        <iframe src={block.src} title={block.title || 'Embed'} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (block.type === 'document') {
    return (
      <a href={block.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors text-slate-800">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800 font-bold text-xs uppercase">{block.format || 'DOC'}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{block.title}</p>
          {block.description && <p className="text-xs text-slate-500 truncate">{block.description}</p>}
        </div>
        {block.fileSize && <span className="text-xs text-slate-400 font-mono">{block.fileSize}</span>}
      </a>
    );
  }
  const kind = block.type;
  return <div className={`mx-auto w-full max-w-5xl ${block.alignment === 'left' ? 'mr-auto' : block.alignment === 'right' ? 'ml-auto' : ''}`} style={{ aspectRatio: block.aspectRatio === 'auto' ? undefined : block.aspectRatio }}><CmsMedia src={block.src} kind={kind} alt={block.alt} caption={block.caption} className="h-full w-full object-cover rounded-xl" /></div>;
};

const ComponentBlock: React.FC<{
  block: Extract<
    CmsContentBlock,
    {
      type:
        | 'button'
        | 'link'
        | 'card'
        | 'stat'
        | 'teamMember'
        | 'testimonial'
        | 'partnerLogo'
        | 'programCard'
        | 'textImage'
        | 'divider'
        | 'contactInfo'
        | 'faq'
        | 'timeline'
        | 'eventCard'
        | 'newsCard'
        | 'customHtml';
    }
  >;
}> = ({ block }) => {
  if (block.type === 'button') {
    const variantClasses = block.variant === 'secondary'
      ? 'bg-slate-800 text-white hover:bg-slate-900'
      : block.variant === 'outline'
        ? 'border-2 border-cyan-700 text-cyan-700 hover:bg-cyan-50'
        : 'bg-cyan-700 text-white hover:bg-cyan-800';
    return <div style={{ textAlign: block.alignment }}><a href={block.url} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-all ${variantClasses}`}>{block.label}</a></div>;
  }
  if (block.type === 'link') {
    return <div style={{ textAlign: block.alignment }}><a href={block.url} className="font-semibold text-cyan-700 hover:text-cyan-800 underline underline-offset-4">{block.label}</a></div>;
  }
  if (block.type === 'stat') {
    return (
      <div className="p-6 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm text-center space-y-1">
        <p className="text-3xl sm:text-4xl font-extrabold text-cyan-700 tracking-tight">{block.value}</p>
        <p className="text-sm font-semibold text-slate-800">{block.label}</p>
        {block.description && <p className="text-xs text-slate-500 leading-relaxed">{block.description}</p>}
        {block.change && <span className="inline-block mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{block.change}</span>}
      </div>
    );
  }
  if (block.type === 'card') {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
        {block.image && <img src={block.image} alt={block.title} className="h-40 w-full object-cover rounded-xl" />}
        <div className="space-y-2">
          {block.badge && <span className="inline-block text-xs font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full">{block.badge}</span>}
          <h3 className="text-lg font-bold text-slate-900">{block.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{block.description}</p>
        </div>
        {block.url && (
          <a href={block.url} className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 uppercase tracking-wide pt-2">
            {block.buttonLabel || 'Learn more'} →
          </a>
        )}
      </div>
    );
  }
  if (block.type === 'teamMember') {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
        {block.image ? (
          <img src={block.image} alt={block.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-cyan-500/20" />
        ) : (
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-cyan-600 to-slate-800 flex items-center justify-center text-white text-xl font-bold">{(block.name || 'SH').slice(0, 2).toUpperCase()}</div>
        )}
        <div>
          <h4 className="font-bold text-slate-900 text-base">{block.name}</h4>
          <p className="text-xs font-semibold text-cyan-700">{block.role}</p>
          {block.location && <p className="text-xs text-slate-400 mt-0.5">{block.location}</p>}
        </div>
        {block.bio && <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-3">{block.bio}</p>}
      </div>
    );
  }
  if (block.type === 'testimonial') {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <p className="text-sm text-slate-700 italic leading-relaxed">"{block.quote}"</p>
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          {block.avatar && <img src={block.avatar} alt={block.author} className="h-10 w-10 rounded-full object-cover" />}
          <div>
            <p className="font-bold text-xs text-slate-900">{block.author}</p>
            <p className="text-xs text-slate-500">{block.role ? `${block.role}, ` : ''}{block.organization}</p>
          </div>
        </div>
      </div>
    );
  }
  if (block.type === 'partnerLogo') {
    return (
      <a href={block.websiteUrl || '#'} target={block.websiteUrl ? '_blank' : undefined} rel="noopener noreferrer" className="p-4 rounded-xl border border-slate-100 bg-white hover:border-cyan-200 shadow-xs flex items-center justify-center h-24 transition-all">
        <img src={block.logoUrl} alt={block.name} className="max-h-12 max-w-full object-contain grayscale hover:grayscale-0 transition-all" />
      </a>
    );
  }
  if (block.type === 'programCard') {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        {block.image && <img src={block.image} alt={block.title} className="h-44 w-full object-cover" />}
        <div className="p-6 space-y-3">
          {block.category && <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{block.category}</span>}
          <h3 className="text-xl font-bold text-slate-900">{block.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{block.description}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            {block.duration && <span>⏱ {block.duration}</span>}
            {block.targetAudience && <span>👥 {block.targetAudience}</span>}
          </div>
        </div>
        {block.actionUrl && (
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <a href={block.actionUrl} className="block text-center text-xs font-bold text-cyan-800 uppercase tracking-wide hover:underline">Apply to Programme →</a>
          </div>
        )}
      </div>
    );
  }
  if (block.type === 'faq') {
    return <div className="space-y-2">{block.items.map((item, index) => <details key={`${block.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold text-slate-900">{item.question}</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.answer}</p></details>)}</div>;
  }
  if (block.type === 'timeline') {
    return <ol className={block.orientation === 'horizontal' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4 border-l-2 border-cyan-200 pl-5'}>{block.items.map((item, index) => <li key={`${block.id}-${index}`} className="relative rounded-lg border border-slate-200 bg-white p-4"><span className="absolute -left-[1.65rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-cyan-600" /><p className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">{item.date}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3>{item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.description}</p>}</li>)}</ol>;
  }
  if (block.type === 'eventCard') {
    return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">{block.image && <CmsMedia src={block.image} kind="image" alt={block.imageAlt || block.title} className="h-48 w-full object-cover" />}<div className="space-y-2 p-5"><h3 className="text-lg font-bold text-slate-900">{block.title}</h3>{block.description && <p className="text-sm leading-relaxed text-slate-600">{block.description}</p>}<p className="text-xs text-slate-500">{[block.date, block.time, block.venue].filter(Boolean).join(' · ')}</p>{block.url && <a href={block.url} className="inline-flex rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white">Event details</a>}</div></article>;
  }
  if (block.type === 'newsCard') {
    return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">{block.image && <CmsMedia src={block.image} kind="image" alt={block.imageAlt || block.title} className="h-48 w-full object-cover" />}<div className="space-y-2 p-5">{block.category && <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">{block.category}</p>}<h3 className="text-lg font-bold text-slate-900">{block.title}</h3>{block.publishedAt && <p className="text-xs text-slate-500">{block.publishedAt}</p>}{block.summary && <p className="text-sm leading-relaxed text-slate-600">{block.summary}</p>}{block.url && <a href={block.url} className="inline-flex rounded-lg border border-cyan-700 px-3 py-2 text-xs font-bold text-cyan-800">Read story</a>}</div></article>;
  }
  if (block.type === 'textImage') {
    const isImageRight = block.layout === 'imageRight';
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${isImageRight ? 'md:flex-row-reverse' : ''}`}>
        {isImageRight ? (
          <>
            <div className="space-y-3">
              {block.heading && <h3 className="text-xl font-bold text-slate-900">{block.heading}</h3>}
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{block.text}</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-sm">
              <CmsMedia src={block.image} kind="image" alt={block.imageAlt || ''} caption={block.caption} className="w-full h-64 object-cover" />
            </div>
          </>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl shadow-sm">
              <CmsMedia src={block.image} kind="image" alt={block.imageAlt || ''} caption={block.caption} className="w-full h-64 object-cover" />
            </div>
            <div className="space-y-3">
              {block.heading && <h3 className="text-xl font-bold text-slate-900">{block.heading}</h3>}
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{block.text}</p>
            </div>
          </>
        )}
      </div>
    );
  }
  if (block.type === 'divider') {
    const heightClasses = block.height === 'lg' ? 'py-8' : block.height === 'sm' ? 'py-2' : 'py-4';
    if (block.style === 'space') return <div className={heightClasses} />;
    const borderClasses = block.style === 'dashed' ? 'border-dashed' : block.style === 'dotted' ? 'border-dotted' : 'border-solid';
    return <div className={heightClasses}><hr className={`border-t border-slate-200 ${borderClasses}`} /></div>;
  }
  if (block.type === 'contactInfo') {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs text-slate-700">
        <h3 className="text-base font-bold text-slate-900">{block.title}</h3>
        {block.email && <div><span className="font-semibold text-slate-500">Email:</span> <a href={`mailto:${block.email}`} className="text-cyan-700 hover:underline">{block.email}</a></div>}
        {block.phone && <div><span className="font-semibold text-slate-500">Phone:</span> <a href={`tel:${block.phone}`} className="text-cyan-700 hover:underline">{block.phone}</a></div>}
        {block.address && <div><span className="font-semibold text-slate-500">Address:</span> <span>{block.address}</span></div>}
        {block.hours && <div><span className="font-semibold text-slate-500">Hours:</span> <span>{block.hours}</span></div>}
      </div>
    );
  }
  if (block.type === 'customHtml') {
    const sanitizedHtml = block.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    return <div className="cms-custom-html" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }
  return null;
};

const Block: React.FC<{ block: CmsContentBlock }> = ({ block }) => {
  if (block.type === 'heading' || block.type === 'subheading' || block.type === 'paragraph' || block.type === 'richText' || block.type === 'list' || block.type === 'quote') {
    return <TextBlock block={block} />;
  }
  if (block.type === 'image' || block.type === 'video' || block.type === 'gallery' || block.type === 'videoGallery' || block.type === 'embed' || block.type === 'document') {
    return <MediaBlock block={block} />;
  }
  return <ComponentBlock block={block as never} />;
};

export const CmsSectionRenderer: React.FC<{ section: CmsPageSection }> = ({ section }) => {
  if (!section.visible || section.archived) return null;
  const gridStyle = {
    '--cms-columns-mobile': section.layout.mobileColumns,
    '--cms-columns-tablet': section.layout.tabletColumns,
    '--cms-columns-desktop': section.layout.desktopColumns
  } as React.CSSProperties;
  const widthClass = section.layout.contentWidth === 'full' ? 'w-full' : section.layout.contentWidth === 'wide' ? 'max-w-[90rem]' : 'max-w-7xl';
  const borderClass = section.layout.borderStyle === 'solid' ? 'border border-slate-200' : section.layout.borderStyle === 'dashed' ? 'border border-dashed border-slate-300' : '';
  return (
    <section id={`cms-${section.id}`} aria-label={section.name} className={`cms-section ${borderClass}`} style={{ backgroundColor: section.layout.backgroundColor, color: section.layout.textColor, paddingBlock: spacing[section.layout.spacing] }}>
      <div className={`mx-auto ${widthClass} space-y-5 px-4 sm:px-6 lg:px-8`}>
        {(section.name || section.description) && <header><h2 className="text-2xl font-bold">{section.name}</h2>{section.description && <p className="mt-2 text-sm opacity-80">{section.description}</p>}</header>}
        <div className="cms-section-grid" style={gridStyle}>{section.blocks.map(block => <div key={block.id} className="min-w-0 space-y-3"><Block block={block} /></div>)}</div>
      </div>
    </section>
  );
};
