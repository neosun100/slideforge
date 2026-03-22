import { createLogger } from '@/shared/utils/logger';
import type { Page, FileMetadata } from '@/shared/types';

const log = createLogger('pdf');

interface ParseOptions {
  maxPages?: number;
  renderScale?: number;
  onFileAccepted?: (meta: FileMetadata, pageCount: number) => void;
  onPageRendered?: (page: Page, index: number, total: number) => void;
  onError?: (msg: string) => void;
}

/** Read file as ArrayBuffer (works in jsdom and browsers) */
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Check PDF magic bytes (%PDF-) */
export async function isPdfByMagicBytes(file: File): Promise<boolean> {
  try {
    const buf = await readAsArrayBuffer(file);
    if (buf.byteLength < 5) return false;
    const bytes = new Uint8Array(buf, 0, 5);
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D;
  } catch { return false; }
}

/** Parse PDF file with streaming page-by-page rendering */
export async function parsePdfStreaming(file: File, opts: ParseOptions = {}): Promise<void> {
  const { maxPages = 0, renderScale = 1, onFileAccepted, onPageRendered, onError } = opts;
  const start = performance.now();

  log.info('Loading PDF', { name: file.name, size: file.size });

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: arrayBuffer, disableRange: true, disableStream: true }).promise;
  } catch (e) {
    const msg = `Failed to load PDF: ${e instanceof Error ? e.message : 'Unknown error'}`;
    log.error(msg);
    onError?.(msg);
    return;
  }

  const totalPages = doc.numPages;
  const pagesToRender = maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages;

  const meta: FileMetadata = { fileName: file.name, fileSize: file.size, mimeType: file.type || 'application/pdf' };
  onFileAccepted?.(meta, pagesToRender);

  log.info(`PDF loaded: ${totalPages} pages, rendering ${pagesToRender}`, { renderScale });

  for (let i = 0; i < pagesToRender; i++) {
    try {
      const pdfPage = await doc.getPage(i + 1);
      const viewport = pdfPage.getViewport({ scale: renderScale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await pdfPage.render({ canvasContext: ctx, viewport } as never).promise;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const page: Page = { index: i, width: canvas.width, height: canvas.height, imageData };

      onPageRendered?.(page, i, pagesToRender);
      log.info(`Page ${i + 1}/${pagesToRender} rendered`, { w: canvas.width, h: canvas.height });

      // Yield to UI
      await new Promise(r => setTimeout(r, 0));
    } catch (e) {
      const msg = `Failed to render page ${i + 1}: ${e instanceof Error ? e.message : 'Unknown'}`;
      log.error(msg);
      onError?.(msg);
    }
  }

  await doc.destroy();
  log.perf('PDF parsing complete', start);
}
