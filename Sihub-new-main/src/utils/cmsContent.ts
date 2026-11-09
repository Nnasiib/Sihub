const publicMediaPattern = /^\/api\/media\/([^/]+)\/public$/;

export const getCmsMediaIds = (content: Record<string, unknown>) => {
  const ids = content.mediaAssetIds;
  const assetIds = new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      const match = value.match(publicMediaPattern);
      if (match) assetIds.add(match[1]);
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(content);
  return [...assetIds];
};

export const findCmsMediaPath = (content: Record<string, unknown>): string => {
  const visit = (value: unknown, path: string[]): string | null => {
    if (typeof value === 'string') {
      const field = path[path.length - 1] ?? '';
      if (publicMediaPattern.test(value) || (/(image|video|photo|thumbnail|cover|banner|avatar|logo)/i.test(field) && /^https?:\/\//i.test(value))) return path.join('.');
    }
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const found = visit(value[index], [...path, String(index)]);
        if (found) return found;
      }
    } else if (value && typeof value === 'object') {
      for (const [key, nested] of Object.entries(value)) {
        if (key === 'mediaAssetIds') continue;
        const found = visit(nested, [...path, key]);
        if (found) return found;
      }
    }
    return null;
  };

  return visit(content, []) ?? 'coverImage';
};

export const getCmsValueAtPath = (content: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((value, part) => {
    if (Array.isArray(value) && /^\d+$/.test(part)) return value[Number(part)];
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[part];
    return undefined;
  }, content);
};

export const cmsContentReferencesAsset = (content: Record<string, unknown>, assetId: string): boolean => {
  const mediaUrl = `/api/media/${assetId}/public`;
  const visit = (value: unknown): boolean => {
    if (value === mediaUrl) return true;
    if (Array.isArray(value)) return value.some(visit);
    if (value && typeof value === 'object') return Object.entries(value).some(([key, nested]) => key !== 'mediaAssetIds' && visit(nested));
    return false;
  };
  return visit(content);
};

export const setCmsValueAtPath = (content: Record<string, unknown>, path: string, value: string) => {
  const parts = path.split('.');
  if (!parts.length || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part) || ['__proto__', 'constructor', 'prototype'].includes(part))) {
    throw new Error('Use a valid content field path.');
  }

  let current: Record<string, unknown> | unknown[] = content;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const nextIsArray = /^\d+$/.test(parts[index + 1]);
    let child: unknown;

    if (Array.isArray(current)) {
      if (!/^\d+$/.test(part) || Number(part) > 100) throw new Error('Use a valid array index in the content field path.');
      child = current[Number(part)];
      if (!child || typeof child !== 'object') current[Number(part)] = child = nextIsArray ? [] : {};
    } else {
      child = current[part];
      if (!child || typeof child !== 'object') current[part] = child = nextIsArray ? [] : {};
    }

    current = child as Record<string, unknown> | unknown[];
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(current)) {
    if (!/^\d+$/.test(last) || Number(last) > 100) throw new Error('Use a valid array index in the content field path.');
    current[Number(last)] = value;
  } else {
    current[last] = value;
  }
  return content;
};

export const removeCmsMediaAsset = (content: Record<string, unknown>, assetId: string) => {
  const mediaUrl = `/api/media/${assetId}/public`;
  const clean = (value: unknown): unknown => {
    if (value === mediaUrl) return '';
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, key === 'mediaAssetIds' ? nested : clean(nested)]));
    }
    return value;
  };
  const updated = clean(content) as Record<string, unknown>;
  const stillReferenced = (value: unknown): boolean => {
    if (value === mediaUrl) return true;
    if (Array.isArray(value)) return value.some(stillReferenced);
    if (value && typeof value === 'object') return Object.entries(value).some(([key, nested]) => key !== 'mediaAssetIds' && stillReferenced(nested));
    return false;
  };

  if (!stillReferenced(updated)) updated.mediaAssetIds = getCmsMediaIds(updated).filter(id => id !== assetId);
  return updated;
};