import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '../../stores/historyStore';
import type { HistoryAction } from '@/shared/types';

const textEdit: HistoryAction = {
  type: 'text_edit', regionId: 'r1', oldText: 'old', newText: 'new',
};

describe('historyStore', () => {
  beforeEach(() => useHistoryStore.getState().clear());

  it('starts empty', () => {
    const s = useHistoryStore.getState();
    expect(s.undoStack).toHaveLength(0);
    expect(s.redoStack).toHaveLength(0);
  });

  it('push adds to undo stack', () => {
    useHistoryStore.getState().push(textEdit);
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
  });

  it('push clears redo stack', () => {
    const s = useHistoryStore.getState();
    s.push(textEdit);
    s.undo();
    expect(s.canRedo()).toBe(true);
    s.push({ ...textEdit, newText: 'other' });
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it('undo returns last action and moves to redo', () => {
    const s = useHistoryStore.getState();
    s.push(textEdit);
    const action = s.undo();
    expect(action).toEqual(textEdit);
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);
  });

  it('undo returns undefined when empty', () => {
    expect(useHistoryStore.getState().undo()).toBeUndefined();
  });

  it('redo returns last undone action', () => {
    const s = useHistoryStore.getState();
    s.push(textEdit);
    s.undo();
    const action = useHistoryStore.getState().redo();
    expect(action).toEqual(textEdit);
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
  });

  it('redo returns undefined when empty', () => {
    expect(useHistoryStore.getState().redo()).toBeUndefined();
  });

  it('canUndo/canRedo reflect state', () => {
    const s = useHistoryStore.getState();
    expect(s.canUndo()).toBe(false);
    expect(s.canRedo()).toBe(false);
    s.push(textEdit);
    expect(useHistoryStore.getState().canUndo()).toBe(true);
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it('limits stack to 80 entries', () => {
    const s = useHistoryStore.getState();
    for (let i = 0; i < 100; i++) {
      s.push({ ...textEdit, newText: `v${i}` });
    }
    expect(useHistoryStore.getState().undoStack).toHaveLength(80);
  });

  it('clear empties both stacks', () => {
    const s = useHistoryStore.getState();
    s.push(textEdit);
    s.undo();
    s.clear();
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });
});
