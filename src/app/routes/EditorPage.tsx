import { useState, useCallback, useEffect, useRef } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useEditorStore } from '@/stores/editorStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useOCRStore } from '@/stores/ocrStore';
import { Toolbar } from '@/features/editor/components/Toolbar';
import { ThumbnailSidebar } from '@/features/editor/components/ThumbnailSidebar';
import { ObjectTree } from '@/features/editor/components/ObjectTree';
import { PropertyPanel } from '@/features/editor/components/PropertyPanel';
import { CanvasEditor } from '@/features/canvas/components/CanvasEditor';
import { DropZone } from '@/features/upload/components/DropZone';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Toast } from '@/shared/ui/Toast';
import { validateFile, isPdfFile, isImageFile } from '@/features/upload/services/fileValidator';
import { parsePdfStreaming } from '@/features/upload/services/pdfParser';
import { loadImageFile } from '@/features/upload/services/imageLoader';
import { sampleBackgroundColor } from '@/features/ocr/services/textSampler';
import { getAvailableEngines } from '@/features/ocr/services/ocrManager';
import { preloadEngineWorker, recognizeInWorker } from '@/features/ocr/workers/ocrWorkerClient';
import { preloadLama } from '@/features/inpaint/workers/lamaWorkerClient';
import { mergeNearbyRegions } from '@/features/ocr/services/mergeRegions';
import { cleanupOldCaches } from '@/shared/utils/modelCache';
import { analyzeInpaintMode } from '@/features/inpaint/services/hybridAnalyzer';
import { createLogger } from '@/shared/utils/logger';
import type { TextRegion, RGB, AppDocument, PageEditState, BBox } from '@/shared/types';

const log = createLogger('editor');

