import test from 'node:test';
import assert from 'node:assert/strict';

import { validateCmsMediaContent } from '../server/cmsMediaValidation';

test('CMS API accepts direct and provider media URLs stored with media type metadata', () => {
  assert.equal(validateCmsMediaContent({
    coverImage: 'https://cdn.example.test/cover.webp',
    coverImageType: 'image',
    heroVideo: 'https://youtu.be/abcdefghijk',
    heroVideoType: 'video'
  }), null);
});

test('CMS API accepts uploaded media references and rejects unsafe external media URLs', () => {
  assert.equal(validateCmsMediaContent({ bannerVideo: '/api/media/cmsasset123/public', bannerVideoType: 'video' }), null);
  assert.match(validateCmsMediaContent({ heroImage: 'javascript:alert(1)', heroImageType: 'image' }) ?? '', /HTTPS/);
  assert.match(validateCmsMediaContent({ coverImage: 'https://cdn.example.test/clip.mp4', coverImageType: 'image' }) ?? '', /image/);
});
