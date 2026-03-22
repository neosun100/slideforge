import { describe, it, expect } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('useZoom (via editorStore)', () => {
  it('zoomIn increases zoom by step', () => {
    useEditorStore.setState({ zoomLevel: 1 });
    useEditorStore.getState().zoomIn();
    expect(useEditorStore.getState().zoomLevel).toBeCloseTo(1.25);
  });

  it('zoomOut decreases zoom', () => {
    useEditorStore.setState({ zoomLevel: 1 });
    useEditorStore.getState().zoomOut();
    expect(useEditorStore.getState().zoomLevel).toBeCloseTo(0.8);
  });

  it('zoomReset sets to 1', () => {
    useEditorStore.setState({ zoomLevel: 2.5 });
    useEditorStore.getState().zoomReset();
    expect(useEditorStore.getState().zoomLevel).toBe(1);
  });

  it('setZoom clamps to min 0.25', () => {
    useEditorStore.getState().setZoom(0.1);
    expect(useEditorStore.getState().zoomLevel).toBe(0.25);
  });

  it('setZoom clamps to max 4', () => {
    useEditorStore.getState().setZoom(10);
    expect(useEditorStore.getState().zoomLevel).toBe(4);
  });
});
