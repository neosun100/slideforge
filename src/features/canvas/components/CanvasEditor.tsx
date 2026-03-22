import { memo, useRef, useEffect, useCallback, useState } from 'react';
import type { Page, TextRegion, ErasedRegion, ActiveTool, BBox } from '@/shared/types';
import { laplaceInpaint } from '@/features/inpaint/services/laplaceInpaint';

interface Props {
  page: Page;
  textRegions: TextRegion[];
  erasedRegions: ErasedRegion[];
  activeTool: ActiveTool;
  zoomLevel: number;
  showBoundingBoxes: boolean;
  selectedIds: Set<string>;
  hoveredId: string | null;
  onSelectRegion: (id: string, multi: boolean) => void;
  onHoverRegion: (id: string | null) => void;
  onEraseRegion: (id: string) => void;
  onEditRegion?: (id: string) => void;
  onRegionOCR?: (bbox: BBox) => void;
  onDeselectAll: () => void;
  onZoomChange: (z: number) => void;
}

export const CanvasEditor = memo(function CanvasEditor({
  page, textRegions, erasedRegions, activeTool, zoomLevel,
  showBoundingBoxes, selectedIds, hoveredId,
  onSelectRegion, onHoverRegion, onEraseRegion, onEditRegion, onRegionOCR, onDeselectAll, onZoomChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 });
  const bitmapCacheRef = useRef<{ pageIndex: number; bitmap: ImageBitmap | null }>({ pageIndex: -1, bitmap: null });
  const [dragBox, setDragBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (r) setContainerSize({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Compute display scale
  const pad = 32;
  const fitScale = Math.min(1, (containerSize.w - pad * 2) * 0.9 / page.width, (containerSize.h - pad * 2) * 0.9 / page.height);
  const displayScale = fitScale * zoomLevel;
  const displayW = Math.round(page.width * displayScale);
  const displayH = Math.round(page.height * displayScale);

  // Memoize erased regions fingerprint to avoid unnecessary re-renders
  const erasedFp = erasedRegions.map(e => `${e.id}:${e.inpaintMode}`).join(',');

  // Render canvas with bitmap caching
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (c.width !== page.width) c.width = page.width;
    if (c.height !== page.height) c.height = page.height;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const cache = bitmapCacheRef.current;

    (async () => {
      // Reuse cached bitmap if same page
      let bmp: ImageBitmap;
      if (cache.pageIndex === page.index && cache.bitmap) {
        bmp = cache.bitmap;
      } else {
        cache.bitmap?.close();
        bmp = await createImageBitmap(page.imageData);
        if (cancelled) { bmp.close(); return; }
        cache.pageIndex = page.index;
        cache.bitmap = bmp;
      }
      ctx.drawImage(bmp, 0, 0);

      // Apply laplace inpainting for erased regions
      if (erasedRegions.length > 0) {
        const imgData = ctx.getImageData(0, 0, page.width, page.height);
        for (const er of erasedRegions) {
          if (er.inpaintMode === 'laplace') laplaceInpaint(imgData, er.boundingBox);
        }
        if (!cancelled) ctx.putImageData(imgData, 0, 0);
      }
    })();

    return () => { cancelled = true; };
  }, [page.index, page.width, page.height, erasedFp]);

  // Wheel zoom (use refs to avoid effect re-runs)
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;
  const onZoomRef = useRef(onZoomChange);
  onZoomRef.current = onZoomChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      onZoomRef.current(Math.min(4, Math.max(0.25, zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
      onDeselectAll();
    }
  }, [onDeselectAll]);

  const handleRegionClick = useCallback((r: TextRegion, e: React.MouseEvent) => {
    if (activeTool === 'erase') {
      onEraseRegion(r.id);
    } else {
      onSelectRegion(r.id, e.shiftKey || e.metaKey || e.ctrlKey);
    }
  }, [activeTool, onEraseRegion, onSelectRegion]);

  const handleRegionDoubleClick = useCallback((r: TextRegion) => {
    if (activeTool === 'select') onEditRegion?.(r.id);
  }, [activeTool, onEditRegion]);

  // Region OCR drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'region') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;
    setDragBox({ startX: x, startY: y, endX: x, endY: y });
  }, [activeTool, displayScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragBox) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;
    setDragBox(prev => prev ? { ...prev, endX: x, endY: y } : null);
  }, [dragBox, displayScale]);

  const handleMouseUp = useCallback(() => {
    if (!dragBox) return;
    const x = Math.min(dragBox.startX, dragBox.endX);
    const y = Math.min(dragBox.startY, dragBox.endY);
    const w = Math.abs(dragBox.endX - dragBox.startX);
    const h = Math.abs(dragBox.endY - dragBox.startY);
    setDragBox(null);
    if (w > 10 && h > 10) onRegionOCR?.({ x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
  }, [dragBox, onRegionOCR]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-auto flex items-center justify-center p-4 ${activeTool === 'erase' ? 'cursor-crosshair' : ''}`}
      style={{ background: '#333' }}
    >
      <div className="relative shadow-xl" style={{ width: displayW, height: displayH, background: '#fff' }} onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <canvas ref={canvasRef} style={{ width: displayW, height: displayH }} />

        {/* Text region overlays */}
        {textRegions.map(r => {
          const sel = selectedIds.has(r.id);
          const hov = hoveredId === r.id && !sel;
          const visible = sel || hov || showBoundingBoxes;
          return (
            <div
              key={r.id}
              className={`absolute cursor-pointer transition-all ${
                activeTool === 'erase' ? 'cursor-crosshair' : ''
              }`}
              style={{
                left: r.boundingBox.x * displayScale,
                top: r.boundingBox.y * displayScale,
                width: r.boundingBox.width * displayScale,
                height: r.boundingBox.height * displayScale,
                border: sel ? '2px solid var(--accent)' : hov ? '2px dashed rgba(56,189,248,0.7)' : visible ? '1.5px dashed rgba(56,189,248,0.4)' : '1.5px solid transparent',
                background: sel ? 'rgba(var(--accent-rgb,56,189,248),0.08)' : hov ? 'rgba(56,189,248,0.05)' : 'transparent',
              }}
              onClick={(e) => { e.stopPropagation(); handleRegionClick(r, e); }}
              onDoubleClick={(e) => { e.stopPropagation(); handleRegionDoubleClick(r); }}
              onMouseEnter={() => onHoverRegion(r.id)}
              onMouseLeave={() => onHoverRegion(null)}
              title={r.text}
            >
              {/* Tooltip on hover */}
              {hov && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] rounded bg-gray-900/90 text-white whitespace-nowrap z-30 pointer-events-none">
                  {r.text.length > 40 ? r.text.slice(0, 40) + '…' : r.text}
                </div>
              )}
              {/* Delete + resize buttons on selected */}
              {sel && activeTool === 'select' && (
                <>
                  <button
                    className="absolute -top-5 right-0 px-1.5 py-0.5 text-[10px] rounded bg-red-600/90 text-white border border-white/60 cursor-pointer z-20"
                    onClick={(e) => { e.stopPropagation(); onEraseRegion(r.id); }}
                  >✕</button>
                  {/* Resize handle indicator */}
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-sm bg-gray-500/80 border border-white/60 z-20 pointer-events-none" />
                </>
              )}
            </div>
          );
        })}

        {/* Erased region overlays */}
        {erasedRegions.map(er => (
          <div
            key={er.id}
            className="absolute pointer-events-none"
            style={{
              left: er.boundingBox.x * displayScale,
              top: er.boundingBox.y * displayScale,
              width: er.boundingBox.width * displayScale,
              height: er.boundingBox.height * displayScale,
            }}
          />
        ))}

        {/* Region OCR drag selection overlay */}
        {dragBox && (
          <div
            className="absolute border-2 border-dashed border-green-400 bg-green-400/10 pointer-events-none z-30"
            style={{
              left: Math.min(dragBox.startX, dragBox.endX) * displayScale,
              top: Math.min(dragBox.startY, dragBox.endY) * displayScale,
              width: Math.abs(dragBox.endX - dragBox.startX) * displayScale,
              height: Math.abs(dragBox.endY - dragBox.startY) * displayScale,
            }}
          />
        )}
      </div>

      {/* Minimap when zoomed in */}
      {zoomLevel > 1 && <Minimap page={page} containerRef={containerRef} displayScale={displayScale} />}
    </div>
  );
});

function Minimap({ page, containerRef, displayScale }: { page: Page; containerRef: React.RefObject<HTMLDivElement | null>; displayScale: number }) {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const mmW = 160;
  const mmH = Math.round(mmW * page.height / page.width);
  const mmScale = mmW / page.width;

  useEffect(() => {
    const c = minimapRef.current;
    if (!c) return;
    c.width = mmW;
    c.height = mmH;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    createImageBitmap(page.imageData).then(bmp => {
      ctx.drawImage(bmp, 0, 0, mmW, mmH);
      bmp.close();
    });
  }, [page, mmH]);

  const el = containerRef.current;
  const vpW = el ? (el.clientWidth / displayScale * mmScale) : mmW;
  const vpH = el ? (el.clientHeight / displayScale * mmScale) : mmH;
  const vpX = el ? Math.min(mmW - vpW, Math.max(0, el.scrollLeft / displayScale * mmScale)) : 0;
  const vpY = el ? Math.min(mmH - vpH, Math.max(0, el.scrollTop / displayScale * mmScale)) : 0;

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / mmScale;
    const y = (e.clientY - rect.top) / mmScale;
    if (el) {
      el.scrollLeft = x * displayScale - el.clientWidth / 2;
      el.scrollTop = y * displayScale - el.clientHeight / 2;
    }
  }, [mmScale, displayScale, el]);

  return (
    <div className="fixed bottom-4 right-4 border rounded overflow-hidden shadow-lg cursor-crosshair z-50" style={{ borderColor: '#555', background: '#222' }} onClick={handleClick}>
      <canvas ref={minimapRef} style={{ width: mmW, height: mmH, display: 'block' }} />
      <div className="absolute border-2 border-[var(--accent)] bg-[var(--accent)]/15 pointer-events-none" style={{ left: vpX, top: vpY, width: Math.min(vpW, mmW), height: Math.min(vpH, mmH) }} />
    </div>
  );
}
