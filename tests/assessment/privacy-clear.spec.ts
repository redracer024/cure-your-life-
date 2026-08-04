import {
  test,
  expect,
  openAssessment,
  clickDialogButton,
  focusedElement,
  STORAGE_KEY,
  type SeedKind,
} from './helpers/assessment';

const clearFailureNotice =
  'Saved assessment could not be cleared. You can continue using the current session.';

async function openSeeded(
  page: import('@playwright/test').Page,
  seed: (kind: SeedKind) => Promise<void>,
  kind: SeedKind,
): Promise<import('@playwright/test').Locator> {
  await seed(kind);
  return openAssessment(page);
}

async function openClearConfirmation(
  page: import('@playwright/test').Page,
  dialog: import('@playwright/test').Locator,
): Promise<void> {
  await clickDialogButton(dialog, /Clear saved assessment/);
  await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
}

test.describe('privacy disclosure and clear control', () => {
  test('intro disclosure present and storage key never shown', async ({ page }) => {
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    await expect(dialog.locator('p').filter({ hasText: /stored only in this browser/ })).toBeVisible();
    await expect(page.getByText(STORAGE_KEY)).toHaveCount(0);
  });

  test('resume screen shows browser-device reminder + Clear control', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await expect(dialog.getByText(/Saved progress belongs to this browser/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Clear saved assessment/ })).toHaveCount(1);
    await expect(page.getByText(STORAGE_KEY)).toHaveCount(0);
  });

  test('results screen shows reminder + Clear control + Retake', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-results');
    await clickDialogButton(dialog, /^Resume$/);
    await expect(dialog.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
    await expect(dialog.getByText(/until you clear them/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Clear saved assessment/ })).toHaveCount(1);
    await expect(dialog.getByRole('button', { name: /Retake/ })).toHaveCount(1);
    await expect(page.getByText(STORAGE_KEY)).toHaveCount(0);
  });

  test('blocked-Pro screen shows reminder + Clear control + upgrade paths', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'pro-intro');
    await expect(dialog.getByRole('heading', { name: 'Your Saved Assessment Requires Pro Access' })).toBeVisible();
    await expect(dialog.getByText(/remains stored in this browser/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Clear saved assessment/ })).toHaveCount(1);
    await expect(dialog.getByText('Upgrade to Pro')).toBeVisible();
    await expect(dialog.getByText('Start a Free Assessment')).toBeVisible();
    await expect(page.getByText(STORAGE_KEY)).toHaveCount(0);
  });

  test('clear opens in-flow confirmation (heading + Cancel/Clear), no window.confirm', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await openClearConfirmation(page, dialog);
    await expect(dialog.getByRole('button', { name: /^Cancel$/ })).toHaveCount(1);
    await expect(dialog.getByRole('button', { name: /Clear assessment/ })).toHaveCount(1);
    const dialogs = await page.locator('[role="dialog"]').count();
    expect(dialogs).toBe(1);
    await expect.poll(async () => (await focusedElement(page)).id).toBe('assessment-clear-confirm-title');
  });

  test('Escape cancels confirmation first and restores focus to opener', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await openClearConfirmation(page, dialog);
    await expect.poll(async () => (await focusedElement(page)).id).toBe('assessment-clear-confirm-title');
    await page.keyboard.press('Escape');
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeHidden();
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    const saved = await page.evaluate((key) => localStorage.getItem(key) !== null, STORAGE_KEY);
    expect(saved).toBe(true);
    await expect
      .poll(async () => (await focusedElement(page)).text)
      .toContain('Clear saved assessment');
  });

  test('confirm clear returns to fresh intro, clears storage, focuses intro heading', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await openClearConfirmation(page, dialog);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Start Assessment/ })).toBeVisible();
    const cleared = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(cleared).toBeNull();
    await expect.poll(async () => (await focusedElement(page)).id).toBe('assessment-dialog-title');
  });

  test('clear removes only the assessment storage key', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await page.evaluate(() => localStorage.setItem('some-unrelated-key', 'keepme'));
    await openClearConfirmation(page, dialog);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const state = await page.evaluate((key) => ({
      assessment: localStorage.getItem(key),
      unrelated: localStorage.getItem('some-unrelated-key'),
    }), STORAGE_KEY);
    expect(state.assessment).toBeNull();
    expect(state.unrelated).toBe('keepme');
  });

  test('confirm failure keeps screen with exactly one notice, no raw errors', async ({ page, seed }) => {
    await page.context().addInitScript(() => {
      const orig = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function (key) {
        if (key === 'cure-life-assessment-session') throw new Error('forced remove failure');
        return orig.call(this, key);
      };
    });
    const dialog = await openSeeded(page, seed, 'free-mid');
    await openClearConfirmation(page, dialog);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    const statuses = page.locator('[role="status"]');
    await expect(statuses).toHaveCount(1);
    await expect(statuses.first()).toHaveText(clearFailureNotice);
    const saved = await page.evaluate((key) => localStorage.getItem(key) !== null, STORAGE_KEY);
    expect(saved).toBe(true);
  });

  test('keyboard-only clear flow works (focus + Enter)', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await dialog.getByRole('button', { name: /Clear saved assessment/ }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
    await dialog.getByRole('button', { name: /Clear assessment/ }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const cleared = await page.evaluate((key) => localStorage.getItem(key) === null, STORAGE_KEY);
    expect(cleared).toBe(true);
  });

  test('clear from blocked-Pro returns to fresh intro', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'pro-intro');
    await openClearConfirmation(page, dialog);
    await clickDialogButton(dialog, /Clear assessment/);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const cleared = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(cleared).toBeNull();
  });
});