import { createLogger } from '@/shared/utils/logger';
import type { AppDocument, Page } from '@/shared/types';

const log = createLogger('image');

/** Load an image file (PNG/JPG/WebP) into a single-page document */
export async function loadImageFile(file: File): Promise<AppDocument> {
  const start = performance.now();
  log.info('Loading image', { name: file.name, size: file.size });

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const page: Page = { index: 0, width: canvas.width, height: canvas.height, imageData };

  log.perf('Image loaded', start, { w: canvas.width, h: canvas.height });

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'image',
    metadata: { fileName: file.name, fileSize: file.size, mimeType: file.type },
    pages: [page],
  };
}
