# SlideForge — Architecture Document

> 纯前端 PDF/图片 → 可编辑 PPTX 转换器，全面超越 deckeditpro.com

## 1. 产品定位

浏览器端演示文稿编辑器：上传 PDF/图片 → OCR 文字检测 → 擦除/修复 → 导出可编辑 PPTX。
100% 本地处理，零服务器，零上传，隐私安全。

## 2. 竞品分析（deckeditpro.com 逆向）

### 2.1 原版技术栈
- Vite MPA（4个 HTML 入口）+ React 19 + TypeScript
- PaddleOCR PP-OCRv5 (ONNX) + Tesseract.js 7.0
- ONNX Runtime Web 1.24.3 (WASM)
- LaMa ONNX (~200MB) + Laplace 算法
- pdf.js + pptxgenjs
- Cloudflare Pages 部署

### 2.2 原版弱点
| # | 弱点 | 我们的超越 |
|---|------|-----------|
| 1 | App.tsx ~800行 useState 巨石 | Zustand 分层状态管理 |
| 2 | MPA 4入口 + shared-header.js hack | SPA + React Router |
| 3 | 文字编辑在侧面板 | Canvas 内联编辑 |
| 4 | 文字框不可拖拽/缩放 | 拖拽 + 缩放手柄 |
| 5 | 导出 JPEG 0.85 固定 | 可选 JPEG/PNG + 质量滑块 |
| 6 | 字体固定 Arial | 字体选择器 |
| 7 | LaMa 200MB 无进度 | 分块下载 + 进度条 |
| 8 | 无 PWA | 完整 PWA + Service Worker |
| 9 | 无项目保存 | IndexedDB 自动保存 |
| 10 | 无暗/亮主题 | 主题系统 |
| 11 | 无完整测试 | 单元 + 集成 + E2E 全覆盖 |
| 12 | 无日志系统 | 结构化日志 + 性能追踪 |
| 13 | WASM only | WebGPU 优先 + WASM 回退 |
| 14 | 仅 PPTX 导出 | PPTX + PDF |
| 15 | Undo/Redo 仅内存 | 持久化操作历史 |

## 3. 技术栈

| 层面 | 选型 | 版本 |
|------|------|------|
| 构建 | Vite | 6.x |
| 框架 | React + TypeScript | 19.x + 5.x |
| 路由 | React Router | 7.x |
| 状态 | Zustand | 5.x |
| 样式 | Tailwind CSS | 4.x |
| OCR | PaddleOCR PP-OCRv5 (ONNX) | - |
| OCR 备选 | Tesseract.js | 7.x |
| AI 推理 | ONNX Runtime Web | 1.24+ |
| Inpainting | LaMa ONNX + Laplace | - |
| PDF 解析 | pdf.js | 4.x |
| PPTX 生成 | pptxgenjs | 3.x |
| 单元测试 | Vitest | 3.x |
| E2E 测试 | Playwright | 1.x |
| 部署 | Cloudflare Pages | - |

## 4. 目录结构

