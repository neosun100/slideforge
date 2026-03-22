import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../../stores/documentStore';
import type { AppDocument } from '@/shared/types';

function makeMockDoc(pageCount = 2): AppDocument {
  return {
    id: 'doc1',
    type: 'pdf',
    metadata: { fileName: 'test.pdf', fileSize: 1024, mimeType: 'application/pdf' },
    pages: Array.from({ length: pageCount }, (_, i) => ({
      index: i,
      width: 100,
      height: 100,
      imageData: new ImageData(100, 100),
    })),
  };
}

describe('documentStore', () => {
  beforeEach(() => useDocumentStore.getState().reset());

  it('starts with null document', () => {
    expect(useDocumentStore.getState().document).toBeNull();
  });

  it('setDocument sets document and creates pageEdits', () => {
    const doc = makeMockDoc(3);
    useDocumentStore.getState().setDocument(doc);
    const s = useDocumentStore.getState();
    expect(s.document?.id).toBe('doc1');
    expect(s.pageEdits).toHaveLength(3);
    expect(s.currentPageIndex).toBe(0);
  });

  it('setCurrentPage changes index', () => {
    useDocumentStore.getState().setDocument(makeMockDoc(3));
    useDocumentStore.getState().setCurrentPage(2);
    expect(useDocumentStore.getState().currentPageIndex).toBe(2);
  });

  it('setCurrentPage ignores out of bounds', () => {
    useDocumentStore.getState().setDocument(makeMockDoc(2));
    useDocumentStore.getState().setCurrentPage(5);
    expect(useDocumentStore.getState().currentPageIndex).toBe(0);
  });

  it('updatePageEdit updates specific page', () => {
    useDocumentStore.getState().setDocument(makeMockDoc(2));
    useDocumentStore.getState().updatePageEdit(0, (s) => ({
      ...s,
      textRegions: [{ id: 'r1', text: 'hello', boundingBox: { x: 0, y: 0, width: 10, height: 10 }, fontSize: 12, textColor: { r: 0, g: 0, b: 0 }, confidence: 90, language: 'en' }],
    }));
    expect(useDocumentStore.getState().pageEdits[0]?.textRegions).toHaveLength(1);
    expect(useDocumentStore.getState().pageEdits[1]?.textRegions).toHaveLength(0);
  });

  it('reset clears everything', () => {
    useDocumentStore.getState().setDocument(makeMockDoc());
    useDocumentStore.getState().reset();
    expect(useDocumentStore.getState().document).toBeNull();
    expect(useDocumentStore.getState().pageEdits).toHaveLength(0);
  });
});
