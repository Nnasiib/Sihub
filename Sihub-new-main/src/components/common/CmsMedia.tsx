import React from 'react';
import { parseCmsMediaUrl, type CmsMediaKind } from '../../utils/mediaUrl';

interface CmsMediaProps {
  src?: string | null;
  kind: CmsMediaKind;
  alt?: string;
  caption?: string;
  className?: string;
  autoPlay?: boolean;
}

export const CmsMedia: React.FC<CmsMediaProps> = ({ src, kind, alt = '', caption, className = '', autoPlay = false }) => {
  if (!src) return null;

  let parsed;
  try {
    parsed = parseCmsMediaUrl(src, kind);
  } catch {
    if (/^\/api\/media\/[A-Za-z0-9_-]+\/public$/.test(src)) parsed = { kind, provider: 'direct' as const, url: src };
    else return null;
  }

  const content = parsed.embedUrl
    ? <iframe
        src={parsed.embedUrl}
        title={alt || 'Embedded video'}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    : parsed.kind === 'video'
      ? <video
          src={parsed.url}
          aria-label={alt || undefined}
          controls={!autoPlay}
          autoPlay={autoPlay}
          muted={autoPlay}
          loop={autoPlay}
          playsInline
          preload="metadata"
          className={className}
        />
      : <img src={parsed.url} alt={alt} loading="lazy" className={className} />;

  return caption
    ? <figure className="space-y-1">{content}<figcaption className="text-xs text-slate-500">{caption}</figcaption></figure>
    : content;
};
