import React from 'react';
import { useCmsPage } from '../../hooks/useCmsPage';
import { CmsSectionRenderer } from '../common/CmsSectionRenderer';
import type { CmsPageSection } from '../../types/cmsBlocks';

type DynamicPage = {
  title?: string;
  summary?: string;
  sections?: CmsPageSection[];
};

export const DynamicCmsPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { page, loading, error } = useCmsPage<DynamicPage>(slug);

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-500">Loading page…</main>;
  if (error || !page) return <main className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-2xl font-bold text-slate-900">Page unavailable</h1><p className="mt-2 text-sm text-slate-600">This page may be unpublished or no longer available.</p></main>;

  const sections = (page.sections ?? []).filter(section => section.visible && !section.archived).sort((left, right) => left.order - right.order);
  const topSections = sections.filter(section => section.placement === 'top');
  const bottomSections = sections.filter(section => section.placement === 'bottom');

  return (
    <main>
      {topSections.map(section => <CmsSectionRenderer key={section.id} section={section} />)}
      <header className="mx-auto max-w-7xl space-y-3 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900">{page.title}</h1>
        {page.summary && <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{page.summary}</p>}
      </header>
      {bottomSections.map(section => <CmsSectionRenderer key={section.id} section={section} />)}
    </main>
  );
};
