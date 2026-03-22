import { useState, memo } from 'react';
import type { TextRegion, RGB } from '@/shared/types';
import { rgbToHex, hexToRgb } from '@/shared/utils/color';

interface Props {
  region: TextRegion;
  onApply: (id: string, changes: { text: string; fontSize: number; textColor: RGB }) => void;
  onCancel: () => void;
}

export const PropertyPanel = memo(function PropertyPanel({ region, onApply, onCancel }: Props) {
  const [text, setText] = useState(region.text);
  const [sizePercent, setSizePercent] = useState(100);
  const [colorHex, setColorHex] = useState(rgbToHex(region.textColor));

  const apply = () => {
    onApply(region.id, {
      text,
      fontSize: Math.round(region.fontSize * sizePercent / 100),
      textColor: hexToRgb(colorHex) ?? region.textColor,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); apply(); }
  };

  return (
    <div className="w-[280px] shrink-0 border-l p-3 overflow-y-auto flex flex-col gap-3" style={{ background: '#1e1e1e', borderColor: '#333' }} onKeyDown={onKeyDown}>
      {/* Header */}
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-xs truncate flex-1" style={{ color: '#ccc' }}>{region.text.slice(0, 30)}{region.text.length > 30 ? '...' : ''}</span>
        <span className="text-xs shrink-0" style={{ color: '#888' }}>{Math.round(region.confidence)}%</span>
      </div>

      {/* Text */}
      <label className="text-[10px] uppercase tracking-wider" style={{ color: '#999' }}>Text Content</label>
      <textarea
        className="w-full min-h-[60px] rounded-md border p-2 text-sm resize-y"
        style={{ background: '#2a2a2a', color: '#eee', borderColor: '#444' }}
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />

      {/* Font size */}
      <div className="flex justify-between items-baseline">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#999' }}>Font Size</label>
        <span className="text-xs" style={{ color: '#ccc' }}>{sizePercent}%</span>
      </div>
      <input type="range" className="w-full accent-[var(--accent)]" min={50} max={200} value={sizePercent} onChange={e => setSizePercent(Number(e.target.value))} />

      {/* Color */}
      <label className="text-[10px] uppercase tracking-wider" style={{ color: '#999' }}>Text Color</label>
      <div className="flex gap-2 items-center">
        <input type="color" className="w-8 h-8 border-none rounded cursor-pointer" value={colorHex} onChange={e => setColorHex(e.target.value.toUpperCase())} />
        <input type="text" className="flex-1 rounded-md border px-2 py-1 text-sm font-mono" style={{ background: '#2a2a2a', color: '#eee', borderColor: '#444' }} value={colorHex} onChange={e => setColorHex(e.target.value.toUpperCase())} maxLength={7} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button onClick={onCancel} className="flex-1 py-2 rounded-md border text-sm cursor-pointer" style={{ background: '#2a2a2a', color: '#ccc', borderColor: '#444' }}>✕ Cancel</button>
        <button onClick={apply} className="flex-1 py-2 rounded-md border text-sm cursor-pointer text-white" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>✓ Apply</button>
      </div>
    </div>
  );
});
