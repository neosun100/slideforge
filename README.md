# ⚒ SlideForge

**Edit presentations in your browser** — Upload PDFs, detect text with OCR, erase and inpaint regions, then export to editable PPTX. 100% local, your files never leave your device.

🔗 **Live Demo:** [slideforge.aws.xin](https://slideforge.aws.xin)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **OCR Text Detection** | PaddleOCR (PP-OCRv5) and Tesseract.js, running as WebAssembly in Web Workers |
| ✏️ **Text Editing** | Double-click any detected text to edit content, font size, and color |
| 🎨 **Smart Inpainting** | Hybrid Laplace/LaMa inpainting — auto-selects best method per region |
| 📐 **Region OCR** | Drag-to-draw a box for selective OCR on any area |
| 📤 **PPTX Export** | Editable PowerPoint with real text boxes, proper font sizes, vertical alignment |
| ↩️ **Undo/Redo** | Full history with Ctrl+Z / Ctrl+Y |
| ⌨️ **Keyboard Shortcuts** | V/E/R tools, B bbox toggle, Delete, Ctrl+/-/0 zoom |
| 🔒 **100% Private** | Everything runs locally — no uploads, no servers, no accounts |

## 🚀 Quick Start

```bash
git clone https://github.com/neosun100/slideforge.git
cd slideforge
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🛠 Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS v4** — utility-first styling
- **PaddleOCR** (ONNX Runtime WASM) — text detection & recognition
- **LaMa** (ONNX) — AI inpainting via Web Worker
- **PptxGenJS** — PowerPoint generation
- **PDF.js** — PDF rendering
- **Zustand** — state management
- **Vitest** + **Playwright** — testing

## 📁 Project Structure

```
src/
├── app/                    # Routes, layout, App shell
│   ├── routes/             # HomePage, EditorPage, ChangelogPage
│   └── layout/             # Header, Footer, SharedLayout
├── features/
│   ├── canvas/             # CanvasEditor, zoom hooks
│   ├── editor/             # Toolbar, PropertyPanel, TextEditDialog, ThumbnailSidebar
│   ├── export/             # PPTX builder, export service
│   ├── inpaint/            # Hybrid analyzer, Laplace, LaMa worker
│   ├── ocr/                # PaddleOCR, Tesseract, merge regions, OCR worker
│   └── upload/             # DropZone, file validator, PDF parser, image loader
├── shared/
│   ├── ui/                 # Button, Toast, ProgressBar, ErrorBoundary
│   ├── hooks/              # useKeyboardShortcuts
│   ├── utils/              # logger, color, modelCache, onnxProvider
│   └── types/              # TypeScript interfaces
└── stores/                 # Zustand: document, editor, history, ocr
```

## 🧪 Testing

```bash
npm run test          # 182 unit tests (Vitest)
npx playwright test   # 24 E2E tests (Playwright)
```

## 📦 Deployment

Deployed on **Cloudflare Pages**:

```bash
npm run build
npx wrangler pages deploy dist --project-name sf-editor --branch main
```

## 📋 Changelog

### v2.0.0 — UI/UX Redesign
- Glassmorphism design system with layered depth tokens
- Gradient accent system (cyan → indigo → purple)
- Frosted glass navbar, feature cards, DropZone, ConfigPanel
- Animated FAQ accordion, hover lift effects, ambient glow hero
- Polished Button/Toast/ProgressBar components

### v1.0.1 — WebGPU Fix
- Disabled WebGPU (PaddleOCR MaxPool ceil_mode not supported)
- Full regression verified

### v1.0.0 — Initial Release
- OCR Web Workers (non-blocking UI)
- Text editing (double-click, PropertyPanel)
- Hybrid inpainting (auto Laplace/LaMa)
- Region OCR (drag-to-draw)
- Keyboard shortcuts, undo/redo
- PPTX export with fontSize, valign, autoFit
- Model cache version management
- ErrorBoundary with recovery
- SEO: OG tags, JSON-LD structured data
- 182 unit tests + 24 E2E tests

## 📄 License

MIT
