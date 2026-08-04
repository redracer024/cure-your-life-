import {
  test,
  expect,
  openAssessment,
  clickDialogButton,
  acceptConsent,
  focusedElement,
  expectFocusInsideDialog,
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

test.describe('keyboard and focus', () => {
  test('initial focus moves inside the dialog when opened', async ({ page }) => {
    await openAssessment(page);
    await expectFocusInsideDialog(page);
  });

  test('Tab focus wraps within the modal', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).focus();
    await page.keyboard.press('Shift+Tab');
    const focus = await focusedElement(page);
    await expectFocusInsideDialog(page);
    expect(focus.text).not.toContain('Close');
    expect(focus.text.length).toBeGreaterThan(0);
  });

  test('minimal-screen focus trap keeps Tab/Shift+Tab inside the dialog', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'missing-item');
    await clickDialogButton(dialog, /^Resume$/);
    await expect(dialog.getByRole('heading', { name: 'Question Unavailable' })).toBeVisible();
    const skip = dialog.getByRole('button', { name: /Skip this question/ });
    await expect(skip).toHaveCount(1);
    await skip.focus();
    await page.keyboard.press('Tab');
    await expectFocusInsideDialog(page);
    const afterTab = await focusedElement(page);
    expect(afterTab.text).not.toContain('Skip');
    await page.keyboard.press('Shift+Tab');
    await expectFocusInsideDialog(page);
    const afterShiftTab = await focusedElement(page);
    expect(afterShiftTab.text).toContain('Skip');
  });

  test('Escape closes the modal and focus returns to the launcher', async ({ page }) => {
    const dialog = await openAssessment(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => (await focusedElement(page)).text)
      .toContain('Pattern Quiz');
  });

  test('focus never escapes the dialog during clear confirmation', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-mid');
    await clickDialogButton(dialog, /Clear saved assessment/);
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
    await expect.poll(async () => (await focusedElement(page)).id).toBe('assessment-clear-confirm-title');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await expectFocusInsideDialog(page);
    }
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+Tab');
      await expectFocusInsideDialog(page);
    }
  });

  test('phase-change focus: Start Assessment moves focus into question content', async ({ page }) => {
    const dialog = await openAssessment(page);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => page.locator('[role="dialog"] [role="status"]').filter({ hasText: /questions? (remaining|to revisit)/ }).first().textContent()).toBe('45 questions remaining');
    await expectFocusInsideDialog(page);
    const focus = await focusedElement(page);
    expect(focus.id).not.toBe('assessment-dialog-title');
  });

  test('profile navigation closes quiz and does not restore focus to the launcher', async ({ page, seed }) => {
    const dialog = await openSeeded(page, seed, 'free-results');
    await clickDialogButton(dialog, /^Resume$/);
    await expect(dialog.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
    await clickDialogButton(dialog, /View Full Pattern Profile/);
    await expect(dialog).toBeHidden();
    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text && h1Text.trim().length).toBeGreaterThan(0);
    await expect
      .poll(async () => (await focusedElement(page)).text)
      .not.toContain('Pattern Quiz');
  });
});