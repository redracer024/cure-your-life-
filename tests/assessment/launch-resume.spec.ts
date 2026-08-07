import {
  test,
  expect,
  openAssessment,
  readRemaining,
  readStoredSessionSnapshot,
  clickDialogButton,
  dblActivateDialogButton,
  acceptConsent,
  expectSeedNotReapplied,
  expectFocusInsideDialog,
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

test.describe('launch and resume', () => {
  test('fresh intro shows privacy disclosure; Start Assessment enters question flow', async ({ page }) => {
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const disclosure = dialog.locator('p').filter({ hasText: /stored only in this browser/ });
    await expect(disclosure).toBeVisible();
    const text = (await disclosure.textContent()) || '';
    for (const fact of ['this browser', 'this device', 'not sent to our servers', 'same browser profile', 'browser data', 'automatically remove', 'reopen', 'Pro assessment']) {
      expect(text).toContain(fact);
    }
    expect(text.trim().split(/\s+/).length).toBeLessThan(90);
    await expect(page.getByText(STORAGE_KEY)).toHaveCount(0);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    await expectFocusInsideDialog(page);
  });

  test('Start Assessment is consent-gated on the fresh intro', async ({ page }) => {
    const dialog = await openAssessment(page);
    const start = dialog.getByRole('button', { name: /Start Assessment/ });
    await expect(start).toBeDisabled();
    await acceptConsent(dialog);
    await expect(start).toBeEnabled();
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
  });

  test('remaining wording is accurate — no 1-of-N, no progressbar', async ({ page }) => {
    const dialog = await openAssessment(page);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toMatch(/^\d+ questions? (remaining|to revisit)$/);
    await expect(dialog.getByText(/1 of/)).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await clickDialogButton(dialog, /Almost always/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
  });

  test('saved free session resumes via resume screen', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /^Resume$/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
  });

  test('completed session resumes straight to results via resume screen', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-results');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /^Resume$/);
    await expect(dialog.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
  });

  test('saved pro session is blocked for non-premium with upgrade + free-start paths', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'pro-intro');
    await expect(dialog.getByRole('heading', { name: 'Your Saved Assessment Requires Pro Access' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Upgrade to Pro/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Start a Free Assessment/ })).toBeVisible();
    await expect(dialog.getByRole('progressbar')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: /Almost always/ })).toHaveCount(0);
    await clickDialogButton(dialog, /Start a Free Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    const mode = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').mode, STORAGE_KEY);
    expect(mode).toBe('free');
  });

  test('Escape close preserves progress; reopen resumes', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const reopened = await openAssessment(page);
    await expect(reopened.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(reopened, /^Resume$/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
  });

  test('re-entrant double activation submits exactly one answer, then one skip', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await clickDialogButton(dialog, /^Resume$/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
    await dblActivateDialogButton(dialog, /Almost always/);
    await expect.poll(() => readRemaining(page)).toBe('43 questions remaining');
    await dblActivateDialogButton(dialog, /Skip this question/);
    await expect.poll(() => readRemaining(page)).toBe('42 questions remaining');
  });

  test('fresh free start wiring: consent + first answer decrements remaining', async ({ page }) => {
    test.setTimeout(30_000);
    const dialog = await openAssessment(page);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    await clickDialogButton(dialog, /Almost always/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
  });

  test('seeded near-complete free session reaches results without expression stages and persists', async ({ page, seed }) => {
    test.setTimeout(30_000);
    const dialog = await openSeeded(page, seed, 'free-near-results-1');
    const seededSnapshot = await readStoredSessionSnapshot(page);
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /^Resume$/);

    await expect.poll(() => readRemaining(page)).toBe('1 question remaining');
    await clickDialogButton(dialog, /Almost always/);

    await expect(dialog.getByRole('button', { name: /View Full Pattern Profile/ })).toBeVisible();
    await expect(dialog.getByText('Expression Groups')).toHaveCount(0);
    await expect(dialog.getByText('Expression Screening')).toHaveCount(0);
    await expect(dialog.getByText('Expression Confirmation')).toHaveCount(0);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect.poll(() => readStoredSessionSnapshot(page)).toMatchObject({
      stage: 'results',
      completionState: 'complete',
    });
    const storedBeforeClose = await readStoredSessionSnapshot(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    const reopened = await openAssessment(page);
    const storedAfterReopenBeforeResume = await readStoredSessionSnapshot(page);
    expect(storedAfterReopenBeforeResume).toMatchObject({
      stage: 'results',
      completionState: 'complete',
    });
    expect(storedAfterReopenBeforeResume.raw).toBe(storedBeforeClose.raw);
    expectSeedNotReapplied(storedAfterReopenBeforeResume, seededSnapshot.raw);
    await expect(reopened.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();

    await clickDialogButton(reopened, /^Resume$/);
    const storedAfterResume = await readStoredSessionSnapshot(page);
    expect(storedAfterResume).toMatchObject({
      stage: 'results',
      completionState: 'complete',
    });
    await expect(reopened.getByRole('button', { name: /View Full Pattern Profile/ })).toBeVisible();
  });

  test('short retry behavior: skip minimum to trigger retry and answer one retry item', async ({ page, seed }) => {
    test.setTimeout(30_000);
    const dialog = await openSeeded(page, seed, 'free-near-retry-2');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(dialog, /^Resume$/);

    await expect.poll(() => readRemaining(page)).toBe('1 question remaining');
    await clickDialogButton(dialog, /Almost always/);

    await expect.poll(() => readRemaining(page)).toBe('1 question to revisit');
    await expect(dialog.getByText(/Skipped earlier.*one more chance to answer/i)).toBeVisible();

    await clickDialogButton(dialog, /Almost always/);
    await expect.poll(() => readRemaining(page)).toMatch(/^\d+ questions? remaining$/);
    await expect(dialog.getByText(/questions? to revisit/i)).toHaveCount(0);
  });

  test('premium lookup failure falls back to Free with one notice', async ({ page }) => {
    test.setTimeout(30_000);
    await page.route('**/api/me/premium', async (route) => {
      await route.abort();
    });
    const dialog = await openAssessment(page);
    const notice = page.locator('[role="status"]').filter({ hasText: /Pro access could not be verified/ });
    await expect(notice).toHaveCount(1, { timeout: 10_000 });
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    const mode = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}').mode, STORAGE_KEY);
    expect(mode).toBe('free');
  });
});
