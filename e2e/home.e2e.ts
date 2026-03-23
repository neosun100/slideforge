import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('renders hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Edit Presentations');
    const cta = page.getByRole('link', { name: "Open Editor — It's Free" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/editor');
  });

  test('renders all 4 features', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=OCR Text Detection')).toBeVisible();
    await expect(page.locator('text=Smart Inpainting')).toBeVisible();
    await expect(page.locator('text=Export to PPTX')).toBeVisible();
    await expect(page.locator('text=100% Private')).toBeVisible();
  });

  test('FAQ section is interactive', async ({ page }) => {
    await page.goto('/');
    const faq = page.locator('div:has-text("Is SlideForge really free")').first();
    await expect(faq).toBeVisible();
    await faq.click();
    await expect(page.locator('text=completely free')).toBeVisible();
  });

  test('navigates to editor', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Open Editor")');
    await expect(page).toHaveURL('/editor');
    await expect(page.locator('text=Upload a document')).toBeVisible();
  });
});

test.describe('SEO & Meta Tags', () => {
  test('home page has correct OG meta tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('SlideForge');
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDesc).toBeTruthy();
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('og-image.png');
  });

  test('home page has JSON-LD structured data', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.locator('script[type="application/ld+json"]').count();
    expect(scripts).toBeGreaterThanOrEqual(2); // WebApplication + FAQPage
  });

  test('home page has canonical URL', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('slideforge.aws.xin');
  });
});
