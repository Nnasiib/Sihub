import { parseCmsMediaUrl } from '../src/utils/mediaUrl';

const uploadedMediaPath = /^\/api\/media\/[A-Za-z0-9_-]+\/public$/;

export const validateCmsMediaContent = (content: unknown): string | null => {
  const visit = (value: unknown): string | null => {
    if (Array.isArray(value)) {
      for (const child of value) {
        const error = visit(child);
        if (error) return error;
      }
      return null;
    }
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    for (const [key, mediaKind] of Object.entries(record)) {
      if (key.endsWith('Type') && (mediaKind === 'image' || mediaKind === 'video')) {
        const mediaValue = record[key.slice(0, -4)];
        if (typeof mediaValue === 'string') {
          if (uploadedMediaPath.test(mediaValue)) continue;
          try {
            parseCmsMediaUrl(mediaValue, mediaKind);
          } catch (error) {
            return error instanceof Error ? error.message : 'Invalid media URL.';
          }
        }
      }

      const error = visit(record[key]);
      if (error) return error;
    }
    return null;
  };

  return visit(content);
};
