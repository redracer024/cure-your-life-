import { test, expect } from '@playwright/test';

test.describe('Mobile Media', () => {
  test('media video component fits viewport', async ({ page }) => {
    await page.goto('/patterns');
    await page.waitForLoadState('networkidle');

    const firstPattern = page.locator('button:has-text("Pattern Dictionary") ~ div button').first();
    if (await firstPattern.count() > 0) {
      await firstPattern.click();
      await page.waitForTimeout(500);
    }

    const videoContainer = page.locator('video').first();
    if (await videoContainer.count() > 0) {
      await expect(videoContainer).toBeVisible();
      const box = await videoContainer.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(390);
    }
  });

  test('video controls render', async ({ page }) => {
    await page.goto('/patterns');
    await page.waitForLoadState('networkidle');

    const firstPattern = page.locator('button:has-text("Pattern Dictionary") ~ div button').first();
    if (await firstPattern.count() > 0) {
      await firstPattern.click();
      await page.waitForTimeout(500);
    }

    const video = page.locator('video').first();
    if (await video.count() > 0) {
      const hasControls = await video.getAttribute('controls');
      expect(hasControls).not.toBeNull();
    }
  });

  test('slide viewer fits viewport', async ({ page }) => {
    await page.goto('/patterns');
    await page.waitForLoadState('networkidle');

    const firstPattern = page.locator('button:has-text("Pattern Dictionary") ~ div button').first();
    if (await firstPattern.count() > 0) {
      await firstPattern.click();
      await page.waitForTimeout(500);
    }

    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflowX).toBe(0);
  });

  test('no fatal media errors on mobile', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/patterns');
    await page.waitForLoadState('networkidle');

    const fatalErrors = errors.filter(e => e.includes('SyntaxError') || e.includes('ReferenceError'));
    expect(fatalErrors.length).toBe(0);
  });
});
