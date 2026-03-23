import { Link } from 'react-router-dom';
import { useState } from 'react';

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

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="glass rounded-xl overflow-hidden cursor-pointer"
      style={{ borderRadius: 'var(--radius-lg)' }}
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5">
        <span className="font-semibold">{q}</span>
        <span
          className="text-lg transition-transform"
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
            transition: 'var(--transition-base)',
          }}
        >+</span>
      </div>
      <div
        style={{
          maxHeight: open ? '200px' : '0',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height var(--transition-slow), opacity var(--transition-base)',
        }}
      >
        <p className="px-5 pb-5 text-sm" style={{ color: 'var(--text-muted)' }}>{a}</p>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-28 px-6 max-w-3xl mx-auto relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(100,108,255,0.12) 0%, transparent 70%)',
          }}
        />
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 relative">
          Edit Presentations{' '}
          <span className="gradient-text">in Your Browser</span>
        </h1>
        <p className="text-lg mb-12 relative" style={{ color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 3rem' }}>
          Upload PDFs, detect text with OCR, erase and inpaint regions, then export to editable PPTX. 100% local — your files never leave your device.
        </p>
        <Link
          to="/editor"
          className="inline-block px-8 py-3.5 rounded-xl font-bold text-white no-underline text-lg relative"
          style={{
            background: 'var(--gradient-accent)',
            boxShadow: 'var(--shadow-glow)',
            borderRadius: 'var(--radius-lg)',
            transition: 'var(--transition-base)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px var(--accent-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
        >
          Open Editor — It's Free
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-6 pb-20">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass glass-hover rounded-xl p-6"
            style={{
              borderRadius: 'var(--radius-lg)',
              transition: 'var(--transition-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Steps */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="flex flex-col gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="glass glass-hover flex gap-5 items-start rounded-xl p-5"
              style={{ borderRadius: 'var(--radius-lg)', transition: 'var(--transition-base)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                style={{ background: 'var(--gradient-accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
              >{s.num}</div>
              <div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>
    </div>
  );
}
