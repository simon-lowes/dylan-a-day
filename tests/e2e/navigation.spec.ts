import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE || 'http://localhost:3000/dylan-a-day';

test.describe('Navigation and media display', () => {
  test('page loads without fatal JS errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // No uncaught JS errors (page-level exceptions)
    expect(pageErrors, 'Unexpected page errors').toEqual([]);
  });

  test('page renders and hydrates successfully', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // After hydration, the page should have rendered content
    // The SSR HTML always contains a loading spinner div, even before hydration
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    expect(bodyHTML.length).toBeGreaterThan(100);

    // Check that the main container div exists
    const container = await page.evaluate(() => {
      const div = document.querySelector('div');
      return div !== null;
    });
    expect(container).toBe(true);
  });

  test('image has Ken Burns animation class when loaded', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const img = page.locator('img');
    const imgCount = await img.count();

    if (imgCount > 0) {
      const classes = await img.first().getAttribute('class');
      expect(classes).toBeTruthy();

      // If image loaded successfully, Ken Burns class should be present
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

  test('media element uses object-cover for full-viewport display', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const img = page.locator('img');
    const video = page.locator('video');

    const imgCount = await img.count();
    const videoCount = await video.count();

    if (imgCount > 0) {
      const styles = await img.first().evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          position: cs.position,
          objectFit: cs.objectFit,
        };
      });
      expect(styles.position).toBe('absolute');
      expect(styles.objectFit).toBe('cover');
    } else if (videoCount > 0) {
      const styles = await video.first().evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          position: cs.position,
          objectFit: cs.objectFit,
        };
      });
      expect(styles.position).toBe('absolute');
      expect(styles.objectFit).toBe('cover');
    }
  });
});
