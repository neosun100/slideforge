import { memo, useCallback } from 'react';
import type { TextRegion } from '@/shared/types';
import { rgbToHex } from '@/shared/utils/color';

interface Props {
  regions: TextRegion[];
  selectedIds: Set<string>;
  hoveredId: string | null;
  onSelect: (id: string, multi: boolean) => void;
  onHover: (id: string | null) => void;
  onDelete: (ids: string[]) => void;
  onErase: (id: string) => void;
  onSplit: (id: string) => void;
  onMerge: (ids: string[]) => void;
  onEdit: (region: TextRegion) => void;
  onClose: () => void;
}

export const ObjectTree = memo(function ObjectTree({ regions, selectedIds, hoveredId, onSelect, onHover, onDelete, onErase, onSplit, onMerge, onEdit, onClose }: Props) {
  const selCount = selectedIds.size;

  return (
    <div className="shrink-0 flex flex-col border-r outline-none" style={{ width: 240, background: '#252525', borderColor: '#333' }} onMouseLeave={() => onHover(null)}>
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b shrink-0" style={{ borderColor: '#333' }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#999' }}>Objects</span>
        <span className="text-[9px] px-1 rounded-full" style={{ background: '#3a3a3a', color: '#aaa' }}>{regions.length}</span>
        <button onClick={onClose} className="ml-auto w-5 h-5 flex items-center justify-center rounded text-[9px] border-none cursor-pointer" style={{ background: 'transparent', color: '#666' }}>✕</button>
      </div>

      {/* Batch actions */}
      {selCount >= 2 && (
        <div className="flex items-center gap-1 px-2 py-1 border-b shrink-0" style={{ background: '#1a1a2e', borderColor: '#333' }}>
          <span className="text-[10px] mr-auto" style={{ color: '#aaa' }}>{selCount} selected</span>
          <ActionBtn onClick={() => onMerge([...selectedIds])} color="#a0a8ff">Merge</ActionBtn>
          <ActionBtn onClick={() => { for (const id of selectedIds) onErase(id); }} color="#f0c060">Erase</ActionBtn>
          <ActionBtn onClick={() => onDelete([...selectedIds])} color="#f08080">Del</ActionBtn>
        </div>
      )}

      {/* List */}
      {regions.length === 0 ? (
        <div className="p-4 text-center text-xs" style={{ color: '#666' }}>No regions detected</div>
      ) : (
        <div className="flex-1 overflow-y-auto py-0.5">
          {regions.map(r => (
            <TreeItem
              key={r.id}
              region={r}
              selected={selectedIds.has(r.id)}
              hovered={hoveredId === r.id}
              onSelect={onSelect}
              onHover={onHover}
              onEdit={onEdit}
              onErase={onErase}
              onSplit={onSplit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const TreeItem = memo(function TreeItem({ region, selected, hovered, onSelect, onHover, onEdit, onErase, onSplit, onDelete }: {
  region: TextRegion; selected: boolean; hovered: boolean;
  onSelect: (id: string, multi: boolean) => void; onHover: (id: string | null) => void;
  onEdit: (r: TextRegion) => void; onErase: (id: string) => void; onSplit: (id: string) => void; onDelete: (ids: string[]) => void;
}) {
  const isGroup = (region.sourceIds?.length ?? 0) > 1;
  const mode = region.inpaintMode ?? 'laplace';
  const text = region.text.length > 20 ? region.text.slice(0, 20) + '…' : region.text;

  const handleClick = useCallback((e: React.MouseEvent) => onSelect(region.id, e.shiftKey || e.metaKey || e.ctrlKey), [onSelect, region.id]);

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-xs select-none transition-colors ${
        selected ? 'bg-[var(--accent)]/15 text-white' : hovered ? 'bg-[#2e2e2e]' : 'text-[#ccc]'
      } ${isGroup ? 'font-semibold' : ''}`}
      onClick={handleClick}
      onDoubleClick={() => onEdit(region)}
      onMouseEnter={() => onHover(region.id)}
    >
      <span className="text-[8px] w-3 text-center" style={{ color: selected ? 'var(--accent)' : '#888' }}>{isGroup ? '▼' : '■'}</span>
      <span className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/15" style={{ background: rgbToHex(region.textColor) }} />
      <span className="flex-1 min-w-0 truncate">{text}</span>
      <span className="text-[9px] shrink-0" style={{ color: mode === 'lama' ? '#a0a8ff' : '#888' }}>{mode === 'lama' ? '🧠' : 'L'}</span>
      <span className="text-[9px] shrink-0" style={{ color: '#666' }}>{Math.round(region.confidence)}%</span>

      {/* Hover actions */}
      <span className="hidden group-hover:flex items-center gap-px shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
        {isGroup && <HoverBtn onClick={() => onSplit(region.id)} title="Split">⇤⇥</HoverBtn>}
        <HoverBtn onClick={() => onErase(region.id)} title="Erase">∇</HoverBtn>
        <HoverBtn onClick={() => onDelete([region.id])} title="Delete">✕</HoverBtn>
      </span>
    </div>
  );
});

function ActionBtn({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} className="text-[9px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer" style={{ color, borderColor: color + '44', background: '#333' }}>
      {children}
    </button>
  );
}

function HoverBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="w-4 h-4 flex items-center justify-center rounded text-[8px] border-none cursor-pointer bg-transparent text-[#aaa] hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}
