import { test, expect } from '@playwright/test';

test.describe('SplitRevealHeading visual effect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Dismiss the medical disclosure modal so the heading is not overlay-blocked
    const ack = page.locator('[data-disclosure-ack]');
    if (await ack.count()) {
      await ack.first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-disclosure-ack]')).toHaveCount(0);
    }
    await expect(page.locator('[data-testid="split-reveal"]')).toBeVisible();
  });

  test.use({ viewport: { width: 1280, height: 800 } });

  const control = (page: any) =>
    page
      .locator('[data-testid="split-reveal"] [role="button"][aria-expanded]')
      .first();

  // All spans[aria-hidden="true"] within the wrapper, in stable DOM order:
  //   0 = base, 1 = top copy, 2 = bottom copy, 3 = chromatic shadow, 4 = cut accent
  const copies = (page: any) =>
    page.locator('[data-testid="split-reveal"] span[aria-hidden="true"]');
  const topCopy = (page: any) => copies(page).nth(1);
  const bottomCopy = (page: any) => copies(page).nth(2);
  const subtitle = (page: any) =>
    page
      .locator('[data-testid="split-reveal"] .pointer-events-none')
      .first();

  test('REST: reads as one clean heading, subtitle hidden, no duplication', async ({
    page,
  }) => {
    const c = control(page);
    await expect(c).toBeVisible();

    const accessibleHeading = page.getByRole('heading', { name: 'BodySignal' });
    await expect(accessibleHeading).toHaveCount(1);

    await expect(topCopy(page)).toHaveCount(1);
    await expect(bottomCopy(page)).toHaveCount(1);

    // Read layout rects directly (boundingBox can be null for clipped elements)
    const topRect = await topCopy(page).evaluate((el: HTMLElement) => ({
      top: el.getBoundingClientRect().top,
      left: el.getBoundingClientRect().left,
      width: el.getBoundingClientRect().width,
    }));
    const bottomRect = await bottomCopy(page).evaluate((el: HTMLElement) => ({
      top: el.getBoundingClientRect().top,
      left: el.getBoundingClientRect().left,
    }));

    // At rest both clipped copies align vertically (one clean word)
    expect(Math.abs(topRect.top - bottomRect.top)).toBeLessThanOrEqual(2);

    // Subtitle hidden at rest
    const subtitleOpacity = await subtitle(page).evaluate(
      (el: HTMLElement) => parseFloat(getComputedStyle(el).opacity),
    );
    expect(subtitleOpacity).toBeLessThanOrEqual(0.01);

    // No horizontal overflow
    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflowX).toBe(0);

    await page.screenshot({
      path: 'test-results/split-reveal-rest.png',
      fullPage: false,
    });
  });

  test('REVEALED: halves move ~10px, subtitle readable, word still one-line', async ({
    page,
  }) => {
    const c = control(page);

    const topRest = await topCopy(page).evaluate((el: HTMLElement) => el.getBoundingClientRect().top);
    const bottomRest = await bottomCopy(page).evaluate((el: HTMLElement) => el.getBoundingClientRect().top);

    await c.focus();
    await c.press('Enter');
    await expect(c).toHaveAttribute('data-pinned', 'true');
    await expect(c).toHaveAttribute('data-revealed', 'true');
    await page.waitForTimeout(500);

    const topRevealed = await topCopy(page).evaluate((el: HTMLElement) => el.getBoundingClientRect().top);
    const bottomRevealed = await bottomCopy(page).evaluate((el: HTMLElement) => el.getBoundingClientRect().top);

    const topDelta = topRevealed - topRest;
    const bottomDelta = bottomRevealed - bottomRest;

    expect(topDelta).toBeGreaterThanOrEqual(-14);
    expect(topDelta).toBeLessThanOrEqual(-4);
    expect(bottomDelta).toBeGreaterThanOrEqual(4);
    expect(bottomDelta).toBeLessThanOrEqual(14);

    // Subtitle now visible & readable
    const subtitleOpacity = await subtitle(page).evaluate(
      (el: HTMLElement) => parseFloat(getComputedStyle(el).opacity),
    );
    expect(subtitleOpacity).toBeGreaterThan(0.5);

    const subtitleText = await subtitle(page).textContent();
    expect(subtitleText).toContain('Explore the whole pattern');

    // No horizontal overflow
    const overflowX = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflowX).toBe(0);

    await page.screenshot({
      path: 'test-results/split-reveal-revealed.png',
      fullPage: false,
    });
  });

  test('REVEALED via hover: smooth, no jitter', async ({ page }) => {
    const c = control(page);
    await c.scrollIntoViewIfNeeded();
    await c.hover({ position: { x: 10, y: 10 } });
    await expect(c).toHaveAttribute('data-hovering', 'true');
    await expect(c).toHaveAttribute('data-revealed', 'true');
    await page.screenshot({
      path: 'test-results/split-reveal-hover.png',
      fullPage: false,
    });
  });
});
