import {
  test,
  expect,
  openAssessment,
  clickDialogButton,
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

async function openResults(
  page: import('@playwright/test').Page,
  seed: (kind: SeedKind) => Promise<void>,
): Promise<import('@playwright/test').Locator> {
  const dialog = await openSeeded(page, seed, 'free-results');
  await expect(dialog.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
  await clickDialogButton(dialog, /^Resume$/);
  await expect(dialog.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
  return dialog;
}

test.describe('results and navigation', () => {
  test('free results show primary pattern, reminder, clear, retake, Back to Dictionary', async ({ page, seed }) => {
    const dialog = await openResults(page, seed);
    await expect(dialog.getByRole('button', { name: /View Full Pattern Profile/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Back to Dictionary/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Retake/ })).toHaveCount(1);
    await expect(dialog.getByRole('button', { name: /Clear saved assessment/ })).toHaveCount(1);
    await expect(dialog.getByText(/until you clear them/)).toBeVisible();
    await expect(dialog.getByRole('progressbar')).toHaveCount(0);
  });

  test('free results never claim an Expression screening/confirmation result', async ({ page, seed }) => {
    const dialog = await openResults(page, seed);
    await expect(dialog.getByText(/Expression Groups/)).toHaveCount(0);
    await expect(dialog.getByText(/Expression Screening/)).toHaveCount(0);
    await expect(dialog.getByText(/Expression Confirmation/)).toHaveCount(0);
  });

  test('strategy navigation opens the pattern profile and closes the quiz', async ({ page, seed }) => {
    const dialog = await openResults(page, seed);
    await clickDialogButton(dialog, /View Full Pattern Profile/);
    await expect(dialog).toBeHidden();
    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text && h1Text.trim().length).toBeGreaterThan(0);
    const saved = await page.evaluate((key) => localStorage.getItem(key) !== null, STORAGE_KEY);
    expect(saved).toBe(true);
  });

  test('result persists on reopen after close', async ({ page, seed }) => {
    const dialog = await openResults(page, seed);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const reopened = await openSeeded(page, seed, 'free-results');
    await expect(reopened.getByRole('heading', { name: 'Continue Your Assessment' })).toBeVisible();
    await clickDialogButton(reopened, /^Resume$/);
    await expect(reopened.getByRole('heading', { name: /Your Pattern Is The/ })).toBeVisible();
    await expect(reopened.getByRole('button', { name: /View Full Pattern Profile/ })).toBeVisible();
  });

  test('clear control on results opens in-flow confirmation', async ({ page, seed }) => {
    const dialog = await openResults(page, seed);
    await clickDialogButton(dialog, /Clear saved assessment/);
    await expect(dialog.getByRole('heading', { name: 'Clear saved assessment?' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Cancel$/ })).toHaveCount(1);
    await expect(dialog.getByRole('button', { name: /Clear assessment/ })).toHaveCount(1);
  });
});