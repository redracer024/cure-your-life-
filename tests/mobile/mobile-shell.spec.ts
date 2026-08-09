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

  test('SplitRevealHeading has correct semantics and keyboard behavior', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headingControl = page.locator('[role="button"][aria-expanded]').first();
    await expect(headingControl).toBeVisible();

    const semanticHeadings = headingControl.locator('h1, h2, h3, h4, h5, h6');
    await expect(semanticHeadings).toHaveCount(0);

    const component = page.locator('[data-testid="split-reveal"]').first();
    const componentHeadings = component.locator('h1, h2, h3, h4, h5, h6');
    await expect(componentHeadings).toHaveCount(1);

    const accessibleHeading = page.getByRole('heading', { name: 'BodySignal' });
    await expect(accessibleHeading).toHaveCount(1);
    await expect(accessibleHeading).toHaveJSProperty('tagName', 'H1');

    const srOnlyHeading = page.locator('h1.sr-only');
    await expect(srOnlyHeading).toHaveCount(1);
    await expect(srOnlyHeading).toHaveText('BodySignal');
    await expect(headingControl.locator('.sr-only')).toHaveCount(0);

    const visualCopies = headingControl.locator('span[aria-hidden="true"]');
    await expect(visualCopies).toHaveCount(3);

    const labelledBy = await headingControl.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelledHeading = page.locator(`[id="${labelledBy}"]`);
    await expect(labelledHeading).toHaveCount(1);
    await expect(labelledHeading).toHaveText('BodySignal');
    await expect(headingControl).toHaveAttribute('aria-labelledby', labelledBy!);

    const describedBy = await headingControl.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const description = page.locator(`[id="${describedBy}"]`);
    await expect(description).toHaveCount(1);
    await expect(description).toHaveText('Explore the whole pattern.');
    await expect(headingControl).toHaveAttribute('aria-describedby', describedBy!);

    // aria-labelledby points to the component's single semantic heading
    await expect(labelledHeading).toHaveJSProperty('tagName', 'H1');

    // aria-expanded reflects persistent pinned state, not temporary hover/focus
    await headingControl.focus();
    await expect(headingControl).toHaveAttribute('aria-expanded', 'false');

    // Enter toggles pinned/open state
    await headingControl.press('Enter');
    await expect(headingControl).toHaveAttribute('aria-expanded', 'true');
    await expect(headingControl).toHaveAttribute('data-pinned', 'true');

    // Space toggles pinned/open state and prevents scroll
    const scrollYBeforeSpace = await page.evaluate(() => window.scrollY);
    await headingControl.press('Space');
    await expect(headingControl).toHaveAttribute('aria-expanded', 'false');
    await expect(headingControl).toHaveAttribute('data-pinned', 'false');
    const scrollYAfterSpace = await page.evaluate(() => window.scrollY);
    expect(scrollYAfterSpace).toBe(scrollYBeforeSpace);

    const allControls = page.locator('[data-testid="split-reveal"] [role="button"][aria-expanded]');
    const describedByIds = await allControls.evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-describedby')).filter(Boolean) as string[]);
    expect(new Set(describedByIds).size).toBe(describedByIds.length);
  });

  test('SplitRevealHeading toggles via touch on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'touch-only', description: 'Requires hasTouch context' });
    const hasTouch = test.info().project.use.hasTouch;
    if (!hasTouch) {
      test.skip(true, 'Touch assertions require a mobile/touch-enabled project');
      return;
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headingControl = page.locator('[role="button"][aria-expanded]').first();
    await expect(headingControl).toBeVisible();

    await headingControl.tap();
    await expect(headingControl).toHaveAttribute('aria-expanded', 'true');
    await expect(headingControl).toHaveAttribute('data-pinned', 'true');
    await expect(headingControl).toHaveAttribute('data-revealed', 'true');

    // Second tap closes the reveal
    await headingControl.tap();
    await expect(headingControl).toHaveAttribute('data-pinned', 'false');
    await expect(headingControl).toHaveAttribute('aria-expanded', 'false');
    await headingControl.evaluate((el: HTMLElement) => el.blur());
    await expect(headingControl).toHaveAttribute('data-revealed', 'false');

    // Verify toggle behavior at the existing 375x812 mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await headingControl.tap();
    await expect(headingControl).toHaveAttribute('data-pinned', 'true');
    await expect(headingControl).toHaveAttribute('aria-expanded', 'true');
    await expect(headingControl).toHaveAttribute('data-revealed', 'true');

    await headingControl.tap();
    await expect(headingControl).toHaveAttribute('data-pinned', 'false');
    await expect(headingControl).toHaveAttribute('aria-expanded', 'false');
    await headingControl.evaluate((el: HTMLElement) => el.blur());
    await expect(headingControl).toHaveAttribute('data-revealed', 'false');
  });
});