```
src/
├── app/                           # 应用层
│   ├── App.tsx                    # 根组件（仅路由 + providers）
│   ├── routes/                    # 页面
│   │   ├── HomePage.tsx
│   │   ├── EditorPage.tsx
│   │   └── ChangelogPage.tsx
│   └── layout/
│       ├── SharedLayout.tsx       # 共享布局
│       ├── Header.tsx
│       └── Footer.tsx
│
├── features/                      # 功能模块（按领域划分）
│   ├── upload/                    # 文件上传
│   │   ├── components/
│   │   │   └── DropZone.tsx
│   │   ├── services/
│   │   │   ├── fileValidator.ts
│   │   │   ├── pdfParser.ts
│   │   │   └── imageLoader.ts
│   │   ├── hooks/
│   │   │   └── useUpload.ts
│   │   └── __tests__/
│   │       ├── fileValidator.test.ts
│   │       ├── pdfParser.test.ts
│   │       └── DropZone.test.tsx
│   │
│   ├── ocr/                       # OCR 引擎
│   │   ├── engines/
│   │   │   ├── PaddleOCREngine.ts
│   │   │   └── TesseractEngine.ts
│   │   ├── workers/
│   │   │   └── ocrWorker.ts
│   │   ├── services/
│   │   │   ├── mergeRegions.ts
│   │   │   ├── textSampler.ts
│   │   │   └── ocrManager.ts
│   │   ├── hooks/
│   │   │   └── useOCR.ts
│   │   └── __tests__/
│   │       ├── mergeRegions.test.ts
│   │       └── textSampler.test.ts
│   │
│   ├── inpaint/                   # Inpainting
│   │   ├── workers/
│   │   │   └── lamaWorker.ts
│   │   ├── services/
│   │   │   ├── laplaceInpaint.ts
│   │   │   ├── lamaPool.ts
│   │   │   └── hybridAnalyzer.ts
│   │   └── __tests__/
│   │       ├── laplaceInpaint.test.ts
│   │       └── hybridAnalyzer.test.ts
│   │
│   ├── canvas/                    # Canvas 编辑器
│   │   ├── components/
│   │   │   ├── CanvasEditor.tsx
│   │   │   ├── RegionOverlay.tsx
│   │   │   ├── Minimap.tsx
│   │   │   ├── ZoomControls.tsx
│   │   │   └── InlineTextEditor.tsx
│   │   ├── hooks/
│   │   │   ├── useCanvasRenderer.ts
│   │   │   └── useZoom.ts
│   │   └── __tests__/
│   │       └── useZoom.test.ts
│   │
│   ├── editor/                    # 编辑功能
│   │   ├── components/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── ThumbnailSidebar.tsx
│   │   │   ├── ObjectTree.tsx
│   │   │   └── PropertyPanel.tsx
│   │   ├── hooks/
│   │   │   └── useHistory.ts
│   │   └── __tests__/
│   │       └── useHistory.test.ts
│   │
│   └── export/                    # 导出
│       ├── services/
│       │   ├── exportService.ts
│       │   └── pptxBuilder.ts
│       └── __tests__/
│           └── pptxBuilder.test.ts
│
├── stores/                        # Zustand stores
│   ├── documentStore.ts           # 文档数据（pages, regions）
│   ├── editorStore.ts             # UI 状态（tool, zoom, panels）
│   ├── ocrStore.ts                # OCR 状态（engine, progress）
│   └── historyStore.ts            # Undo/Redo 栈
│
├── shared/                        # 共享层
│   ├── types/
│   │   └── index.ts               # 全局类型定义
│   ├── utils/
│   │   ├── logger.ts              # 结构化日志系统
│   │   ├── perf.ts                # 性能追踪
│   │   └── color.ts               # 颜色工具
│   ├── hooks/
│   │   ├── useKeyboard.ts
│   │   └── useTheme.ts
│   └── ui/
│       ├── Button.tsx
│       ├── ProgressBar.tsx
│       └── Toast.tsx
│
├── workers/                       # Web Workers 入口
│   ├── ocr.worker.ts
│   └── lama.worker.ts
│
├── __tests__/                     # 集成测试
│   └── stores/
│       ├── documentStore.test.ts
│       └── historyStore.test.ts
│
├── index.css                      # Tailwind 入口
└── main.tsx                       # 应用入口

e2e/                               # E2E 测试
├── fixtures/
│   ├── sample.pdf
│   └── sample.png
├── upload.e2e.ts
├── ocr.e2e.ts
├── edit.e2e.ts
├── export.e2e.ts
└── perf.e2e.ts

docs/                              # 文档
├── ARCHITECTURE.md                # 本文件
├── DEVELOPMENT_PLAN.md            # 开发计划
└── TESTING_STRATEGY.md            # 测试策略
```

## 5. 数据流架构

