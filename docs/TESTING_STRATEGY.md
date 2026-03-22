# SlideForge — Testing Strategy

## 1. 测试金字塔

```
        ┌─────────┐
        │  E2E    │  Playwright (5-10 tests)
        │ Tests   │  完整用户流程
        ├─────────┤
        │ Integr. │  Vitest (10-20 tests)
        │ Tests   │  Store + Service 组合
        ├─────────┤
        │  Unit   │  Vitest (50-100 tests)
        │ Tests   │  纯函数 + hooks + 组件
        └─────────┘
```

## 2. 单元测试 (Vitest)

### 2.1 覆盖范围

| 模块 | 测试文件 | 关键测试点 |
|------|---------|-----------|
| 日志系统 | `logger.test.ts` | 各级别输出、perf 计时、模块标记 |
| 文件验证 | `fileValidator.test.ts` | 大小限制、格式检查、页数限制、边界值 |
| PDF 解析 | `pdfParser.test.ts` | magic bytes、页数获取、渲染 |
| 图片加载 | `imageLoader.test.ts` | PNG/JPG/WebP 加载 |
| 区域合并 | `mergeRegions.test.ts` | 同行合并、跨行不合并、字号差异、空输入 |
| 文字采样 | `textSampler.test.ts` | 颜色采样、字号估算、边界情况 |
| Laplace | `laplaceInpaint.test.ts` | 纯色填充、边界扩散 |
| 混合分析 | `hybridAnalyzer.test.ts` | 低方差→laplace、高方差→lama |
| 缩放 | `useZoom.test.ts` | 范围限制、步进、重置 |
| 历史 | `useHistory.test.ts` | push/undo/redo、栈大小限制 |
| PPTX 构建 | `pptxBuilder.test.ts` | 坐标转换、颜色转换 |
| Stores | `documentStore.test.ts` | 页面增删、区域更新 |
| Stores | `historyStore.test.ts` | 操作入栈、撤销、重做 |
| 颜色工具 | `color.test.ts` | RGB↔Hex 转换 |

### 2.2 测试规范

```typescript
// 命名: describe(模块) → it(行为)
describe('fileValidator', () => {
  describe('validateFileSize', () => {
    it('should accept files under 30MB', () => { ... });
    it('should reject files over 30MB', () => { ... });
    it('should accept exactly 30MB file', () => { ... });
    it('should accept 0 byte file', () => { ... });
  });
});

// 每个测试独立，无副作用
// 使用 vi.fn() mock 外部依赖
// 使用 vi.useFakeTimers() 控制时间
```

### 2.3 运行命令

```bash
npm run test              # 运行所有单元测试
npm run test:watch        # 监听模式
npm run test:coverage     # 覆盖率报告
npm run test:ui           # Vitest UI
```

## 3. 组件测试 (@testing-library/react)

### 3.1 覆盖范围

| 组件 | 测试点 |
|------|--------|
| DropZone | 拖拽事件、点击上传、文件验证错误显示 |
| Toolbar | 工具切换、按钮状态、disabled 状态 |
| ThumbnailSidebar | 页面列表渲染、选中高亮、点击切换 |
| ObjectTree | 区域列表、多选、悬停联动 |
| PropertyPanel | 文字编辑、颜色选择、Apply/Cancel |
| ProgressBar | 进度显示、indeterminate 模式 |
| Toast | 显示/隐藏、自动消失 |
| Button | variants 渲染、disabled、click |

### 3.2 测试规范

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('DropZone', () => {
  it('should show drop hint text', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByText(/drop a file/i)).toBeInTheDocument();
  });

  it('should call onFile when file is dropped', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    // simulate drop event...
  });

  it('should show error for unsupported format', () => { ... });
});
```

## 4. 集成测试

### 4.1 Store 集成

```typescript
// __tests__/stores/documentStore.test.ts
describe('documentStore + historyStore integration', () => {
  it('should undo text edit and restore previous text', () => {
    // 1. 设置初始状态
    // 2. 执行文字编辑
    // 3. 验证新文字
    // 4. 执行 undo
    // 5. 验证恢复旧文字
  });

  it('should undo merge and restore individual regions', () => { ... });
  it('should undo delete and restore regions', () => { ... });
});
```

### 4.2 OCR + 合并集成

```typescript
describe('OCR pipeline integration', () => {
  it('should detect regions and merge same-row boxes', () => {
    // 1. 提供测试 ImageData
    // 2. 运行 OCR
    // 3. 验证合并结果
  });
});
```

## 5. E2E 测试 (Playwright)

### 5.1 测试场景

```typescript
// e2e/upload.e2e.ts
test('upload PDF and see pages rendered', async ({ page }) => {
  await page.goto('/editor');
  // 上传 PDF fixture
  // 等待页面渲染
  // 验证缩略图数量
  // 验证 canvas 显示
});

// e2e/ocr.e2e.ts
test('OCR detects text regions from PDF', async ({ page }) => {
  // 上传 PDF
  // 等待 OCR 完成
  // 验证检测到的区域数量 > 0
  // 验证区域文字内容
});

// e2e/edit.e2e.ts
test('erase region and see inpaint preview', async ({ page }) => {
  // 上传 → OCR → 选择区域 → 擦除
  // 验证 erased overlay 出现
});

test('undo/redo works correctly', async ({ page }) => {
  // 执行操作 → undo → 验证恢复 → redo → 验证重做
});

// e2e/export.e2e.ts
test('export to PPTX downloads file', async ({ page }) => {
  // 上传 → OCR → 导出
  // 验证下载触发
});

// e2e/perf.e2e.ts
test('page switch completes under 50ms', async ({ page }) => {
  // 上传多页 PDF
  // 测量页面切换时间
  // assert < 50ms
});
```

### 5.2 Fixtures

```
e2e/fixtures/
├── sample.pdf          # 2-3 页带文字的 PDF
├── sample.png          # 带文字的图片
├── notebooklm.pdf      # NotebookLM 导出的真实 PDF (用户提供)
└── empty.pdf           # 空白 PDF (边界测试)
```

### 5.3 Playwright 配置

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run preview',  // 生产构建测试
    port: 4173,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### 5.4 运行命令

```bash
npm run test:e2e          # 运行所有 E2E 测试
npm run test:e2e:ui       # Playwright UI 模式
npm run test:e2e:headed   # 有头模式 (调试)
```

## 6. 测试覆盖率目标

| 层面 | 目标 |
|------|------|
| 单元测试行覆盖率 | > 80% |
| 分支覆盖率 | > 70% |
| 关键路径 E2E | 100% (上传→OCR→编辑→导出) |

## 7. CI 集成

```yaml
# .github/workflows/test.yml (未来)
- npm run test -- --coverage
- npm run build
- npx playwright install --with-deps
- npm run test:e2e
```

## 8. 测试命名约定

```
单元测试:  src/features/{module}/__tests__/{file}.test.ts
组件测试:  src/features/{module}/__tests__/{Component}.test.tsx
集成测试:  src/__tests__/{scenario}.test.ts
E2E 测试:  e2e/{flow}.e2e.ts
```
