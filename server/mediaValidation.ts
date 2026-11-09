import { fileTypeFromBuffer } from 'file-type';

const allowedMediaTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']);
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const validateMediaUpload = (contentType: string, byteSize: number) => {
  if (!allowedMediaTypes.has(contentType)) return { status: 400, message: 'Unsupported media file' };
  if (!Number.isInteger(byteSize) || byteSize <= 0) return { status: 400, message: 'Invalid media file size' };
  const sizeLimit = contentType.startsWith('video/') ? 250 * 1024 * 1024 : 25 * 1024 * 1024;
  if (byteSize > sizeLimit) return { status: 413, message: 'Media file exceeds the permitted size' };
  return null;
};

export const validateImageUpload = (contentType: string, byteSize: number) => {
  if (!imageTypes.has(contentType)) return { status: 400, message: 'Unsupported image file' };
  if (!Number.isInteger(byteSize) || byteSize <= 0 || byteSize > 25 * 1024 * 1024) {
    return { status: byteSize > 25 * 1024 * 1024 ? 413 : 400, message: 'Invalid image file size' };
  }
  return null;
};

export const matchesMediaContentType = async (buffer: Uint8Array, contentType: string) => {
  const detected = await fileTypeFromBuffer(buffer);
  return Boolean(detected && allowedMediaTypes.has(detected.mime) && detected.mime === contentType);
};
