import { test as base, expect, type Locator, type Page } from '@playwright/test';
import {
  startAssessmentSession,
  advanceAssessmentStage,
  recordAssessmentResponse,
  skipAssessmentItem,
  serializeAssessmentSession,
} from '../../../src/lib/quiz/assessmentSession';
import type { AssessmentSession } from '../../../src/types/assessmentSession';
import { resolveAssessmentItem } from '../../../src/lib/quiz/assessmentUiModel';

export const STORAGE_KEY = 'cure-life-assessment-session';
const SEED_ONCE_MARKER_KEY = `${STORAGE_KEY}:seeded-once`;

export type SeedKind =
  | 'none'
  | 'free-mid'
  | 'free-near-results-1'
  | 'free-near-retry-2'
  | 'free-results'
  | 'pro-intro'
  | 'missing-item';

const seedCache = new Map<SeedKind, string | null>();

/**
 * Builds the serialized localStorage payload for a seeded assessment session,
 * or null when no seed is wanted (fresh intro).
 *
 * Seeds are produced from the real runtime modules (same code path the app
 * uses) so the persisted shape always matches what `deserializeAssessmentSession`
 * accepts. Values are cached per kind for the whole worker.
 */
export function sessionJson(kind: SeedKind): string | null {
  if (seedCache.has(kind)) return seedCache.get(kind) ?? null;
  let json: string | null;
  switch (kind) {
    case 'none':
      json = null;
      break;
    case 'free-mid': {
      const s = startAssessmentSession('free');
      const first = s.currentItemIds[0];
      json = serializeAssessmentSession(recordAssessmentResponse(s, first, 5));
      break;
    }
    case 'free-near-results-1': {
      json = serializeAssessmentSession(buildFreeNearCompletionSession(1));
      break;
    }
    case 'free-near-retry-2': {
      json = serializeAssessmentSession(buildFreeNearRetryBoundarySession(2));
      break;
    }
    case 'free-results': {
      const s = completeFreeSession();
      json = serializeAssessmentSession(s);
      break;
    }
    case 'pro-intro':
      json = serializeAssessmentSession(startAssessmentSession('pro'));
      break;
    case 'missing-item': {
      const s: AssessmentSession = {
        ...startAssessmentSession('free'),
        currentItemIds: ['bogus-item-1'],
      };
      json = serializeAssessmentSession(s);
      break;
    }
  }
  seedCache.set(kind, json);
  return json;
}

function answerFirstCurrentItem(session: AssessmentSession): AssessmentSession {
  if (session.currentItemIds.length === 0) {
    return advanceAssessmentStage(session);
  }
  return recordAssessmentResponse(session, session.currentItemIds[0], 5);
}

function assertNearResultsFixture(session: AssessmentSession): void {
  if (session.mode !== 'free') {
    throw new Error(`Near-results fixture must use free mode, got ${session.mode}`);
  }
  if (session.currentItemIds.length !== 1) {
    throw new Error(
      `Near-results fixture must have exactly 1 presentable item, got ${session.currentItemIds.length}`,
    );
  }

  const onlyItemId = session.currentItemIds[0];
  if (resolveAssessmentItem(onlyItemId) === null) {
    throw new Error(`Near-results fixture item is not presentable: ${onlyItemId}`);
  }

  const answered = recordAssessmentResponse(session, onlyItemId, 5);
  const advanced = advanceAssessmentStage(answered);

  if (advanced.stage !== 'results' || advanced.completionState !== 'complete') {
    throw new Error(
      `Near-results fixture failed verification after one answer: stage=${advanced.stage}, completionState=${advanced.completionState}`,
    );
  }
  if (!advanced.navigationTarget.patternId) {
    throw new Error('Near-results fixture must produce a navigation target after one answer');
  }
  if (
    [session.stage, answered.stage, advanced.stage].some((stage) =>
      stage.startsWith('expression-'),
    )
  ) {
    throw new Error('Near-results fixture must not enter expression stages for free mode');
  }
}

function buildFreeNearCompletionSession(targetRemaining: number): AssessmentSession {
  if (targetRemaining < 1 || targetRemaining > 3) {
    throw new Error(`targetRemaining must be between 1 and 3, got ${targetRemaining}`);
  }

  let session = startAssessmentSession('free');
  for (let i = 0; i < 1000; i++) {
    if (session.currentItemIds.length === targetRemaining) {
      const allPresentable = session.currentItemIds.every((id) => resolveAssessmentItem(id) !== null);
      if (allPresentable) {
        if (targetRemaining === 1) {
          const itemId = session.currentItemIds[0];
          const answered = recordAssessmentResponse(session, itemId, 5);
          const advanced = advanceAssessmentStage(answered);
          if (
            advanced.stage === 'results' &&
            advanced.completionState === 'complete' &&
            !!advanced.navigationTarget.patternId &&
            ![session.stage, answered.stage, advanced.stage].some((stage) =>
              stage.startsWith('expression-'),
            )
          ) {
            assertNearResultsFixture(session);
            return session;
          }
        } else {
          return session;
        }
      }
    }
    if (session.currentItemIds.length === 0) {
      session = advanceAssessmentStage(session);
      continue;
    }
    session = answerFirstCurrentItem(session);
  }

  throw new Error(
    `Unable to build verified free near-completion session with ${targetRemaining} remaining items`,
  );
}

