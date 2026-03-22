import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import type { ActiveTool } from '@/shared/types';

interface Props {
  documentName?: string;
  onExport: () => void;
  isProcessing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const tools: { id: ActiveTool; icon: string; label: string; key: string }[] = [
  { id: 'select', icon: '◇', label: 'Select tool', key: 'V' },
  { id: 'erase', icon: '✕', label: 'Eraser tool', key: 'E' },
  { id: 'region', icon: '▣', label: 'Region OCR tool', key: 'R' },
];

export const Toolbar = memo(function Toolbar({ documentName, onExport, isProcessing, canUndo, canRedo, onUndo, onRedo }: Props) {
  const {
    activeTool, setTool,
    zoomLevel, zoomIn, zoomOut, zoomReset,
    showBoundingBoxes, toggleBoundingBoxes,
    autoMerge, toggleAutoMerge,
    mergeRowOnly, toggleMergeRowOnly,
    showPageList, togglePageList,
    showObjectTree, toggleObjectTree,
    minConfidence, setMinConfidence,
  } = useEditorStore();

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0 relative z-50" style={{ background: '#2a2a2a', borderColor: '#333' }}>
      {/* Brand */}
      <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold no-underline shrink-0 mr-1" style={{ color: 'var(--text)' }}>
        <span>⚒</span><span>SlideForge</span>
      </Link>

      {/* Doc name */}
      <span className="text-xs truncate min-w-0 mr-auto" style={{ color: '#aaa' }}>{documentName}</span>

      {/* Tools */}
      <ToolGroup>
        {tools.map(t => (
          <ToolBtn key={t.id} active={activeTool === t.id} onClick={() => setTool(t.id)} title={`${t.label} (${t.key})`}>{t.icon}</ToolBtn>
        ))}
      </ToolGroup>

      {/* Undo/Redo */}
      <ToolGroup>
        <ToolBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</ToolBtn>
      </ToolGroup>

      {/* Panels */}
      <ToolGroup>
        <ToolBtn active={showPageList} onClick={togglePageList} title="Toggle page list">☰</ToolBtn>
        <ToolBtn active={showObjectTree} onClick={toggleObjectTree} title="Toggle object tree">⊞</ToolBtn>
      </ToolGroup>

      {/* Display */}
      <ToolGroup>
        <ToolBtn active={showBoundingBoxes} onClick={toggleBoundingBoxes} title="Toggle bounding boxes (B)">▦</ToolBtn>
        <ToolBtn active={autoMerge} onClick={toggleAutoMerge} title="Auto-merge (M)">⊟</ToolBtn>
        {autoMerge && <ToolBtn active={mergeRowOnly} onClick={toggleMergeRowOnly} title="Same row only">↔</ToolBtn>}
      </ToolGroup>

      {/* Confidence */}
      <ToolGroup>
        <span className="text-[10px] whitespace-nowrap" style={{ color: '#888' }}>Min: {minConfidence}%</span>
        <input type="range" className="w-16 h-1 accent-[var(--accent)] cursor-pointer" min={0} max={100} value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} />
      </ToolGroup>

      {/* Zoom */}
      <ToolGroup>
        <ToolBtn onClick={zoomOut} disabled={zoomLevel <= 0.25} title="Zoom out (Ctrl+-)">−</ToolBtn>
        <button onClick={zoomReset} className="min-w-12 h-9 text-xs cursor-pointer rounded-md border-none bg-transparent tabular-nums" style={{ color: '#ccc' }} title="Reset zoom (Ctrl+0)">
          {Math.round(zoomLevel * 100)}%
        </button>
        <ToolBtn onClick={zoomIn} disabled={zoomLevel >= 4} title="Zoom in (Ctrl+=)">+</ToolBtn>
      </ToolGroup>

      {/* Export */}
      <ToolGroup>
        <button
          onClick={onExport}
          disabled={isProcessing}
          className="h-9 px-3 text-xs font-medium rounded-md border-none cursor-pointer text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
          title={isProcessing ? 'Wait for OCR to finish' : 'Export as PPTX'}
        >
          Export PPTX
        </button>
      </ToolGroup>
    </div>
  );
});

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 px-1.5 border-r border-[#444] last:border-r-0">{children}</div>;
}

function ToolBtn({ children, active, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`w-9 h-9 flex items-center justify-center rounded-md border border-transparent text-base cursor-pointer transition-all disabled:opacity-30 disabled:cursor-default ${
        active ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-transparent text-[#ccc] hover:bg-[#3a3a3a] hover:text-white'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
