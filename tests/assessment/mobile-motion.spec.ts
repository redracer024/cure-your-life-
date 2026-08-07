import {
  test,
  expect,
  openAssessment,
  readRemaining,
  clickDialogButton,
  acceptConsent,
  STORAGE_KEY,
  type SeedKind,
} from './helpers/assessment';

async function openSeeded(
  page: import('@playwright/test').Page,
  seed: (kind: SeedKind) => Promise<void>,
  kind: SeedKind,
): Promise<import('@playwright/test').Locator> {
  await seed(kind);
  return openAssessment(page);
}

async function noHorizontalOverflow(page: import('@playwright/test').Page): Promise<boolean> {
  const m = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      docSW: document.documentElement.scrollWidth,
      docCW: document.documentElement.clientWidth,
      dialogSW: d ? d.scrollWidth : 0,
      dialogCW: d ? d.clientWidth : 0,
    };
  });
  return m.docSW <= m.docCW + 1 && m.dialogSW <= m.dialogCW + 1;
}

test.describe('mobile layout and touch', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile projects only');

  test('modal fits the viewport, scrolls, and has no horizontal overflow', async ({ page }) => {
    const dialog = await openAssessment(page);
    const viewport = page.viewportSize()!;
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(await noHorizontalOverflow(page)).toBe(true);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
  });

  test('primary touch targets meet the ~44px goal', async ({ page }) => {
    const dialog = await openAssessment(page);
    const start = dialog.getByRole('button', { name: /Start Assessment/ });
    await expect(start).toBeDisabled();
    const startBox = (await start.boundingBox())!;
    expect(startBox.height).toBeGreaterThanOrEqual(40);
    await acceptConsent(dialog);
    await expect(start).toBeEnabled();
    await clickDialogButton(dialog, /Start Assessment/);
    const almost = dialog.getByRole('button', { name: /Almost always/ });
    const answerBox = (await almost.boundingBox())!;
    expect(answerBox.height).toBeGreaterThanOrEqual(40);
    await clickDialogButton(dialog, /Skip this question/);
  });

  test('touch can reach and confirm the clear control on mobile', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /Clear saved assessment/);
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
    const cancel = dialog.getByRole('button', { name: /^Cancel$/ });
    const cancelBox = (await cancel.boundingBox())!;
    expect(cancelBox.height).toBeGreaterThanOrEqual(36);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const cleared = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(cleared).toBeNull();
  });
});

test.describe('reduced motion', () => {
  test('reduced-motion preference renders the assessment without errors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = await openAssessment(page);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    await expect(dialog.getByRole('button', { name: /Skip this question/ })).toBeVisible();
  });
});

test.describe('200% zoom reflow (640px viewport ≈ 2x on a 1280px layout)', () => {
  test.use({ viewport: { width: 640, height: 720 } });

  test('modal reflows without horizontal overflow; intro usable', async ({ page }) => {
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Start Assessment/ })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test('clear confirmation usable at 200% zoom', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await clickDialogButton(dialog, /Clear saved assessment/);
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
    await clickDialogButton(dialog, /Cancel/);
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /Clear saved assessment/);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
  });

  test('results CTA reachable at 200% zoom', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-results');
    await clickDialogButton(dialog, /^Resume$/);
    await expect(dialog.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
    const cta = dialog.getByRole('button', { name: /View Full Pattern Profile/ });
    await expect(cta).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});

test.describe('real browser zoom (chromium only)', () => {
  test('renders without overflow at 2x page scale', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP page-scale emulation requires chromium');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});