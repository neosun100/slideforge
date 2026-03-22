export function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Changelog</h1>
      <div className="rounded-xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold mb-2">v0.1.0 — Initial Release</h2>
        <ul className="text-sm list-disc pl-5" style={{ color: 'var(--text-muted)' }}>
          <li>Upload PDF or image files</li>
          <li>OCR text detection (PaddleOCR + Tesseract)</li>
          <li>Hybrid Laplace/LaMa inpainting</li>
          <li>Export to PPTX</li>
          <li>100% local processing</li>
        </ul>
      </div>
    </div>
  );
}
