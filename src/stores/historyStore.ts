import { create } from 'zustand';
import type { HistoryAction } from '@/shared/types';

const MAX_STACK = 80;

interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  push: (action: HistoryAction) => void;
  undo: () => HistoryAction | undefined;
  redo: () => HistoryAction | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  push: (action) => set((s) => {
    const stack = [...s.undoStack, action];
    if (stack.length > MAX_STACK) stack.shift();
    return { undoStack: stack, redoStack: [] };
  }),

  undo: () => {
    const s = get();
    if (s.undoStack.length === 0) return undefined;
    const action = s.undoStack[s.undoStack.length - 1]!;
    set({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, action],
    });
    return action;
  },

  redo: () => {
    const s = get();
    if (s.redoStack.length === 0) return undefined;
    const action = s.redoStack[s.redoStack.length - 1]!;
    set({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, action],
    });
    return action;
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  clear: () => set({ undoStack: [], redoStack: [] }),
}));
