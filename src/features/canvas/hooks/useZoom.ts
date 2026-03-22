import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';

export function useZoom() {
  const { zoomLevel, setZoom, zoomIn, zoomOut, zoomReset } = useEditorStore();

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom(zoomLevel * factor);
  }, [zoomLevel, setZoom]);

  return { zoomLevel, setZoom, zoomIn, zoomOut, zoomReset, handleWheel };
}
