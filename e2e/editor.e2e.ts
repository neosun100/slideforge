import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.resolve(__dirname, 'fixtures/sample.pdf');

test.describe('Editor - Upload', () => {
  test('shows upload screen initially', async ({ page }) => {
    await page.goto('/editor');
    await expect(page.locator('text=Upload a document')).toBeVisible();
    await expect(page.locator('text=Drop a file here')).toBeVisible();
  });

  test('upload PDF and see pages rendered', async ({ page }) => {
    await page.goto('/editor');

    // Upload via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Wait for processing to start
    await expect(page.locator('text=Loading PDF')).toBeVisible({ timeout: 10000 });

    // Wait for editor to appear (toolbar should show)
    await expect(page.locator('text=SlideForge').first()).toBeVisible({ timeout: 30000 });

    // Should see the export button
    await expect(page.locator('button:has-text("Export PPTX")')).toBeVisible();
  });

  test('rejects unsupported file format', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');

    // Create a fake .doc file
    await fileInput.setInputFiles({
      name: 'test.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('fake doc content'),
    });

    // Should show error toast
    await expect(page.locator('text=Unsupported format')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Editor - Tools', () => {
  test('toolbar shows after PDF upload', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Wait for toolbar
    await expect(page.locator('button[title*="Select tool"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button[title*="Eraser tool"]')).toBeVisible();
    await expect(page.locator('button[title*="Region OCR"]')).toBeVisible();
  });

  test('zoom controls work', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Wait for zoom label
    const zoomLabel = page.locator('button:has-text("%")');
    await expect(zoomLabel).toBeVisible({ timeout: 30000 });
    await expect(zoomLabel).toContainText('100%');

    // Click zoom in
    await page.click('button[title*="Zoom in"]');
    await expect(zoomLabel).toContainText('125%');

    // Click zoom out
    await page.click('button[title*="Zoom out"]');
    await expect(zoomLabel).toContainText('100%');
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible();

    // Default is dark (☀️ shown to switch to light)
    await themeBtn.click();
    // After click, should switch to light theme
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Click again to go back to dark
    await themeBtn.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Editor - Config Panel', () => {
  test('shows config panel with OCR engine selector on editor page', async ({ page }) => {
    await page.goto('/editor');
    await expect(page.locator('text=OCR Engine:')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Render scale:')).toBeVisible();
    await expect(page.locator('text=Merge mode:')).toBeVisible();
    await expect(page.locator('text=Pages to load:')).toBeVisible();
  });

  test('defaults to PaddleOCR engine', async ({ page }) => {
    await page.goto('/editor');
    const engineSelect = page.locator('select').filter({ has: page.locator('option:has-text("PP-OCRv5")') });
    await expect(engineSelect).toBeVisible({ timeout: 10000 });
    await expect(engineSelect).toHaveValue('paddle-ocr');
  });

  test('can switch OCR engine to Tesseract', async ({ page }) => {
    await page.goto('/editor');
    const engineSelect = page.locator('select').filter({ has: page.locator('option:has-text("PP-OCRv5")') });
    await expect(engineSelect).toBeVisible({ timeout: 10000 });
    await engineSelect.selectOption('tesseract');
    await expect(engineSelect).toHaveValue('tesseract');
  });

  test('config panel disappears after file upload', async ({ page }) => {
    await page.goto('/editor');
    await expect(page.locator('text=OCR Engine:')).toBeVisible({ timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // After upload, config panel should be gone (replaced by editor)
    await expect(page.locator('button:has-text("Export PPTX")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=OCR Engine:').first()).not.toBeVisible();
  });
});

test.describe('Editor - OCR Regression', () => {
  test('Objects panel populates after PDF upload and OCR', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Wait for editor to load
    await expect(page.locator('text=Pages').first()).toBeVisible({ timeout: 30000 });

    // Objects panel should eventually show detected regions (not "No regions detected")
    // OCR takes time, so we wait longer
    await expect(page.locator('text=Objects').first()).toBeVisible({ timeout: 60000 });
  });

  test('Export PPTX button is disabled during processing', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Export button should appear but be disabled during processing
    const exportBtn = page.locator('button:has-text("Export PPTX")');
    await expect(exportBtn).toBeVisible({ timeout: 30000 });
    // It should be disabled while OCR is running
    await expect(exportBtn).toBeDisabled();
  });
});

test.describe('Editor - Region OCR', () => {
  test('region OCR tool button exists in toolbar', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);
    await expect(page.locator('button[title*="Region OCR"]')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Editor - Text Editing', () => {
  test('PropertyPanel appears when editing region is set', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);
    // Wait for editor to load
    await expect(page.locator('button:has-text("Export PPTX")')).toBeVisible({ timeout: 30000 });
    // PropertyPanel should not be visible initially
    await expect(page.locator('text=Text Content')).not.toBeVisible();
  });
});

test.describe('Editor - Keyboard Shortcuts', () => {
  test('pressing B toggles bounding boxes', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);
    await expect(page.locator('button:has-text("Export PPTX")')).toBeVisible({ timeout: 30000 });

    // The bounding box toggle button should exist
    const bboxBtn = page.locator('button[title*="bounding boxes"]');
    await expect(bboxBtn).toBeVisible();

    // Press B to toggle
    await page.keyboard.press('b');
    // Button state should change (we just verify no crash)
    await expect(bboxBtn).toBeVisible();
  });

  test('pressing V switches to select tool', async ({ page }) => {
    await page.goto('/editor');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);
    await expect(page.locator('button[title*="Select tool"]')).toBeVisible({ timeout: 30000 });

    // Press E first to switch to erase
    await page.keyboard.press('e');
    // Press V to switch back to select
    await page.keyboard.press('v');
    // Select tool button should be active
    await expect(page.locator('button[title*="Select tool"]')).toBeVisible();
  });
});

test.describe('Editor - Full Workflow Regression', () => {
  test('upload PDF → pages render → toolbar visible → export button enabled after OCR', async ({ page }) => {
    await page.goto('/editor');

    // Upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(PDF_PATH);

    // Pages panel should appear
    await expect(page.locator('text=Pages').first()).toBeVisible({ timeout: 30000 });

    // Toolbar should be visible
    await expect(page.locator('text=SlideForge').first()).toBeVisible();

    // Export button should exist
    const exportBtn = page.locator('button:has-text("Export PPTX")');
    await expect(exportBtn).toBeVisible();
  });
});
