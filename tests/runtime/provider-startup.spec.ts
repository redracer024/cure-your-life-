import { test, expect } from '@playwright/test';

test.describe('provider startup', () => {
  test('app mounts without provider-context crash; BodySignal header visible (anonymous)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const providerCrashes = errors.filter((m) =>
      m.includes('usePremium must be used within PremiumProvider') ||
      m.includes('useAuth must be used within AuthProvider'),
    );

    expect(providerCrashes, `Provider context crash detected: ${JSON.stringify(providerCrashes)}`).toHaveLength(0);

    const header = page.locator('span', { hasText: /BodySignal/ }).first();
    await expect(header, `Header not found. Page errors: ${JSON.stringify(errors)}`).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('text=/Not signed in|Signed in as|Supabase Account Link/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('no fatal errors during initial mount', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/', { waitUntil: 'load' });

    const fatalErrors = errors.filter(
      (m) =>
        m.includes('usePremium must be used within PremiumProvider') ||
        m.includes('useAuth must be used within AuthProvider'),
    );
    expect(fatalErrors, `Fatal error: ${JSON.stringify(fatalErrors)}`).toHaveLength(0);
  });
});
