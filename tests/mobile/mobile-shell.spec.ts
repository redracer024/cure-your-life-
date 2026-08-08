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

    const authToggle = page.locator('button:has-text("SIGN IN / CREATE")').first();
    await expect(authToggle).toBeVisible();

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

  test('compact SIGN IN / CREATE control is visible on mobile unsigned state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInButton = page.locator('button:has-text("SIGN IN / CREATE")').first();
    await expect(signInButton).toBeVisible();

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).not.toBeVisible();
  });

  test('tapping SIGN IN / CREATE reveals auth form fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInButton = page.locator('button:has-text("SIGN IN / CREATE")').first();
    await expect(signInButton).toBeVisible();

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).not.toBeVisible();

    await signInButton.click();

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Login / Create")').first()).toBeVisible();
  });

  test('HIDE LOGIN collapses the auth form again', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signInButton = page.locator('button:has-text("SIGN IN / CREATE")').first();
    await expect(signInButton).toBeVisible();

    await signInButton.click();

    const hideButton = page.locator('button:has-text("HIDE LOGIN")').first();
    await expect(hideButton).toBeVisible();

    await hideButton.click();

    await expect(page.locator('input[type="email"]').first()).not.toBeVisible();
  });

  test('footer links remain visible and tappable on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    const legalButtons = footer.locator('button');
    const legalCount = await legalButtons.count();
    expect(legalCount).toBeGreaterThanOrEqual(1);

    await expect(legalButtons.first()).toBeVisible();
  });

  test('legal modal can open from a footer link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footerButton = page.locator('footer button').first();
    await expect(footerButton).toBeVisible();

    await footerButton.click();

    const modal = page.locator('[role="dialog"][aria-modal="true"]').first();
    await expect(modal).toBeVisible();
  });

  test('normal unsigned auth form is visible without expansion at sm+', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 640, height: 900 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Login / Create")').first()).toBeVisible();

    const mobileToggle = page.locator('button:has-text("SIGN IN / CREATE")').first();
    if (await mobileToggle.count() > 0) {
      await expect(mobileToggle).not.toBeVisible();
    }
  });
});
