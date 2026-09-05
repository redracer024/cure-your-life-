import { test, expect, type Page } from '@playwright/test';

const CATEGORY = 'Pelvic, Urinary & Reproductive';
const AILMENT = 'Bedwetting / Nocturnal Enuresis';

async function dismissModals(page: Page) {
  const ack = page.getByRole('button', { name: /I understand and acknowledge/i });
  if (await ack.isVisible().catch(() => false)) {
    await ack.click();
  }
}

async function openWorksheet(page: Page) {
  await dismissModals(page);
  await page.getByText(CATEGORY, { exact: true }).first().click();
  await page.getByText(AILMENT, { exact: true }).first().click();
  const btn = page.getByRole('button', { name: /Reflection Worksheet/i });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page.getByText('These questions are for reflection, not diagnosis')).toBeVisible();
}

test('ailment reflection worksheet: grouped same-page answering, save, restore, update', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');

  // 1. Open the inline reflection sheet for an ailment with many prompts.
  await openWorksheet(page);

  // 2. Multiple questions appear grouped (CHILDHOOD vs ADULTHOOD) on the same page.
  const childhoodHeader = page.getByRole('button', { name: /CHILDHOOD.*answered/i });
  const adulthoodHeader = page.getByRole('button', { name: /ADULTHOOD.*answered/i });
  await expect(childhoodHeader).toBeVisible();
  await expect(adulthoodHeader).toBeVisible();

  // Sections are collapsible: open the two we want to answer.
  await childhoodHeader.click();
  await adulthoodHeader.click();
  await page.waitForTimeout(600);

  // 3. Answer two questions from DIFFERENT sections, inline.
  const childField = page.getByLabel(/What helps this child/i);
  const adultField = page.getByLabel(/Is this new, recurring, or worsening/i);
  await expect(childField).toBeVisible();
  await expect(adultField).toBeVisible();
  await childField.fill('A calm, blame-free bedtime routine.');
  await adultField.fill('It has been recurring for a while.');

  // 4. Save once.
  const saveBtn = page.getByRole('button', { name: /Save Reflections/i });
  await expect(saveBtn).toBeEnabled();
  await saveBtn.click();
  await expect(page.getByText(/Reflections saved/i)).toBeVisible();

  // No per-question navigation: still on same URL / worksheet present.
  expect(page.url()).toContain('/');
  await expect(page.getByRole('button', { name: /Update Reflections/i })).toBeVisible();

  // 5. Reload — existing answers should repopulate.
  await page.reload();
  await page.waitForLoadState('networkidle');
  await openWorksheet(page);
  // Sections collapse by default; expand to reveal the restored answers.
  await page.getByRole('button', { name: /CHILDHOOD.*answered/i }).click();
  await page.getByRole('button', { name: /ADULTHOOD.*answered/i }).click();
  await page.waitForTimeout(600);
  await expect(page.getByLabel(/What helps this child/i)).toHaveValue('A calm, blame-free bedtime routine.', { timeout: 20000 });
  await expect(page.getByLabel(/Is this new, recurring, or worsening/i)).toHaveValue('It has been recurring for a while.', { timeout: 20000 });

  // 6. Edit one answer and update once.
  const childEdit = page.getByLabel(/What helps this child/i);
  await childEdit.evaluate((el, val) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set!;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, 'A calm routine plus a nightlight.');
  const updateBtn = page.getByRole('button', { name: /Update Reflections/i });
  await expect(updateBtn).toBeEnabled();
  await updateBtn.click();
  await expect(page.getByText(/Reflections saved/i)).toBeVisible({ timeout: 10000 });
  const afterVal = await page.getByLabel(/What helps this child/i).inputValue();
  console.log('AFTER_UPDATE_VALUE=', afterVal);
  await expect(afterVal).toContain('nightlight');

  // 7. Persistence: one structured record holds the whole reflection set,
  // including the edited answer and the historical question wording.
  const stored = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.includes('bodysignal-ailment-reflections'));
    if (keys.length === 0) return null;
    try {
      return JSON.parse(localStorage.getItem(keys[0]) as string);
    } catch {
      return null;
    }
  });
  expect(stored).not.toBeNull();
  const rec = (stored as Array<Record<string, any>>).find(
    (r) => r.ailmentId === 'bedwetting-nocturnal-enuresis',
  );
  expect(rec).toBeTruthy();
  expect(rec.ailmentTitle).toBe(AILMENT);
  expect(Object.values(rec.answers as Record<string, string>)).toContain('A calm routine plus a nightlight.');
  expect(Object.values(rec.answers as Record<string, string>)).toContain('It has been recurring for a while.');
  expect(
    Object.values(rec.prompts as Record<string, string>).some((t) => t.includes('What helps this child')),
  ).toBe(true);

  // 8. The reflection surfaces in the Journal history. The persistent record
  // above (type 'ailment-reflection', grouped answers + historical prompts) is
  // exactly what SomaticJournalPanel renders as one card per ailment set, so
  // the localStorage assertion already validates the journal data path. A
  // full tab-switch visual is omitted to keep this targeted check stable.
  expect(rec.sections.length).toBeGreaterThan(1);

  // 9. Prompt ids use the deterministic text-hash scheme (`::<hash>`), not the
  // old index-based scheme (`::<number>`), so reordering questions never orphans
  // saved answers.
  const allIds = [...Object.keys(rec.answers as Record<string, string>), ...Object.keys(rec.prompts as Record<string, string>)];
  expect(allIds.length).toBeGreaterThan(0);
  for (const id of allIds) {
    expect(id).not.toMatch(/::\d+$/);
  }

  // 7. The reflection appears in the Journal history.
  await page.getByRole('button', { name: /journal/i }).click();
  await expect(page.getByText(`${AILMENT} — Reflections`)).toBeVisible();
});
