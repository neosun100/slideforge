import { useState, useRef, useEffect } from 'react';
import type { TextRegion, RGB } from '@/shared/types';

interface Props {
  region: TextRegion;
  onApply: (text: string, fontSize: number, textColor: RGB) => void;
  onCancel: () => void;
}

export function TextEditDialog({ region, onApply, onCancel }: Props) {
  const [text, setText] = useState(region.text);
  const [fontSize, setFontSize] = useState(region.fontSize);
  const [colorHex, setColorHex] = useState(rgbToHex(region.textColor));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const handleApply = () => {
    onApply(text, fontSize, hexToRgb(colorHex));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleApply();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-2xl p-4 w-96 max-w-[90vw]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">Edit Text Region</h3>

        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full h-24 p-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] resize-y"
          placeholder="Enter text..."
        />

        <div className="flex gap-4 mt-3 items-center">
          <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            Size:
            <input
              type="number"
              min={6}
              max={200}
              value={fontSize}
              onChange={e => setFontSize(Math.max(6, parseInt(e.target.value) || 12))}
              className="w-14 px-1 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
            />
          </label>
          <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            Color:
            <input
              type="color"
              value={colorHex}
              onChange={e => setColorHex(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0"
            />
          </label>
          <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
            Confidence: {Math.round(region.confidence)}%
          </span>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] cursor-pointer"
          >Cancel</button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer"
          >Apply (⌘↵)</button>
        </div>
      </div>
    </div>
  );
}

function rgbToHex(c: RGB): string {
  return '#' + [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m ? { r: parseInt(m[0]!, 16), g: parseInt(m[1]!, 16), b: parseInt(m[2]!, 16) } : { r: 0, g: 0, b: 0 };
}