function buildFreeNearRetryBoundarySession(targetRemaining: number): AssessmentSession {
  if (targetRemaining < 2) {
    throw new Error(`targetRemaining must be at least 2, got ${targetRemaining}`);
  }

  let session = startAssessmentSession('free');
  for (let i = 0; i < 1200; i++) {
    const allPresentable = session.currentItemIds.every((id) => resolveAssessmentItem(id) !== null);
    if (
      session.stage !== 'core' &&
      session.currentItemIds.length === targetRemaining &&
      allPresentable
    ) {
      const skippedId = session.currentItemIds[0];
      const skipped = skipAssessmentItem(session, skippedId);
      if (skipped.currentItemIds.length !== targetRemaining - 1) {
        throw new Error('Retry-boundary fixture skip did not reduce remaining count as expected');
      }

      const answered = recordAssessmentResponse(skipped, skipped.currentItemIds[0], 5);
      const advanced = advanceAssessmentStage(answered);
      const hasSingleRetryItem =
        advanced.currentItemIds.length === 1 &&
        advanced.currentItemIds[0] === skippedId &&
        advanced.retryState.skippedItemIds.includes(skippedId);

      if (hasSingleRetryItem) {
        return skipped;
      }
    }

    if (session.currentItemIds.length === 0) {
      session = advanceAssessmentStage(session);
      continue;
    }
    session = answerFirstCurrentItem(session);
  }

  throw new Error('Unable to build deterministic retry-boundary free session fixture');
}

function completeFreeSession(): AssessmentSession {
  let session = startAssessmentSession('free');
  for (let i = 0; i < 1000; i++) {
    if (session.stage === 'results') return session;
    if (session.currentItemIds.length === 0) {
      session = advanceAssessmentStage(session);
    } else {
      session = answerFirstCurrentItem(session);
    }
  }
  throw new Error('Unable to complete free assessment session fixture');
}

/**
 * Extended test with a `seed` fixture: call `await seed(kind)` before the
 * first navigation to plant the assessment session into localStorage. The
 * init script applies to every subsequent document in the context.
 */
export const test = base.extend<{ seed: (kind: SeedKind) => Promise<void> }>({
  seed: async ({ context }, use) => {
    await use(async (kind) => {
      const json = sessionJson(kind);
      if (json === null) return;
      await context.addInitScript(
        ([key, value, markerKey]) => {
          if (sessionStorage.getItem(markerKey) === '1') {
            return;
          }
          localStorage.setItem(key, value);
          sessionStorage.setItem(markerKey, '1');
        },
        [STORAGE_KEY, json, SEED_ONCE_MARKER_KEY] as const,
      );
    });
  },
});

export { expect };

/** Opens the landing page and activates the Personality Pattern Quiz dialog. */
export async function openAssessment(page: Page): Promise<Locator> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const cta = page.getByRole('button', { name: /Personality Pattern Quiz/ }).first();
  await expect(cta).toBeVisible();
  await cta.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Reads the remaining-queue status text ("45 questions remaining", "… to revisit"). */
export async function readRemaining(page: Page): Promise<string | null> {
  const status = page
    .locator('[role="dialog"] [role="status"]')
    .filter({ hasText: /questions? (remaining|to revisit)/ })
    .first();
  return status.textContent().catch(() => null);
}

export interface StoredSessionSnapshot {
  raw: string | null;
  stage: string | null;
  completionState: string | null;
  navigationTarget: { patternId: string } | null;
}

export async function readStoredSessionSnapshot(page: Page): Promise<StoredSessionSnapshot> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        raw: null,
        stage: null,
        completionState: null,
        navigationTarget: null,
      };
    }

    try {
      const parsed = JSON.parse(raw);
      const navigationTarget =
        typeof parsed.navigationTarget === 'object' &&
        parsed.navigationTarget !== null &&
        typeof parsed.navigationTarget.patternId === 'string'
          ? { patternId: parsed.navigationTarget.patternId }
          : null;

      return {
        raw,
        stage: typeof parsed.stage === 'string' ? parsed.stage : null,
        completionState: typeof parsed.completionState === 'string' ? parsed.completionState : null,
        navigationTarget,
      };
    } catch {
      return {
        raw,
        stage: null,
        completionState: null,
        navigationTarget: null,
      };
    }
  }, STORAGE_KEY);
}

export function expectSeedNotReapplied(
  snapshotAfterLaterNavigation: StoredSessionSnapshot,
  originalSeedRaw: string | null,
): void {
  expect(snapshotAfterLaterNavigation.raw).not.toBe(originalSeedRaw);
}

/** Description of the currently focused element, for focus assertions. */
export async function focusedElement(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { id: '', text: '', tag: '' };
    return {
      id: el.id || '',
      text: (el.textContent || '').trim().slice(0, 60),
      tag: el.tagName.toLowerCase(),
    };
  });
}

/** Asserts the current focus target lives inside the open dialog. */
export async function expectFocusInsideDialog(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = document.activeElement;
        const d = document.querySelector('[role="dialog"]');
        return d !== null && !!el && d.contains(el);
      }),
    )
    .toBe(true);
}

/** Clicks a dialog button, tolerant of the short reprocessing window. */
export async function clickDialogButton(
  dialog: Locator,
  name: RegExp | string,
): Promise<void> {
  const button = dialog.getByRole('button', { name }).first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function acceptConsent(dialog: Locator): Promise<void> {
  const checkbox = dialog.getByRole('checkbox');
  await expect(checkbox).toBeVisible();
  await checkbox.check();
}

/** Clicks a dialog button twice rapidly (for re-entrant-activation checks). */
export async function dblActivateDialogButton(
  dialog: Locator,
  name: RegExp | string,
): Promise<void> {
  await dialog
    .getByRole('button', { name })
    .first()
    .evaluate((el: HTMLElement) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
}
