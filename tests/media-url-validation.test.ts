import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCmsMediaUrl } from '../src/utils/mediaUrl';

test('direct HTTPS image and video URLs are accepted by selected media type', () => {
  assert.deepEqual(parseCmsMediaUrl('https://cdn.example.test/team.webp?size=large', 'image'), {
    kind: 'image', provider: 'direct', url: 'https://cdn.example.test/team.webp?size=large'
  });
  assert.equal(parseCmsMediaUrl('https://cdn.example.test/launch.mp4?token=sample', 'video').kind, 'video');
  assert.equal(parseCmsMediaUrl('https://media.example.test/signed-resource', 'image').provider, 'direct');
});

test('YouTube and Vimeo URLs are normalized to safe embed URLs', () => {
  assert.equal(parseCmsMediaUrl('https://www.youtube.com/watch?v=abcdefghijk', 'video').embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(parseCmsMediaUrl('https://youtu.be/abcdefghijk', 'video').embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(parseCmsMediaUrl('https://vimeo.com/123456789', 'video').embedUrl, 'https://player.vimeo.com/video/123456789');
  assert.equal(parseCmsMediaUrl('https://vimeo.com/123456789?h=privatehash', 'video').embedUrl, 'https://player.vimeo.com/video/123456789?h=privatehash');
});

test('unsafe, malformed, and mismatched media URLs are rejected', () => {
  assert.throws(() => parseCmsMediaUrl('javascript:alert(1)', 'image'), /HTTPS/);
  assert.throws(() => parseCmsMediaUrl('http://cdn.example.test/image.jpg', 'image'), /HTTPS/);
  assert.throws(() => parseCmsMediaUrl('https://user:pass@cdn.example.test/image.jpg', 'image'), /credentials/);
  assert.throws(() => parseCmsMediaUrl('https://youtu.be/invalid', 'video'), /YouTube/);
  assert.throws(() => parseCmsMediaUrl('https://youtube.com/watch?v=abcdefghijk', 'image'), /video media/);
  assert.throws(() => parseCmsMediaUrl('https://cdn.example.test/clip.mp4', 'image'), /supported image/);
  assert.throws(() => parseCmsMediaUrl('https://cdn.example.test/photo.png', 'video'), /supported video/);
});
