import { test, expect } from '@playwright/test';

test.describe('Smoke test', () => {
  test('app loads without fatal JS errors', async ({ page }) => {
    const fatalErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Minified React error') ||
          text.includes('ChunkLoadError') ||
          text.includes('Uncaught') ||
          text.includes('Cannot read properties of undefined') ||
          text.includes('is not a function')
        ) {
          fatalErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      fatalErrors.push(error.message);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const root = page.locator('#__next');
    await expect(root).not.toBeEmpty();

    expect(fatalErrors, 'Fatal JS errors detected').toEqual([]);
  });
});
