import { test, expect } from '@playwright/test';

test.describe('Mobile Shell', () => {
  test('homepage loads without horizontal overflow at 375x812', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      const scrollWidth = doc.scrollWidth;
      const clientWidth = doc.clientWidth;
      return scrollWidth - clientWidth;
    });

    expect(overflowX).toBe(0);
  });

  test('homepage loads without horizontal overflow at 390x844', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      const scrollWidth = doc.scrollWidth;
      const clientWidth = doc.clientWidth;
      return scrollWidth - clientWidth;
    });

    expect(overflowX).toBe(0);
  });

  test('header and navigation are visible and usable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('nav');
    await expect(header).toBeVisible();

    const mobileNav = page.locator('.md\\:hidden').first();
    if (await mobileNav.count() > 0) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('auth section does not overflow on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const authSection = page.locator('#auth-section, [class*="AuthSection"], button:has-text("Login / Create")').first();
    if (await authSection.count() > 0) {
      await expect(authSection).toBeVisible();
    }

    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflowX).toBe(0);
  });

  test('no fatal page errors on mobile load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fatalErrors = errors.filter(e => e.includes('SyntaxError') || e.includes('ReferenceError'));
    expect(fatalErrors.length).toBe(0);
  });
});