/* ─── Config panel shown before/during upload ─── */
function ConfigPanel({ onEngineChange, renderScaleRef, maxPagesRef }: { onEngineChange?: () => void; renderScaleRef: React.MutableRefObject<number>; maxPagesRef: React.MutableRefObject<number> }) {
  const { engineId, setEngineId, engineReady, engineLoadProgress } = useOCRStore();
  const { mergeRowOnly, toggleMergeRowOnly } = useEditorStore();
  const engines = getAvailableEngines();
  const [renderScale, setRenderScale] = useState(renderScaleRef.current);
  const [maxPages, setMaxPages] = useState(maxPagesRef.current);

  const updateScale = (v: number) => { setRenderScale(v); renderScaleRef.current = v; };
  const updatePages = (v: number) => { setMaxPages(v); maxPagesRef.current = v; };

  const inputStyle = { background: 'var(--bg-floating)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' };

  return (
    <div className="w-full max-w-sm space-y-3 text-sm glass p-4 rounded-xl" style={{ color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>
      {/* Pages to load */}
      <div className="flex items-center justify-between">
        <span>Pages to load:</span>
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={maxPages} onChange={e => updatePages(Math.max(0, +e.target.value))}
            className="w-16 px-2 py-1 text-center" style={inputStyle} />
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{maxPages === 0 ? 'All pages' : `${maxPages} pages`}</span>
        </div>
      </div>
      {/* Render scale */}
      <div className="flex items-center justify-between">
        <span>Render scale:</span>
        <select value={renderScale} onChange={e => updateScale(+e.target.value)}
          className="px-2 py-1" style={inputStyle}>
          <option value={1}>1x (native)</option>
          <option value={2}>2x</option>
          <option value={3}>3x</option>
          <option value={4}>4x</option>
        </select>
      </div>
      {/* OCR Engine */}
      <div className="flex items-center justify-between">
        <span>OCR Engine:</span>
        <div className="flex items-center gap-2">
          <select value={engineId} onChange={e => { setEngineId(e.target.value); onEngineChange?.(); }}
            className="px-2 py-1" style={inputStyle}>
            {engines.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <span className="text-xs" style={{ color: engineReady ? '#4ade80' : '#facc15' }}>
            {engineReady ? 'Ready' : (engineLoadProgress || 'Downloading models...')}
          </span>
        </div>
      </div>
      {/* Merge mode */}
      <div className="flex items-center justify-between">
        <span>Merge mode:</span>
        <select value={mergeRowOnly ? 'row' : 'all'} onChange={() => toggleMergeRowOnly()}
          className="px-2 py-1" style={inputStyle}>
          <option value="row">Same row only</option>
          <option value="all">All nearby</option>
        </select>
      </div>
    </div>
  );
}

export function EditorPage() {
  const { document: doc, currentPageIndex, pageEdits, setDocument, setCurrentPage, updatePageEdit } = useDocumentStore();
  const { activeTool, zoomLevel, setZoom, setTool, showBoundingBoxes, toggleBoundingBoxes, showPageList, showObjectTree, togglePageList, toggleObjectTree } = useEditorStore();
  const { isProcessing, progressMessage, progressPercent, setProcessing, setProgress, setEngineReady, setEngineLoadProgress, setLamaReady, setLamaLoadProgress } = useOCRStore();
  const history = useHistoryStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingRegion, setEditingRegion] = useState<TextRegion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preloadStarted = useRef(false);
  const renderScaleRef = useRef(1);
  const maxPagesRef = useRef(0);

  const currentPage = doc?.pages[currentPageIndex];
  const currentEdit = pageEdits[currentPageIndex];

  // ─── Preload OCR engine on mount (like reference project) ───
  useEffect(() => {
    if (preloadStarted.current) return;
    preloadStarted.current = true;
    // Clean up old model caches
    cleanupOldCaches().catch(() => {});
    const eid = useOCRStore.getState().engineId;
    log.info(`Preloading OCR engine: ${eid}`);
    setEngineLoadProgress('Downloading models...');
    preloadEngineWorker(eid, (p) => {
      setEngineLoadProgress(p.message || 'Loading...');
    }).then(() => {
      setEngineReady(true);
      setEngineLoadProgress(null);
      log.info(`OCR engine ready: ${eid}`);
    }).catch((e) => {
      log.error('Engine preload failed', e);
      setEngineLoadProgress('Failed to load');
    });

    // Also preload LaMa in parallel
    setLamaLoadProgress('Initializing LaMa...');
    preloadLama((msg) => setLamaLoadProgress(msg)).then((ok) => {
      setLamaReady(ok);
      setLamaLoadProgress(null);
      log.info(`LaMa ready: ${ok}`);
    }).catch((e) => {
      log.warn('LaMa preload failed (will use Laplace fallback)', e);
      setLamaLoadProgress(null);
    });
  }, [setEngineReady, setEngineLoadProgress, setLamaReady, setLamaLoadProgress]);

  // ─── Keyboard shortcuts (uses refs to avoid stale closures) ───
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  useEffect(() => {
    if (!doc) return;
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (!ctrl) {
        if (e.key === 'v' || e.key === 'V') { setTool('select'); e.preventDefault(); }
        else if (e.key === 'e' || e.key === 'E') { setTool('erase'); e.preventDefault(); }
        else if (e.key === 'r' || e.key === 'R') { setTool('region'); e.preventDefault(); }
        else if (e.key === 'b' || e.key === 'B') { toggleBoundingBoxes(); e.preventDefault(); }
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          const ids = selectedIdsRef.current;
          if (ids.size > 0) {
            // Defer to next tick so handleDeleteRegions is defined
            const edit = useDocumentStore.getState().pageEdits[useDocumentStore.getState().currentPageIndex];
            if (edit) {
              const idsArr = [...ids];
              useDocumentStore.getState().updatePageEdit(useDocumentStore.getState().currentPageIndex, (s: PageEditState) => ({
                ...s,
                textRegions: s.textRegions.filter(r => !idsArr.includes(r.id)),
                rawTextRegions: s.rawTextRegions.filter(r => !idsArr.includes(r.id)),
              }));
              setSelectedIds(new Set());
            }
            e.preventDefault();
          }
        }
      } else {
        if (e.key === 'z') { history.undo(); e.preventDefault(); }
        else if (e.key === 'y') { history.redo(); e.preventDefault(); }
        else if (e.key === '=' || e.key === '+') { setZoom(Math.min(4, zoomLevel * 1.2)); e.preventDefault(); }
        else if (e.key === '-') { setZoom(Math.max(0.25, zoomLevel / 1.2)); e.preventDefault(); }
        else if (e.key === '0') { setZoom(1); e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, selectedIds, zoomLevel, setTool, toggleBoundingBoxes, setZoom, history]);

  // ─── OCR on all pages (uses store config, not hardcoded) ───
  const runOCROnAllPages = useCallback(async () => {
    const store = useDocumentStore.getState();
    const ocrState = useOCRStore.getState();
    const editorState = useEditorStore.getState();
    const loadedDoc = store.document;
    if (!loadedDoc) return;

    setProcessing(true, 'Running OCR...');
    const totalPages = loadedDoc.pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = useDocumentStore.getState().document?.pages[i];
      if (!page || page.width === 0) continue;

      setProgress((i / totalPages) * 100, `OCR page ${i + 1} of ${totalPages}...`);
      try {
        // Run OCR in Web Worker (falls back to main thread if worker unavailable)
        const raw = await recognizeInWorker(
          page.imageData,
          ocrState.engineId,
          (p) => {
            const base = (i / totalPages) * 100;
            const pageProgress = (p.progress ?? 0) / totalPages;
            setProgress(base + pageProgress, p.message || `OCR page ${i + 1}...`);
          },
        );
        const filtered = raw.filter(r => r.confidence >= editorState.minConfidence);
        const merged = mergeNearbyRegions(filtered, editorState.mergeRowOnly);

        // Hybrid inpaint: auto-assign lama/laplace per bbox based on boundary complexity
        for (const region of merged) {
          region.inpaintMode = analyzeInpaintMode(page.imageData, region.boundingBox);
        }

        useDocumentStore.getState().updatePageEdit(i, (s: PageEditState) => ({
          ...s,
          textRegions: merged,
          rawTextRegions: raw,
        }));

        log.info(`OCR page ${i + 1}: ${raw.length} raw → ${merged.length} merged`);
        // Yield to let React re-render after each page
        await new Promise(r => setTimeout(r, 0));
      } catch (e) {
        log.error(`OCR failed on page ${i + 1}`, e);
        setError(`OCR failed on page ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    setProgress(100, 'OCR complete');
    setProcessing(false);
    log.info('OCR complete for all pages');
  }, [setProcessing, setProgress]);

  // ─── File handling (uses store config for renderScale/maxPages) ───
  const handleFile = useCallback(async (file: File) => {
    const check = validateFile(file);
    if (!check.valid) { setError(check.error); return; }

    if (isPdfFile(file.name)) {
      setProcessing(true, 'Loading PDF...');
      await parsePdfStreaming(file, {
        maxPages: maxPagesRef.current,
        renderScale: renderScaleRef.current,
        onFileAccepted: (meta, pageCount) => {
          const newDoc: AppDocument = {
            id: `doc_${Date.now()}`,
            type: 'pdf',
            metadata: meta,
            pages: [],
          };
          for (let i = 0; i < pageCount; i++) {
            newDoc.pages.push({ index: i, width: 0, height: 0, imageData: new ImageData(1, 1) });
          }
          setDocument(newDoc);
          log.info('PDF accepted', { pages: pageCount });
        },
        onPageRendered: (page, _idx, total) => {
          useDocumentStore.getState().addPage(page);
          setProgress(((page.index + 1) / total) * 100, `Rendered page ${page.index + 1}/${total}`);
        },
        onError: (msg) => setError(msg),
      });
      await runOCROnAllPages();
    } else if (isImageFile(file.name)) {
      setProcessing(true, 'Loading image...');
      try {
        const imgDoc = await loadImageFile(file);
        setDocument(imgDoc);
        log.info('Image loaded');
      } catch { setError('Failed to load image.'); }
      await runOCROnAllPages();
    }
  }, [setDocument, setProcessing, setProgress, runOCROnAllPages]);

  // ─── Region operations ───
  const handleSelectRegion = useCallback((id: string, multi: boolean) => {
    setSelectedIds(prev => {
      if (multi) {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }
      return new Set([id]);
    });
  }, []);

  const handleEraseRegion = useCallback((id: string) => {
    const edit = useDocumentStore.getState().pageEdits[currentPageIndex];
    const page = useDocumentStore.getState().document?.pages[currentPageIndex];
    if (!edit || !page) return;

    const region = edit.textRegions.find(r => r.id === id);
    if (!region) return;

    const bgColor = sampleBackgroundColor(page.imageData, region.boundingBox);
    const mode = analyzeInpaintMode(page.imageData, region.boundingBox);

    updatePageEdit(currentPageIndex, (s: PageEditState) => ({
      ...s,
      erasedRegions: [...s.erasedRegions.filter(e => e.id !== id), {
        id, boundingBox: region.boundingBox, fillColor: bgColor, inpaintMode: mode, hybridSuggested: mode,
      }],
    }));

    history.push({ type: 'erase', regionId: id, region, fillColor: bgColor, inpaintMode: mode, hybridSuggested: mode });
    log.info('Region erased', { id, mode });
  }, [currentPageIndex, updatePageEdit, history]);

  const handleDeleteRegions = useCallback((ids: string[]) => {
    const edit = useDocumentStore.getState().pageEdits[currentPageIndex];
    if (!edit) return;
    const regions = ids.map(id => edit.textRegions.find(r => r.id === id)).filter((r): r is TextRegion => !!r);
    if (regions.length === 0) return;

    updatePageEdit(currentPageIndex, (s: PageEditState) => ({
      ...s,
      textRegions: s.textRegions.filter(r => !ids.includes(r.id)),
      rawTextRegions: s.rawTextRegions.filter(r => !ids.includes(r.id)),
    }));
    history.push({ type: 'delete', regions });
    setSelectedIds(new Set());
  }, [currentPageIndex, updatePageEdit, history]);

  const handleMergeRegions = useCallback((ids: string[]) => {
    const edit = useDocumentStore.getState().pageEdits[currentPageIndex];
    if (!edit) return;
    const regions = ids.map(id => edit.textRegions.find(r => r.id === id)).filter((r): r is TextRegion => !!r);
    if (regions.length < 2) return;

    const { mergeNearbyRegions } = require('@/features/ocr/services/mergeRegions');
    const merged = mergeNearbyRegions(regions, true);
    if (merged.length !== 1) return;

    updatePageEdit(currentPageIndex, (s: PageEditState) => ({
      ...s,
      textRegions: [...s.textRegions.filter(r => !ids.includes(r.id)), merged[0]],
    }));
    history.push({ type: 'merge', sourceRegions: regions, mergedRegion: merged[0] });
    setSelectedIds(new Set());
  }, [currentPageIndex, updatePageEdit, history]);

  const handleSplitRegion = useCallback((id: string) => {
    const edit = useDocumentStore.getState().pageEdits[currentPageIndex];
    if (!edit) return;
    const region = edit.textRegions.find(r => r.id === id);
    if (!region?.sourceIds?.length) return;

    const rawRegions = region.sourceIds.map(sid => edit.rawTextRegions.find(r => r.id === sid)).filter((r): r is TextRegion => !!r);
    if (rawRegions.length === 0) return;

    updatePageEdit(currentPageIndex, (s: PageEditState) => ({
      ...s,
      textRegions: [...s.textRegions.filter(r => r.id !== id), ...rawRegions],
    }));
    history.push({ type: 'split', mergedRegion: region, rawRegions });
  }, [currentPageIndex, updatePageEdit, history]);

  const handleRegionOCR = useCallback(async (bbox: BBox) => {
    const page = useDocumentStore.getState().document?.pages[currentPageIndex];
    const ocrState = useOCRStore.getState();
    if (!page) return;

    // Crop the selected region from the page
    const canvas = new OffscreenCanvas(bbox.width, bbox.height);
    const ctx = canvas.getContext('2d')!;
    const srcCanvas = new OffscreenCanvas(page.width, page.height);
    srcCanvas.getContext('2d')!.putImageData(page.imageData, 0, 0);
    ctx.drawImage(srcCanvas, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
    const croppedData = ctx.getImageData(0, 0, bbox.width, bbox.height);

    setProcessing(true, 'Region OCR...');
    try {
      const raw = await recognizeInWorker(croppedData, ocrState.engineId, (p) => {
        setProgress(p.progress, p.message || 'Region OCR...');
      });
      // Offset regions back to page coordinates
      const offsetRegions = raw.map(r => ({
        ...r,
        id: `region-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        boundingBox: { x: r.boundingBox.x + bbox.x, y: r.boundingBox.y + bbox.y, width: r.boundingBox.width, height: r.boundingBox.height },
        inpaintMode: analyzeInpaintMode(page.imageData, { x: r.boundingBox.x + bbox.x, y: r.boundingBox.y + bbox.y, width: r.boundingBox.width, height: r.boundingBox.height }),
      }));

      updatePageEdit(currentPageIndex, (s: PageEditState) => ({
        ...s,
        textRegions: [...s.textRegions, ...offsetRegions],
        rawTextRegions: [...s.rawTextRegions, ...offsetRegions],
      }));
      log.info(`Region OCR: ${offsetRegions.length} regions found`);
    } catch (e) {
      log.error('Region OCR failed', e);
    }
    setProcessing(false);
  }, [currentPageIndex, updatePageEdit, setProcessing, setProgress]);

  const handleApplyEdit = useCallback((id: string, changes: { text: string; fontSize: number; textColor: RGB }) => {
    const edit = useDocumentStore.getState().pageEdits[currentPageIndex];
    if (!edit) return;
    const region = edit.textRegions.find(r => r.id === id);
    if (!region) return;

    updatePageEdit(currentPageIndex, (s: PageEditState) => ({
      ...s,
      textRegions: s.textRegions.map(r => r.id === id ? { ...r, ...changes } : r),
    }));
    history.push({
      type: 'text_edit', regionId: id,
      oldText: region.text, newText: changes.text,
      oldFontSize: region.fontSize, newFontSize: changes.fontSize,
      oldTextColor: region.textColor, newTextColor: changes.textColor,
    });
    setEditingRegion(null);
  }, [currentPageIndex, updatePageEdit, history]);

  const handleExport = useCallback(async () => {
    if (!doc) return;
    setProcessing(true, 'Exporting to PPTX...');
    try {
      const { exportToPPTX } = await import('@/features/export/services/exportService');
      const slides = doc.pages.map((p, i) => ({
        imageData: p.imageData,
        textRegions: pageEdits[i]?.textRegions ?? [],
        erasedRegions: pageEdits[i]?.erasedRegions ?? [],
      }));
      await exportToPPTX(slides, { width: 13.333, height: 7.5, backgroundFormat: 'jpeg', jpegQuality: 0.85 }, (pct, msg) => {
        setProgress(pct, msg);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    }
    setProcessing(false);
  }, [doc, pageEdits, setProcessing, setProgress]);

  // ─── Undo/Redo ───
  const handleUndo = useCallback(() => { history.undo(); }, [history]);
  const handleRedo = useCallback(() => { history.redo(); }, [history]);

  // ─── Upload screen ───
  if (!doc) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-6 p-8" style={{ background: 'var(--bg)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>SlideForge</h1>
        <p style={{ color: 'var(--text-muted)' }}>Upload a document to start editing</p>
        <DropZone onFile={handleFile} onError={setError} />
        <ConfigPanel renderScaleRef={renderScaleRef} maxPagesRef={maxPagesRef} />
        {isProcessing && (
          <div className="w-full max-w-sm text-center">
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{progressMessage}</p>
            <ProgressBar progress={progressPercent} />
          </div>
        )}
        {error && <Toast message={error} onDismiss={() => setError(null)} />}
      </div>
    );
  }

  // ─── Editor screen ───
  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <Toolbar
        documentName={doc.metadata.fileName}
        onExport={handleExport}
        isProcessing={isProcessing}
        canUndo={history.canUndo()}
        canRedo={history.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Processing banner */}
      {isProcessing && (
        <div className="px-3 py-1 border-b shrink-0" style={{ background: '#1a1a2e', borderColor: '#333' }}>
          <p className="text-xs mb-1" style={{ color: '#aaa' }}>{progressMessage}</p>
          <ProgressBar progress={progressPercent} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Page list */}
        {showPageList && (
          <ThumbnailSidebar
            pages={doc.pages}
            currentIndex={currentPageIndex}
            onSelect={setCurrentPage}
            onClose={togglePageList}
          />
        )}

        {/* Object tree */}
        {showObjectTree && currentEdit && (
          <ObjectTree
            regions={currentEdit.textRegions}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            onSelect={handleSelectRegion}
            onHover={setHoveredId}
            onDelete={handleDeleteRegions}
            onErase={handleEraseRegion}
            onSplit={handleSplitRegion}
            onMerge={handleMergeRegions}
            onEdit={setEditingRegion}
            onClose={toggleObjectTree}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentPage && currentPage.width > 0 ? (
            <CanvasEditor
              page={currentPage}
              textRegions={currentEdit?.textRegions ?? []}
              erasedRegions={currentEdit?.erasedRegions ?? []}
              activeTool={activeTool}
              zoomLevel={zoomLevel}
              showBoundingBoxes={showBoundingBoxes}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              onSelectRegion={handleSelectRegion}
              onHoverRegion={setHoveredId}
              onEraseRegion={handleEraseRegion}
              onEditRegion={(id) => {
                const r = (currentEdit?.textRegions ?? []).find(r => r.id === id);
                if (r) setEditingRegion(r);
              }}
              onRegionOCR={handleRegionOCR}
              onDeselectAll={() => setSelectedIds(new Set())}
              onZoomChange={setZoom}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ color: '#666' }}>
              Loading page {currentPageIndex + 1}...
            </div>
          )}
        </div>

        {/* Property panel */}
        {editingRegion && (
          <PropertyPanel
            region={editingRegion}
            onApply={handleApplyEdit}
            onCancel={() => setEditingRegion(null)}
          />
        )}
      </div>

      {error && <Toast message={error} onDismiss={() => setError(null)} />}
    </div>
  );
}
