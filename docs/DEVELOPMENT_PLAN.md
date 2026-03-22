# SlideForge — Development Plan

## Phase 1: 项目初始化

### 1.1 脚手架
- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Tailwind CSS 4 安装配置
- [ ] React Router 7 安装配置
- [ ] Zustand 5 安装配置
- [ ] Vitest + @testing-library/react 安装配置
- [ ] Playwright 安装配置
- [ ] ESLint + Prettier 配置

### 1.2 日志系统 (`shared/utils/logger.ts`)
- [ ] LogLevel enum (DEBUG/INFO/WARN/ERROR)
- [ ] createLogger(module) 工厂函数
- [ ] log.info/warn/error/debug 方法
- [ ] log.perf(label, startTime) 性能追踪
- [ ] 开发环境 console 输出，生产环境静默
- [ ] 单元测试

### 1.3 基础类型 (`shared/types/index.ts`)
- [ ] Document, Page, TextRegion, ErasedRegion, PageEditState
- [ ] BBox, RGB, InpaintMode, HistoryAction
- [ ] FileMetadata, ExportOptions

### 1.4 Zustand Stores 骨架
- [ ] documentStore: pages, currentPageIndex, metadata
- [ ] editorStore: activeTool, zoom, showPanels, theme
- [ ] ocrStore: engineId, engineReady, progress
- [ ] historyStore: undoStack, redoStack, push/undo/redo
- [ ] 每个 store 的单元测试

## Phase 2: 共享 Layout + 落地页

### 2.1 共享布局
- [ ] SharedLayout.tsx (Header + Outlet + Footer)
- [ ] Header.tsx (logo + nav links + theme toggle)
- [ ] Footer.tsx
- [ ] React Router 配置 (/ + /editor + /changelog)

### 2.2 落地页 (HomePage.tsx)
- [ ] Hero section (标题 + 副标题 + CTA)
- [ ] Features grid (OCR / Inpaint / Export / Privacy)
- [ ] How it works (3 steps)
- [ ] FAQ (accordion)
- [ ] Drop zone (拖拽文件 → IndexedDB → redirect /editor)
- [ ] SEO meta tags + structured data
- [ ] 组件测试

### 2.3 基础 UI 组件
- [ ] Button (variants: primary/secondary/ghost)
- [ ] ProgressBar (determinate + indeterminate)
- [ ] Toast (error/success/info)
- [ ] 组件测试

## Phase 3: 文件上传模块

### 3.1 文件验证 (`fileValidator.ts`)
- [ ] validateFileSize (max 30MB)
- [ ] validateFileFormat (pdf/png/jpg/jpeg/webp)
- [ ] validatePageCount (max 20)
- [ ] isPdfFile / isImageFile helpers
- [ ] 单元测试 (各种边界情况)

### 3.2 PDF 解析 (`pdfParser.ts`)
- [ ] loadPdfDocument (pdf.js getDocument)
- [ ] renderPage (canvas → ImageData)
- [ ] parsePdfStreaming (逐页渲染 + 回调)
- [ ] PDF magic bytes 检测
- [ ] 单元测试

### 3.3 图片加载 (`imageLoader.ts`)
- [ ] loadImageFile (File → ImageData)
- [ ] 支持 PNG/JPG/WebP
- [ ] 单元测试

### 3.4 DropZone 组件
- [ ] 拖拽 + 点击上传
- [ ] 文件验证 + 错误提示
- [ ] 上传选项 (页数限制 / 渲染倍率 / OCR 引擎 / 合并模式)
- [ ] 组件测试

## Phase 4: OCR 引擎模块

### 4.1 PaddleOCR 引擎 (`PaddleOCREngine.ts`)
- [ ] 模型下载 (HuggingFace CDN)
- [ ] Cache API 缓存 + 进度回调
- [ ] ONNX Runtime Web 推理
- [ ] 检测模型 (PP-OCRv5_server_det)
- [ ] DB 后处理 (二值化 → 连通域 → 最小面积过滤)
- [ ] 识别模型 (PP-OCRv5_server_rec)
- [ ] CTC 解码 + 字典
- [ ] 单元测试

