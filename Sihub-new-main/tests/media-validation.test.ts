import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesMediaContentType, validateImageUpload, validateMediaUpload } from '../server/mediaValidation';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lE8AAAAASUVORK5CYII=', 'base64');
const mp4Header = Buffer.from('000000186674797069736f6d0000000069736f6d', 'hex');

test('image upload metadata accepts supported images and rejects unsupported types and sizes', () => {
  assert.equal(validateImageUpload('image/png', onePixelPng.length), null);
  assert.equal(validateImageUpload('application/pdf', 100)?.status, 400);
  assert.equal(validateImageUpload('image/jpeg', 25 * 1024 * 1024 + 1)?.status, 413);
  assert.equal(validateImageUpload('image/webp', 0)?.status, 400);
});

test('general media upload metadata keeps existing video limits', () => {
  assert.equal(validateMediaUpload('video/mp4', 250 * 1024 * 1024), null);
  assert.equal(validateMediaUpload('video/mp4', 250 * 1024 * 1024 + 1)?.status, 413);
  assert.equal(validateMediaUpload('text/html', 100)?.status, 400);
});

test('uploaded image bytes must match the declared content type', async () => {
  assert.equal(await matchesMediaContentType(onePixelPng, 'image/png'), true);
  assert.equal(await matchesMediaContentType(onePixelPng, 'image/jpeg'), false);
  assert.equal(await matchesMediaContentType(Buffer.from('not an image'), 'image/png'), false);
  assert.equal(await matchesMediaContentType(mp4Header, 'video/mp4'), true);
  assert.equal(await matchesMediaContentType(mp4Header, 'video/webm'), false);
});
