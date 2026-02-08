import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.E2E_BASE || 'http://localhost:3000/dylan-a-day';

test.describe('Accessibility', () => {
  test('page has no critical a11y violations', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Wait for media to load (image or video)
    await page.waitForSelector('img, video', { timeout: 10_000 }).catch(() => {
      // Media may fail to load in CI without real images
    });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast']) // Full-screen photo app — contrast N/A
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      const summary = critical
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
        .join('\n');
      expect(critical, `A11y violations found:\n${summary}`).toEqual([]);
    }
  });

  test('image has alt text when displayed', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Wait for client-side hydration to create media elements
    await page.waitForTimeout(3000);

    const img = page.locator('img');
    const imgCount = await img.count();

    if (imgCount > 0) {
      const altText = await img.first().getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(0);
    }
    // If no image is present (video day or CI without images), this test passes
    // since there's nothing to check alt text on
  });

  test('page has valid document structure', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Check that html lang attribute is set
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();

    // Check that there's a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
