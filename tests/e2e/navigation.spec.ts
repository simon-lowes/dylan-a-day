import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE || 'http://localhost:3000';

test.describe('Navigation and media display', () => {
  test('page loads and displays media or error state', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected errors (image/video load failures in CI)
        if (
          !text.includes('Image failed to load') &&
          !text.includes('Video failed to load') &&
          !text.includes('net::ERR_')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Wait for client-side hydration
    await page.waitForTimeout(2000);

    // Should show either media, error state, or loading spinner
    const img = page.locator('img');
    const video = page.locator('video');
    const errorMsg = page.locator('text=Failed to load media');
    const spinner = page.locator('.animate-spin');

    const imgCount = await img.count();
    const videoCount = await video.count();
    const errorCount = await errorMsg.count();
    const spinnerCount = await spinner.count();

    // At least one of these states should be present
    expect(imgCount + videoCount + errorCount + spinnerCount).toBeGreaterThan(0);

    // No unexpected JS errors
    expect(pageErrors, 'Unexpected page errors').toEqual([]);
    expect(consoleErrors, 'Unexpected console errors').toEqual([]);
  });

  test('image has Ken Burns animation class when loaded', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Wait for client-side rendering and potential image load
    await page.waitForTimeout(3000);

    const img = page.locator('img');
    const imgCount = await img.count();

    if (imgCount > 0) {
      const classes = await img.first().getAttribute('class');
      expect(classes).toBeTruthy();

      // Check that object-cover is applied (base styling)
      expect(classes).toContain('object-cover');

      // If image loaded successfully, Ken Burns class should be present
      // (may not be present if image failed to load in CI)
      const hasKenBurns =
        classes!.includes('kenburns-pan-') ||
        classes!.includes('kenburns-zoom-');

      const opacity = await img.first().evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });

      // If opacity is 1, the image loaded and should have Ken Burns
      if (opacity === '1') {
        expect(hasKenBurns).toBe(true);
      }
    }
  });

  test('loading spinner appears initially', async ({ page }) => {
    // Navigate without waiting for network idle to catch the spinner
    await page.goto(BASE, { waitUntil: 'commit' });

    // The spinner should be visible before media loads
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible({ timeout: 5000 });
  });

  test('page has black background', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const container = page.locator('.bg-black').first();
    await expect(container).toBeVisible();
  });

  test('media fills the viewport', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const img = page.locator('img');
    const video = page.locator('video');

    const imgCount = await img.count();
    const videoCount = await video.count();

    if (imgCount > 0) {
      const classes = await img.first().getAttribute('class');
      expect(classes).toContain('inset-0');
      expect(classes).toContain('h-full');
      expect(classes).toContain('w-full');
    } else if (videoCount > 0) {
      const classes = await video.first().getAttribute('class');
      expect(classes).toContain('inset-0');
      expect(classes).toContain('h-full');
      expect(classes).toContain('w-full');
    }
  });
});
