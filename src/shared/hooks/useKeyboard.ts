import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useDocumentStore } from '@/stores/documentStore';

/** Global keyboard shortcuts for the editor */
export function useKeyboardShortcuts(opts: {
  onUndo: () => void;
  onRedo: () => void;
}) {
  const setTool = useEditorStore(s => s.setTool);
  const toggleBoundingBoxes = useEditorStore(s => s.toggleBoundingBoxes);
  const toggleAutoMerge = useEditorStore(s => s.toggleAutoMerge);
  const zoomIn = useEditorStore(s => s.zoomIn);
  const zoomOut = useEditorStore(s => s.zoomOut);
  const zoomReset = useEditorStore(s => s.zoomReset);
  const setCurrentPage = useDocumentStore(s => s.setCurrentPage);
  const doc = useDocumentStore(s => s.document);
  const currentPageIndex = useDocumentStore(s => s.currentPageIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl shortcuts (work even in inputs)
      if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); opts.onUndo(); return; }
      if (ctrl && (e.key === 'y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); opts.onRedo(); return; }
      if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); return; }
      if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); return; }
      if (ctrl && e.key === '0') { e.preventDefault(); zoomReset(); return; }

      // Non-input shortcuts
      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case 'v': e.preventDefault(); setTool('select'); break;
        case 'e': e.preventDefault(); setTool('erase'); break;
        case 'r': e.preventDefault(); setTool('region'); break;
        case 'b': e.preventDefault(); toggleBoundingBoxes(); break;
        case 'm': e.preventDefault(); toggleAutoMerge(); break;
        case 'pagedown':
        case 'arrowdown':
          if (doc && currentPageIndex < doc.pages.length - 1) {
            e.preventDefault();
            setCurrentPage(currentPageIndex + 1);
          }
          break;
        case 'pageup':
        case 'arrowup':
          if (currentPageIndex > 0) {
            e.preventDefault();
            setCurrentPage(currentPageIndex - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts, setTool, toggleBoundingBoxes, toggleAutoMerge, zoomIn, zoomOut, zoomReset, setCurrentPage, doc, currentPageIndex]);
}
