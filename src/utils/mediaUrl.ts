export type CmsMediaKind = 'image' | 'video';
export type CmsMediaProvider = 'direct' | 'youtube' | 'vimeo';

export type ParsedMediaUrl = {
  kind: CmsMediaKind;
  provider: CmsMediaProvider;
  url: string;
  embedUrl?: string;
};

const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const videoExtensions = new Set(['.m4v', '.mov', '.mp4', '.ogg', '.ogv', '.webm']);
const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be', 'www.youtu.be']);
const vimeoHosts = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

const getExtension = (pathname: string) => {
  const filename = pathname.split('/').pop() ?? '';
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
};

const getYouTubeId = (url: URL) => {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? '';
  if (url.pathname === '/watch') return url.searchParams.get('v') ?? '';
  const [, , id] = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/) ?? [];
  return id ?? '';
};

export const parseCmsMediaUrl = (rawUrl: string, requestedKind: CmsMediaKind): ParsedMediaUrl => {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Enter a valid HTTPS media URL.');
  }

  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error('Media URLs must use HTTPS and cannot include credentials.');
  }

  const host = url.hostname.toLowerCase();
  if (youtubeHosts.has(host)) {
    if (requestedKind !== 'video') throw new Error('YouTube URLs can only be used as video media.');
    const id = getYouTubeId(url);
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('Enter a valid YouTube video URL.');
    return { kind: 'video', provider: 'youtube', url: url.href, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (vimeoHosts.has(host)) {
    if (requestedKind !== 'video') throw new Error('Vimeo URLs can only be used as video media.');
    const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
    if (!id) throw new Error('Enter a valid Vimeo video URL.');
    const privacyHash = url.searchParams.get('h');
    return {
      kind: 'video',
      provider: 'vimeo',
      url: url.href,
      embedUrl: `https://player.vimeo.com/video/${id}${privacyHash ? `?h=${encodeURIComponent(privacyHash)}` : ''}`
    };
  }

  const extension = getExtension(url.pathname);
  if (extension && requestedKind === 'image' && !imageExtensions.has(extension)) {
    throw new Error('The URL does not look like a supported image.');
  }
  if (extension && requestedKind === 'video' && !videoExtensions.has(extension)) {
    throw new Error('The URL does not look like a supported video.');
  }

  return { kind: requestedKind, provider: 'direct', url: url.href };
};
