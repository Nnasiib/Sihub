import { useCmsCollection } from './useCmsCollection';

export type CmsPageFields = {
  slug?: string;
  title?: string | null;
  summary?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

export function useCmsPage<T extends CmsPageFields = CmsPageFields>(slug: string) {
  const { items, loading, error } = useCmsCollection<T>('page');
  return { page: items.find(item => item.slug === slug), loading, error };
}
