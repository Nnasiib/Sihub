import test from 'node:test';
import assert from 'node:assert/strict';

import { cmsContentReferencesAsset, findCmsMediaPath, getCmsMediaIds, removeCmsMediaAsset, setCmsValueAtPath } from '../src/utils/cmsContent';

test('CMS image references can target nested content paths and be removed', () => {
  const content: Record<string, unknown> = { team: [{ name: 'Test' }], mediaAssetIds: [] };
  setCmsValueAtPath(content, 'team.0.image', '/api/media/asset-one/public');
  content.mediaAssetIds = ['asset-one'];

  assert.equal(findCmsMediaPath(content), 'team.0.image');
  assert.deepEqual(getCmsMediaIds(content), ['asset-one']);
  assert.deepEqual(removeCmsMediaAsset(content, 'asset-one'), { team: [{ name: 'Test', image: '' }], mediaAssetIds: [] });
});

test('CMS image path setter rejects prototype-mutating paths', () => {
  assert.throws(() => setCmsValueAtPath({}, '__proto__.polluted', 'yes'), /valid content field path/);
});

test('existing external CMS images are discoverable for preview and replacement', () => {
  assert.equal(findCmsMediaPath({ team: [{ image: 'https://example.test/team.jpg' }] }), 'team.0.image');
  assert.equal(findCmsMediaPath({ heroVideo: 'https://example.test/promo.mp4' }), 'heroVideo');
});

test('shared CMS image assets remain referenced when only one field is replaced', () => {
  const content = { heroImage: '/api/media/shared-asset/public', team: [{ image: '/api/media/shared-asset/public' }], mediaAssetIds: ['shared-asset'] };
  setCmsValueAtPath(content, 'heroImage', '/api/media/new-asset/public');

  assert.equal(cmsContentReferencesAsset(content, 'shared-asset'), true);
  assert.deepEqual(getCmsMediaIds(content), ['shared-asset', 'new-asset']);
});

test('CMS media IDs are discovered from nested dynamic section blocks', () => {
  const content = {
    sections: [{ blocks: [{ type: 'gallery', items: [{ src: '/api/media/gallery-asset/public' }] }, { type: 'video', src: '/api/media/video-asset/public' }] }]
  };

  assert.deepEqual(getCmsMediaIds(content), ['gallery-asset', 'video-asset']);
});