```
┌─────────────────────────────────────────────────────┐
│                    Zustand Stores                     │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │ document  │ │  editor  │ │  ocr   │ │ history  │ │
│  │  Store    │ │  Store   │ │ Store  │ │  Store   │ │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └────┬─────┘ │
└───────┼────────────┼───────────┼────────────┼───────┘
        │            │           │            │
   ┌────▼────┐  ┌────▼────┐ ┌───▼───┐  ┌────▼────┐
   │ Canvas  │  │Toolbar  │ │ OCR   │  │ Undo/   │
   │ Editor  │  │ + Panels│ │Worker │  │ Redo    │
   └────┬────┘  └─────────┘ └───┬───┘  └─────────┘
        │                       │
   ┌────▼────────────────────────▼────┐
   │        Web Workers               │
   │  ┌──────────┐  ┌──────────────┐  │
   │  │OCR Worker│  │LaMa Worker(s)│  │
   │  └──────────┘  └──────────────┘  │
   └──────────────────────────────────┘
```

## 6. 核心类型定义

```typescript
// 文档
interface Document {
  id: string;
  type: 'pdf' | 'image';
  metadata: FileMetadata;
  pages: Page[];
}

// 页面
interface Page {
  index: number;
  width: number;
  height: number;
  imageData: ImageData;
}

// 文字区域
interface TextRegion {
  id: string;
  text: string;
  boundingBox: BBox;
  fontSize: number;
  textColor: RGB;
  confidence: number;
  language: string;
  sourceIds?: string[];        // 合并来源
  inpaintMode?: InpaintMode;
}

// 擦除区域
interface ErasedRegion {
  id: string;
  boundingBox: BBox;
  fillColor: RGB;
  inpaintMode: InpaintMode;
  hybridSuggested: InpaintMode;
}

// 每页编辑状态
interface PageEditState {
  textRegions: TextRegion[];
  rawTextRegions: TextRegion[];
  erasedRegions: ErasedRegion[];
}

// 操作历史
type HistoryAction =
  | { type: 'text_edit'; regionId: string; oldText: string; newText: string; ... }
  | { type: 'erase'; regionId: string; region: TextRegion; ... }
  | { type: 'split'; mergedRegion: TextRegion; rawRegions: TextRegion[] }
  | { type: 'merge'; sourceRegions: TextRegion[]; mergedRegion: TextRegion }
  | { type: 'delete'; regions: TextRegion[] }
  | { type: 'move'; regionId: string; oldBBox: BBox; newBBox: BBox }
  | { type: 'resize'; regionId: string; oldBBox: BBox; newBBox: BBox };

type InpaintMode = 'laplace' | 'lama';
interface BBox { x: number; y: number; width: number; height: number; }
interface RGB { r: number; g: number; b: number; }
```

## 7. 日志系统设计

```typescript
// shared/utils/logger.ts
enum LogLevel { DEBUG, INFO, WARN, ERROR }

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  module: string;       // 'ocr' | 'inpaint' | 'export' | 'canvas' | ...
  message: string;
  data?: unknown;
  duration?: number;    // 性能追踪
}

// 使用方式
const log = createLogger('ocr');
log.info('Detection started', { engine: 'paddle', imageSize: '1920x1080' });
log.perf('Detection complete', startTime);  // 自动计算耗时
log.error('Model load failed', error);
```

## 8. 缓存策略

| 缓存层 | 存储 | 内容 | 生命周期 |
|--------|------|------|---------|
| 模型缓存 | Cache API | ONNX 模型文件 | 永久（版本化 key） |
| 渲染缓存 | 内存 Map | ImageBitmap | 页面生命周期 |
| Inpaint 缓存 | 内存 Map | 合成位图 | 页面生命周期 |
| 导出缓存 | 内存 Map | Base64 背景 | 导出期间 |
| 项目缓存 | IndexedDB | 完整项目状态 | 用户手动清除 |

## 9. Web Worker 通信协议

```typescript
// Worker 消息格式
interface WorkerRequest {
  type: string;
  id: number;
  payload: unknown;
}

interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  id: number;
  payload: unknown;
}

// RPC 封装
function callWorker<T>(worker: Worker, type: string, payload: unknown): Promise<T>;
```

## 10. 性能目标

| 指标 | 目标 | 原版 |
|------|------|------|
| 首屏加载 | < 2s | ~3s |
| 页面切换 | < 50ms | < 35ms (优化后) |
| OCR 单页 | < 10s | ~15s |
| Inpaint 单区域 | < 2s | ~3s |
| PPTX 导出 10页 | < 30s | ~45s |
| 模型二次加载 | < 1s | ~2s |
