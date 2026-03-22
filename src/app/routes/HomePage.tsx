import { Link } from 'react-router-dom';

const features = [
  { icon: '🔍', title: 'OCR Text Detection', desc: 'Detect and extract text from slides using PaddleOCR or Tesseract, running entirely in your browser.' },
  { icon: '🎨', title: 'Smart Inpainting', desc: 'Erase text and fill regions with hybrid Laplace/LaMa inpainting for clean results.' },
  { icon: '📤', title: 'Export to PPTX', desc: 'Convert edited slides into fully editable PowerPoint files with real text boxes.' },
  { icon: '🔒', title: '100% Private', desc: 'Everything runs locally in your browser. No uploads, no servers, no accounts.' },
];

const steps = [
  { num: 1, title: 'Upload your file', desc: 'Drop a PDF or image into the editor. Pages render instantly in your browser.' },
  { num: 2, title: 'Detect and edit text', desc: 'OCR finds text regions. Edit, erase, or inpaint any region you want.' },
  { num: 3, title: 'Export to PowerPoint', desc: 'Download an editable PPTX with real text boxes — ready to present.' },
];

const faqs = [
  { q: 'Is SlideForge really free?', a: 'Yes, completely free with no account required. No watermarks, no limits.' },
  { q: 'Do my files get uploaded?', a: 'No. All processing happens 100% locally in your browser.' },
  { q: 'Does it work offline?', a: 'Yes, after the initial AI model download. Models are cached for future use.' },
  { q: 'What formats are supported?', a: 'PDF, PNG, JPG, and WebP for input. Export is to PPTX format.' },
  { q: 'Which OCR engines are available?', a: 'PaddleOCR (best accuracy) and Tesseract. Both run as WebAssembly.' },
];

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold leading-tight mb-5">
          Edit Presentations{' '}
          <span className="bg-gradient-to-r from-sky-300 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            in Your Browser
          </span>
        </h1>
        <p className="text-lg mb-10" style={{ color: 'var(--text-muted)' }}>
          Upload PDFs, detect text with OCR, erase and inpaint regions, then export to editable PPTX. 100% local — your files never leave your device.
        </p>
        <Link
          to="/editor"
          className="inline-block px-8 py-3 rounded-xl font-bold text-white no-underline text-lg"
          style={{ background: 'linear-gradient(135deg, #646cff, #7c3aed)', boxShadow: '0 4px 20px rgba(100,108,255,0.4)' }}
        >
          Open Editor — It's Free
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-6 pb-16">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Steps */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
        <div className="flex flex-col gap-3">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 items-start rounded-xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: 'var(--accent)' }}>{s.num}</div>
              <div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-6">Common Questions</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-xl p-4 border cursor-pointer" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <summary className="font-semibold">{f.q}</summary>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