### 4.2 Tesseract 引擎 (`TesseractEngine.ts`)
- [ ] tesseract.js createWorker
- [ ] recognize → TextRegion 转换
- [ ] 行内间距分割
- [ ] 单元测试

### 4.3 OCR Worker (`ocrWorker.ts`)
- [ ] Worker 消息协议 (preload/recognize/recognizeRegion)
- [ ] 进度回调透传
- [ ] 错误处理

### 4.4 文字区域合并 (`mergeRegions.ts`)
- [ ] Union-Find 算法
- [ ] 合并条件: 字号比 < 1.5x, 水平重叠 > 70%, 垂直间距 < min(30px, fontSize*0.4)
- [ ] 同行合并模式
- [ ] 全近邻合并模式
- [ ] 单元测试 (各种布局场景)

### 4.5 文字采样 (`textSampler.ts`)
- [ ] sampleTextColor: 边界外 3px 环带最暗像素
- [ ] sampleBackgroundColor: 边界外 5px 均值
- [ ] estimateFontSize: height * 0.85
- [ ] 单元测试

## Phase 5: Canvas 编辑器

### 5.1 渲染管线 (`useCanvasRenderer.ts`)
- [ ] ImageBitmap 缓存 (per page)
- [ ] Inpaint 合成位图缓存
- [ ] Canvas 绘制 (原图 → inpaint overlay)
- [ ] 缓存 fingerprint (erasedRegions hash)
- [ ] 性能测试 (页面切换 < 50ms)

### 5.2 Canvas 编辑器组件 (`CanvasEditor.tsx`)
- [ ] 自适应缩放 (fit to viewport)
- [ ] 文字区域 overlay (选择/悬停/多选/合并标记)
- [ ] 擦除工具 (点击区域 → inpaint)
- [ ] 区域 OCR 工具 (框选 → 局部识别)
- [ ] 拖拽移动文字框 ★
- [ ] 缩放手柄 ★

### 5.3 缩放控制 (`useZoom.ts` + `ZoomControls.tsx`)
- [ ] Ctrl+滚轮缩放
- [ ] 工具栏 +/- 按钮
- [ ] 百分比标签 (点击重置)
- [ ] Ctrl+=/-/0 快捷键
- [ ] 缩放范围 25%-400%
- [ ] 单元测试

### 5.4 小地图 (`Minimap.tsx`)
- [ ] 缩放 > 100% 时显示
- [ ] 视口矩形
- [ ] 点击/拖拽平移
- [ ] 组件测试

### 5.5 工具栏 (`Toolbar.tsx`)
- [ ] 工具切换 (选择/擦除/区域OCR)
- [ ] Undo/Redo 按钮
- [ ] OCR 引擎选择
- [ ] 面板切换 (页面列表/对象树)
- [ ] 边框显示/合并模式/置信度阈值
- [ ] 缩放控制
- [ ] 导出按钮
- [ ] 品牌标识
- [ ] 组件测试

## Phase 6: Inpainting 模块

### 6.1 Laplace 扩散填充 (`laplaceInpaint.ts`)
- [ ] 边界像素采样
- [ ] 迭代扩散 (从边界向内)
- [ ] 收敛检测
- [ ] 单元测试

### 6.2 LaMa Worker (`lamaWorker.ts` + `lamaPool.ts`)
- [ ] ONNX 模型加载 (HuggingFace CDN)
- [ ] Cache API 缓存
- [ ] Worker 池 (hardwareConcurrency - 2, max 4)
- [ ] 单区域 inpaint
- [ ] 批量 inpaint
- [ ] 超时回退到 Laplace
- [ ] 单元测试

### 6.3 混合分析器 (`hybridAnalyzer.ts`)
- [ ] 边界像素方差计算
- [ ] 阈值判断 (方差 > 50 → LaMa, 否则 Laplace)
- [ ] 单元测试

### 6.4 Inpaint 缓存
- [ ] fingerprint 生成 (region ids + modes)
- [ ] 合成位图缓存 (ImageBitmap)
- [ ] 导出缓存 (base64)
- [ ] 缓存失效策略

## Phase 7: 编辑功能

### 7.1 内联文字编辑 (`InlineTextEditor.tsx`) ★
- [ ] 双击区域 → 弹出编辑框
- [ ] 定位在区域上方
- [ ] 实时预览
- [ ] Enter 确认 / Escape 取消

