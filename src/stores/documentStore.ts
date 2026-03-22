import { create } from 'zustand';
import type { AppDocument, Page, PageEditState } from '@/shared/types';

function emptyPageEdit(): PageEditState {
  return { textRegions: [], rawTextRegions: [], erasedRegions: [] };
}

interface DocumentState {
  document: AppDocument | null;
  currentPageIndex: number;
  pageEdits: PageEditState[];

  setDocument: (doc: AppDocument) => void;
  setCurrentPage: (index: number) => void;
  addPage: (page: Page) => void;
  updatePageEdit: (index: number, updater: (s: PageEditState) => PageEditState) => void;
  getCurrentPageEdit: () => PageEditState | undefined;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  currentPageIndex: 0,
  pageEdits: [],

  setDocument: (doc) => set({
    document: doc,
    currentPageIndex: 0,
    pageEdits: doc.pages.map(() => emptyPageEdit()),
  }),

  setCurrentPage: (index) => {
    const doc = get().document;
    if (doc && index >= 0 && index < doc.pages.length) {
      set({ currentPageIndex: index });
    }
  },

  addPage: (page) => set((s) => {
    if (!s.document) return s;
    const pages = [...s.document.pages];
    pages[page.index] = page;
    return {
      document: { ...s.document, pages },
      pageEdits: [...s.pageEdits, ...(s.pageEdits.length <= page.index ? [emptyPageEdit()] : [])],
    };
  }),

  updatePageEdit: (index, updater) => set((s) => {
    const edits = [...s.pageEdits];
    const current = edits[index];
    if (current) edits[index] = updater(current);
    return { pageEdits: edits };
  }),

  getCurrentPageEdit: () => {
    const s = get();
    return s.pageEdits[s.currentPageIndex];
  },

  reset: () => set({ document: null, currentPageIndex: 0, pageEdits: [] }),
}));
