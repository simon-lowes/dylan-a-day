import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE || 'http://localhost:3000/dylan-a-day';

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

    await page.goto(BASE, { waitUntil: 'networkidle' });

    // App Router renders directly into body (no #__next wrapper)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    expect(fatalErrors, 'Fatal JS errors detected').toEqual([]);
  });
});
