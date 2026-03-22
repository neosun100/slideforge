import { create } from 'zustand';
import type { ActiveTool } from '@/shared/types';

interface EditorState {
  activeTool: ActiveTool;
  zoomLevel: number;
  showBoundingBoxes: boolean;
  showPageList: boolean;
  showObjectTree: boolean;
  autoMerge: boolean;
  mergeRowOnly: boolean;
  minConfidence: number;
  theme: 'dark' | 'light';

  setTool: (tool: ActiveTool) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleBoundingBoxes: () => void;
  togglePageList: () => void;
  toggleObjectTree: () => void;
  toggleAutoMerge: () => void;
  toggleMergeRowOnly: () => void;
  setMinConfidence: (v: number) => void;
  toggleTheme: () => void;
}

const ZOOM_STEP = 1.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  zoomLevel: 1,
  showBoundingBoxes: true,
  showPageList: true,
  showObjectTree: true,
  autoMerge: true,
  mergeRowOnly: true,
  minConfidence: 50,
  theme: (() => { try { return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'; } catch { return 'dark'; } })(),

  setTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoomLevel: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(ZOOM_MAX, s.zoomLevel * ZOOM_STEP) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(ZOOM_MIN, s.zoomLevel / ZOOM_STEP) })),
  zoomReset: () => set({ zoomLevel: 1 }),
  toggleBoundingBoxes: () => set((s) => ({ showBoundingBoxes: !s.showBoundingBoxes })),
  togglePageList: () => set((s) => ({ showPageList: !s.showPageList })),
  toggleObjectTree: () => set((s) => ({ showObjectTree: !s.showObjectTree })),
  toggleAutoMerge: () => set((s) => ({ autoMerge: !s.autoMerge })),
  toggleMergeRowOnly: () => set((s) => ({ mergeRowOnly: !s.mergeRowOnly })),
  setMinConfidence: (v) => set({ minConfidence: v }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
}));
