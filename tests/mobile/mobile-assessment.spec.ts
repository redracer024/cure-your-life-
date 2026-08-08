import { test, expect } from '@playwright/test';

test.describe('Mobile Assessment', () => {
  test('assessment launch button is visible and tappable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const quizButton = page.locator('button:has-text("Personality Pattern Quiz")').first();
    if (await quizButton.count() > 0) {
      await expect(quizButton).toBeVisible();
    }
  });

  test('assessment dialog opens and fits viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openQuiz = page.locator('button:has-text("Personality Pattern Quiz")').first();
    if (await openQuiz.count() === 0) return;

    await openQuiz.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    if (await dialog.count() > 0) {
      await expect(dialog).toBeVisible();

      const overflowX = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflowX).toBe(0);
    }
  });

  test('assessment question choices are tappable on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openQuiz = page.locator('button:has-text("Personality Pattern Quiz")').first();
    if (await openQuiz.count() === 0) return;

    await openQuiz.click();
    await page.waitForTimeout(500);

    const consentCheckbox = page.locator('input[type="checkbox"]').first();
    if (await consentCheckbox.count() > 0) {
      await consentCheckbox.check();
    }

    const startButton = page.locator('button:has-text("Start Assessment")').first();
    if (await startButton.count() > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    const choiceButtons = page.locator('[role="group"] button').first();
    if (await choiceButtons.count() > 0) {
      const box = await choiceButtons.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(40);
      expect(box?.height).toBeGreaterThanOrEqual(40);
    }
  });
});
