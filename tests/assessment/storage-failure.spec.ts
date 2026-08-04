import {
  test,
  expect,
  openAssessment,
  readRemaining,
  clickDialogButton,
  acceptConsent,
  STORAGE_KEY,
} from './helpers/assessment';

test.describe('storage failure handling', () => {
  test('load failure shows a non-blocking notice and the quiz starts fresh', async ({ page }) => {
    await page.context().addInitScript(() => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        if (key === 'cure-life-assessment-session') throw new Error('forced read failure');
        return orig.call(this, key);
      };
    });
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const notice = page.locator('[role="status"]').filter({ hasText: /may not survive/ });
    await expect(notice).toHaveCount(1);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
  });

  test('persistent write failure shows a non-blocking notice and the quiz continues', async ({ page }) => {
    await page.context().addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new Error('forced write failure');
      };
    });
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const notice = page.locator('[role="status"]').filter({ hasText: /may not survive/ });
    await expect(notice).toHaveCount(1);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    await expect(notice).toHaveCount(1);
  });

  test('one-time write failure shows a notice, then clears after a successful save', async ({ page }) => {
    await page.context().addInitScript(() => {
      const orig = Storage.prototype.setItem;
      let failedOnce = false;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'cure-life-assessment-session' && !failedOnce) {
          failedOnce = true;
          throw new Error('forced assessment write failure');
        }
        return orig.call(this, key, value);
      };
    });
    const dialog = await openAssessment(page);
    await expect(dialog.getByRole('heading', { name: 'Somatic Pattern Assessment' })).toBeVisible();
    const failNotice = page.locator('[role="status"]').filter({ hasText: /could not be saved/ });
    await expect(failNotice).toHaveCount(1);
    await acceptConsent(dialog);
    await clickDialogButton(dialog, /Start Assessment/);
    await expect.poll(() => readRemaining(page)).toBe('45 questions remaining');
    await clickDialogButton(dialog, /Almost always/);
    await expect.poll(() => readRemaining(page)).toBe('44 questions remaining');
    await expect(failNotice).toHaveCount(0);
    await expect(page.locator('[role="status"]').filter({ hasText: /may not survive/ })).toHaveCount(0);
  });
});