import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      activeTool: 'select',
      zoomLevel: 1,
      showBoundingBoxes: true,
      showPageList: true,
      showObjectTree: true,
      autoMerge: true,
      mergeRowOnly: true,
      minConfidence: 50,
    });
  });

  it('defaults to select tool', () => {
    expect(useEditorStore.getState().activeTool).toBe('select');
  });

  it('setTool changes active tool', () => {
    useEditorStore.getState().setTool('erase');
    expect(useEditorStore.getState().activeTool).toBe('erase');
  });

  it('toggleBoundingBoxes flips state', () => {
    expect(useEditorStore.getState().showBoundingBoxes).toBe(true);
    useEditorStore.getState().toggleBoundingBoxes();
    expect(useEditorStore.getState().showBoundingBoxes).toBe(false);
    useEditorStore.getState().toggleBoundingBoxes();
    expect(useEditorStore.getState().showBoundingBoxes).toBe(true);
  });

  it('togglePageList flips state', () => {
    useEditorStore.getState().togglePageList();
    expect(useEditorStore.getState().showPageList).toBe(false);
  });

  it('toggleObjectTree flips state', () => {
    useEditorStore.getState().toggleObjectTree();
    expect(useEditorStore.getState().showObjectTree).toBe(false);
  });

  it('toggleAutoMerge flips state', () => {
    useEditorStore.getState().toggleAutoMerge();
    expect(useEditorStore.getState().autoMerge).toBe(false);
  });

  it('toggleMergeRowOnly flips state', () => {
    expect(useEditorStore.getState().mergeRowOnly).toBe(true);
    useEditorStore.getState().toggleMergeRowOnly();
    expect(useEditorStore.getState().mergeRowOnly).toBe(false);
  });

  it('setMinConfidence updates value', () => {
    useEditorStore.getState().setMinConfidence(75);
    expect(useEditorStore.getState().minConfidence).toBe(75);
  });

  it('defaults minConfidence to 50', () => {
    expect(useEditorStore.getState().minConfidence).toBe(50);
  });

  it('defaults mergeRowOnly to true', () => {
    expect(useEditorStore.getState().mergeRowOnly).toBe(true);
  });
});