### 7.2 属性面板 (`PropertyPanel.tsx`)
- [ ] 文字内容编辑
- [ ] 字号调整 (滑块 50%-200%)
- [ ] 颜色选择器 (色板 + hex 输入)
- [ ] 字体选择 ★
- [ ] Apply / Cancel 按钮
- [ ] 组件测试

### 7.3 对象树 (`ObjectTree.tsx`)
- [ ] 区域列表 (文字预览 + 置信度 + inpaint 模式)
- [ ] 多选操作 (合并/擦除/删除)
- [ ] 合并组展开/折叠
- [ ] 子区域高亮
- [ ] 悬停联动 (树 ↔ canvas)
- [ ] 键盘操作 (Delete/Enter/E/S)
- [ ] 组件测试

### 7.4 缩略图侧边栏 (`ThumbnailSidebar.tsx`)
- [ ] 页面缩略图列表
- [ ] 当前页高亮 + 自动滚动
- [ ] 可拖拽调整宽度
- [ ] 组件测试

### 7.5 Undo/Redo (`useHistory.ts` + `historyStore.ts`)
- [ ] 操作类型: text_edit / erase / split / merge / delete / move / resize
- [ ] Ctrl+Z / Ctrl+Y 快捷键
- [ ] 栈大小限制 (80)
- [ ] 单元测试

### 7.6 项目保存 ★
- [ ] IndexedDB 自动保存 (debounced)
- [ ] 项目加载/恢复
- [ ] 清除项目

## Phase 8: 导出模块

### 8.1 PPTX 导出 (`exportService.ts`)
- [ ] 并行生成 inpainted 背景
- [ ] pptxgenjs 构建 (自定义尺寸)
- [ ] 背景图 + 文本框定位
- [ ] 进度回调
- [ ] 单元测试

### 8.2 导出选项 ★
- [ ] 背景格式 (JPEG / PNG)
- [ ] JPEG 质量滑块 (0.5-1.0)
- [ ] 幻灯片尺寸 (16:9 / 4:3 / 自定义)

### 8.3 导出进度
- [ ] 全屏进度遮罩
- [ ] 逐页进度
- [ ] 日志面板

## Phase 9: 打磨

### 9.1 PWA
- [ ] Service Worker (Workbox)
- [ ] Web App Manifest
- [ ] 离线支持

### 9.2 主题系统 ★
- [ ] 暗色/亮色切换
- [ ] CSS 变量
- [ ] localStorage 持久化
- [ ] 系统偏好检测

### 9.3 快捷键
- [ ] V (选择) / E (擦除) / R (区域OCR)
- [ ] B (边框) / M (合并)
- [ ] Ctrl+=/-/0 (缩放)
- [ ] Ctrl+Z/Y (撤销/重做)
- [ ] Delete/Backspace (删除)
- [ ] PageUp/PageDown (翻页) ★
- [ ] 快捷键帮助面板

### 9.4 SEO
- [ ] WebApplication + FAQPage 结构化数据
- [ ] Open Graph + Twitter Card
- [ ] 自动生成 sitemap.xml
- [ ] robots.txt

### 9.5 性能优化
- [ ] 代码分割 (lazy import: pdf.js, pptxgenjs, onnxruntime)
- [ ] 模型预加载
- [ ] Canvas 渲染优化 (requestAnimationFrame)
- [ ] 内存管理 (ImageBitmap.close())

## Phase 10: E2E 测试 + 部署

### 10.1 E2E 测试
- [ ] 上传 PDF → OCR → 编辑 → 导出完整流程
- [ ] 上传图片流程
- [ ] 页面切换性能 (< 50ms)
- [ ] 缩放/平移操作
- [ ] Undo/Redo 操作
- [ ] 键盘快捷键

### 10.2 构建验证
- [ ] `npm run build` 无错误
- [ ] `npm run test` 全部通过
- [ ] `npm run test:e2e` 全部通过
- [ ] Bundle 大小分析

### 10.3 部署
- [ ] Cloudflare Pages 配置
- [ ] 自定义域名
- [ ] 性能监控
