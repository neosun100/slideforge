import PptxGenJS from 'pptxgenjs';
import { createLogger } from '@/shared/utils/logger';
import { rgbToPptxHex } from './pptxBuilder';
import { laplaceInpaint } from '@/features/inpaint/services/laplaceInpaint';
import type { TextRegion, ErasedRegion, ExportOptions } from '@/shared/types';

const log = createLogger('export');

interface SlideData {
  imageData: ImageData;
  textRegions: TextRegion[];
  erasedRegions: ErasedRegion[];
}

export async function exportToPPTX(
  slides: SlideData[],
  options: ExportOptions,
  onProgress?: (percent: number, message: string) => void,
): Promise<void> {
  const start = performance.now();
  const report = (pct: number, msg: string) => onProgress?.(pct, msg);

  report(0, 'Preparing slide backgrounds...');

  // Generate inpainted backgrounds
  const backgrounds: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    report(Math.round((i / slides.length) * 70), `Processing slide ${i + 1}/${slides.length}...`);
    const bg = await generateBackground(slides[i]!, options);
    backgrounds.push(bg);
    // Yield to UI
    await new Promise(r => setTimeout(r, 0));
  }

  report(70, 'Building presentation...');

  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'CUSTOM', width: options.width, height: options.height });
  prs.layout = 'CUSTOM';

  for (let i = 0; i < slides.length; i++) {
    const slide = prs.addSlide();
    const slideData = slides[i]!;

    // Background image
    slide.addImage({
      data: backgrounds[i]!,
      x: 0, y: 0,
      w: '100%', h: '100%',
    });

    // Scale factors: map pixel coords to slide inches proportionally
    const imgW = slideData.imageData.width;
    const imgH = slideData.imageData.height;
    const sx = options.width / imgW;   // inches per pixel (horizontal)
    const sy = options.height / imgH;  // inches per pixel (vertical)

    // Text boxes
    for (const region of slideData.textRegions) {
      const bb = region.boundingBox;
      const xIn = bb.x * sx;
      const yIn = bb.y * sy;
      const wIn = bb.width * sx;
      const hIn = bb.height * sy;
      // Font size: derive from box height in inches → points (1 inch = 72pt)
      const fontPt = Math.max(6, Math.round(hIn * 72 * 0.85));

      slide.addText(region.text, {
        x: xIn,
        y: yIn,
        w: wIn,
        h: hIn,
        fontSize: fontPt,
        color: rgbToPptxHex(region.textColor),
        fontFace: 'Arial',
        valign: 'middle',
        margin: [1, 2, 1, 2],
        autoFit: true,
      });
    }

    report(70 + Math.round(((i + 1) / slides.length) * 25), `Added slide ${i + 1}/${slides.length}`);
  }

  report(95, 'Generating file...');
  await prs.writeFile({ fileName: 'slideforge-export.pptx' });

  log.perf(`PPTX export: ${slides.length} slides`, start);
  report(100, 'Export complete!');
}

async function generateBackground(slide: SlideData, options: ExportOptions): Promise<string> {
  const { width, height } = slide.imageData;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw original image
  const bmp = await createImageBitmap(slide.imageData);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

  // Apply inpainting for erased regions
  if (slide.erasedRegions.length > 0) {
    const imgData = ctx.getImageData(0, 0, width, height);
    for (const er of slide.erasedRegions) {
      laplaceInpaint(imgData, er.boundingBox);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Also inpaint text regions (clean background for export)
  if (slide.textRegions.length > 0) {
    const imgData = ctx.getImageData(0, 0, width, height);
    for (const tr of slide.textRegions) {
      laplaceInpaint(imgData, tr.boundingBox);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Convert to data URL
  const format = options.backgroundFormat === 'png' ? 'image/png' : 'image/jpeg';
  const quality = options.backgroundFormat === 'jpeg' ? options.jpegQuality : undefined;

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) { reject(new Error('toBlob failed')); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      },
      format,
      quality,
    );
  });
}
