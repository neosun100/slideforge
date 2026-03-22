import { memo, useRef, useEffect, useCallback } from 'react';
import type { Page } from '@/shared/types';

interface Props {
  pages: Page[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export const ThumbnailSidebar = memo(function ThumbnailSidebar({ pages, currentIndex, onSelect, onClose }: Props) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  return (
    <div className="shrink-0 flex flex-col border-r" style={{ width: 180, background: '#252525', borderColor: '#333' }}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b shrink-0" style={{ borderColor: '#333' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#999' }}>Pages</span>
        <span className="text-[9px] px-1 rounded-full ml-0.5" style={{ background: '#3a3a3a', color: '#aaa' }}>{pages.length}</span>
        <button onClick={onClose} className="ml-auto w-5 h-5 flex items-center justify-center rounded text-[9px] border-none cursor-pointer" style={{ background: 'transparent', color: '#666' }} title="Close">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 flex flex-col gap-1.5">
        {pages.map((page, i) => (
          <ThumbItem key={i} ref={i === currentIndex ? activeRef : null} page={page} index={i} active={i === currentIndex} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
});

const ThumbItem = memo(
  // eslint-disable-next-line react/display-name
  ({ page, index, active, onSelect, ref }: { page: Page; index: number; active: boolean; onSelect: (i: number) => void; ref?: React.Ref<HTMLDivElement> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const thumbW = 156;
      const scale = thumbW / page.width;
      c.width = thumbW;
      c.height = Math.round(page.height * scale);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      // Draw from ImageData via ImageBitmap
      createImageBitmap(page.imageData).then(bmp => {
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        bmp.close();
      });
    }, [page]);

    const onClick = useCallback(() => onSelect(index), [onSelect, index]);

    return (
      <div
        ref={ref}
        className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-colors shrink-0 ${active ? 'border-[var(--accent)]' : 'border-transparent hover:border-[#555]'}`}
        onClick={onClick}
      >
        <canvas ref={canvasRef} className="w-full block rounded" />
        <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/60 px-1 rounded">{index + 1}</span>
      </div>
    );
  }
);
