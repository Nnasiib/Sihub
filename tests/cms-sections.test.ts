import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDynamicPageSections } from '../server/cmsSections.ts';

const validSection = {
  sections: [{
    id: 'hero-extra',
    name: 'Research highlights',
    description: 'Current projects',
    placement: 'bottom',
    order: 0,
    visible: true,
    archived: false,
    layout: { desktopColumns: 3, tabletColumns: 2, mobileColumns: 1, backgroundColor: '#ffffff', textColor: '#172033', spacing: 'normal' },
    blocks: [
      { id: 'title', type: 'heading', text: 'New work', level: 2 },
      { id: 'rich', type: 'richText', text: 'Read **verified** information.' },
      { id: 'media', type: 'image', src: '/api/media/asset_123/public', alt: 'Lab team', aspectRatio: '16/9' },
      { id: 'link', type: 'button', label: 'Programs', url: '/programs' }
    ]
  }]
};

test('valid CMS page sections accept structured blocks, responsive layouts and uploaded media paths', () => {
  assert.equal(validateDynamicPageSections(validSection), null);
});

test('CMS page sections reject unsafe URLs, unsupported colors, and malformed block data', () => {
  assert.ok(validateDynamicPageSections({ sections: [{ ...validSection.sections[0], blocks: [{ id: 'x', type: 'image', src: 'javascript:alert(1)', alt: '' }] }] }));
  assert.ok(validateDynamicPageSections({ sections: [{ ...validSection.sections[0], layout: { ...validSection.sections[0].layout, backgroundColor: 'red' } }] }));
});

test('CMS page sections accept FAQ, timeline, event, news, video gallery, width, and border settings', () => {
  assert.equal(validateDynamicPageSections({ sections: [{
    ...validSection.sections[0],
    layout: { ...validSection.sections[0].layout, contentWidth: 'wide', borderStyle: 'dashed' },
    blocks: [
      { id: 'faq', type: 'faq', items: [{ question: 'Where?', answer: 'At the SiHub campus.' }] },
      { id: 'timeline', type: 'timeline', orientation: 'horizontal', items: [{ date: '2026', title: 'Launch' }] },
      { id: 'event', type: 'eventCard', title: 'Community session', date: '2026-12-01' },
      { id: 'news', type: 'newsCard', title: 'Programme update', summary: 'A short update.' },
      { id: 'videos', type: 'videoGallery', items: [{ src: 'https://youtu.be/abcdefghijk', alt: 'Talk' }] }
    ]
  }] }), null);
});
