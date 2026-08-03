import { APPROVED_QUIZ_ITEMS } from '../../data/quiz/approvedQuestions';
import { STRATEGY_PATTERN_IDS, STRATEGY_CORE_COMPATIBILITY } from '../../data/quiz/patternTaxonomy';
import { STRATEGY_ROUTING_CONFIG } from '../../data/quiz/strategyRoutingConfig';
import { scoreApprovedItemResponse } from '../../data/quiz/questionBank';
import type { StrategyPatternId, QuizAccess, ApprovedQuizItem } from '../../types/quiz';
import type {
  StrategyRoutingMode,
  StrategyRoutingStage,
  StrategyRoutingOutcome,
  StrategyEligibility,
  StrategyEligibilityStatus,
  StrategyDirectScore,
  StrategyCandidateScore,
  StrategyCandidateSelection,
  StrategyCandidateQualification,
  StrategyFollowUpAssignment,
  StrategyRoutingTrace,
  StrategyRoutingTraceEntry,
  StrategyRoutingResult,
} from '../../types/strategyRouting';

const CONFIG = STRATEGY_ROUTING_CONFIG;

function getStrategyItems(strategyId: string): ApprovedQuizItem[] {
  return APPROVED_QUIZ_ITEMS.filter(
    i => i.patternId === strategyId && i.layer === 'strategy',
  );
}

function getUniversalScreeners(strategyId: string): ApprovedQuizItem[] {
  return getStrategyItems(strategyId).filter(i => i.strategyScreen === 'universal');
}

function getFollowUpItems(strategyId: string, itemNumbers: number[]): ApprovedQuizItem[] {
  const items = getStrategyItems(strategyId);
  return items.filter(i => {
    const match = i.id.match(/-(\d+)$/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    return itemNumbers.includes(num) && !i.strategyScreen;
  });
}

function getItemNumber(item: ApprovedQuizItem): number {
  const match = item.id.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

function computeDirectScore(
  strategyId: StrategyPatternId,
  responses: Record<string, number | undefined>,
): StrategyDirectScore {
  const items = getStrategyItems(strategyId);
  let raw = 0;
  let answered = 0;
  for (const item of items) {
    const val = responses[item.id];
    if (val !== undefined && val !== null && val >= CONFIG.scoring.minimumScaleValue && val <= CONFIG.scoring.maximumScaleValue) {
      raw += scoreApprovedItemResponse(item, val);
      answered++;
    }
  }
  return {
    patternId: strategyId,
    answeredCount: answered,
    rawDirectScore: raw,
    normalizedDirectScore: answered > 0 ? raw / answered : 0,
  };
}

function computeCompatibleCoreScore(strategyId: StrategyPatternId): number {
  const compatibleCoreIds = STRATEGY_CORE_COMPATIBILITY[strategyId] ?? [];
  if (compatibleCoreIds.length === 0) return 0;
  const coreItems = compatibleCoreIds.flatMap(cid =>
    APPROVED_QUIZ_ITEMS.filter(i => i.patternId === cid && i.layer === 'core'),
  );
  if (coreItems.length === 0) return 0;
  const sum = coreItems.reduce((acc, item) => {
    const val = APPROVED_QUIZ_ITEMS.find(i => i.id === item.id)?.reverseScored ? 3 : 3;
    return acc;
  }, 0);
  return 3;
}

export function getRetryableUniversalScreeners(
  responses: Record<string, number | undefined>,
): string[] {
  const retryable: string[] = [];
  for (const sid of STRATEGY_PATTERN_IDS) {
    const screeners = getUniversalScreeners(sid);
    for (const s of screeners) {
      if (responses[s.id] === undefined || responses[s.id] === null) {
        retryable.push(s.id);
      }
    }
  }
  return retryable;
}

export function scoreStrategyDirectEvidence(
  responses: Record<string, number | undefined>,
): StrategyDirectScore[] {
  return STRATEGY_PATTERN_IDS.map(sid => computeDirectScore(sid as StrategyPatternId, responses));
}

export function evaluateUniversalEligibility(
  responses: Record<string, number | undefined>,
): StrategyEligibility[] {
  return STRATEGY_PATTERN_IDS.map(sid => {
    const screeners = getUniversalScreeners(sid);
    let raw = 0;
    let answered = 0;
    for (const s of screeners) {
      const val = responses[s.id];
      if (val !== undefined && val !== null && val >= 1 && val <= 5) {
        raw += scoreApprovedItemResponse(s, val);
        answered++;
      }
    }
    const normalized = answered > 0 ? raw / answered : 0;
    let status: StrategyEligibilityStatus;
    let reason: string;
    if (answered < CONFIG.universalScreen.minimumAnsweredForEligibility) {
      status = 'incomplete';
      reason = `Answered ${answered}/${CONFIG.universalScreen.itemsPerStrategy} universal screeners`;
    } else if (raw < CONFIG.universalScreen.minimumRawDirectScore || normalized < CONFIG.universalScreen.minimumNormalizedDirectScore) {
      status = 'below-floor';
      reason = `Raw ${raw} < ${CONFIG.universalScreen.minimumRawDirectScore} or normalized ${normalized.toFixed(2)} < ${CONFIG.universalScreen.minimumNormalizedDirectScore}`;
    } else {
      status = 'eligible';
      reason = `Passed (raw ${raw}/${CONFIG.universalScreen.minimumRawDirectScore}, normalized ${normalized.toFixed(2)}/${CONFIG.universalScreen.minimumNormalizedDirectScore})`;
    }
    return {
      patternId: sid as StrategyPatternId,
      status,
      rawUniversalScore: raw,
      normalizedUniversalScore: normalized,
      answeredUniversalCount: answered,
      reason,
    };
  });
}

export function rankStrategyCandidates(
  candidates: StrategyCandidateScore[],
): StrategyCandidateScore[] {
  const order = STRATEGY_PATTERN_IDS as readonly string[];
  return [...candidates].sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
    if (b.normalizedDirectScore !== a.normalizedDirectScore) return b.normalizedDirectScore - a.normalizedDirectScore;
    if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount;
    if (b.rawDirectScore !== a.rawDirectScore) return b.rawDirectScore - a.rawDirectScore;
    return order.indexOf(a.patternId) - order.indexOf(b.patternId);
  });
}

export function selectInitialStrategyCandidates(
  eligibility: StrategyEligibility[],
  directScores: StrategyDirectScore[],
  mode: StrategyRoutingMode,
  responses: Record<string, number | undefined>,
): { candidates: StrategyCandidateSelection[]; combinedScores: StrategyCandidateScore[]; traceEntries: StrategyRoutingTraceEntry[] } {
  const traceEntries: StrategyRoutingTraceEntry[] = [];
  const eligibleIds = new Set(
    eligibility.filter(e => e.status === 'eligible').map(e => e.patternId),
  );

  const candidateScores: StrategyCandidateScore[] = [];
  for (const sid of STRATEGY_PATTERN_IDS) {
    if (!eligibleIds.has(sid as StrategyPatternId)) continue;
    const ds = directScores.find(d => d.patternId === sid) ?? computeDirectScore(sid as StrategyPatternId, responses);
    const compatibleNormalized = computeCompatibleCoreScore(sid as StrategyPatternId);
    const combined =
      ds.normalizedDirectScore * CONFIG.scoring.directEvidenceWeight +
      compatibleNormalized * CONFIG.scoring.compatibleCoreWeight;
    candidateScores.push({
      patternId: sid as StrategyPatternId,
      answeredCount: ds.answeredCount,
      rawDirectScore: ds.rawDirectScore,
      normalizedDirectScore: ds.normalizedDirectScore,
      compatibleCorePatternId: sid as StrategyPatternId,
      compatibleCoreNormalizedScore: compatibleNormalized,
      combinedScore: combined,
    });
  }

  if (candidateScores.length === 0) {
    traceEntries.push({ stage: 'initial-selection', label: 'No eligible candidates', details: {} });
    return { candidates: [], combinedScores: [], traceEntries };
  }

  const ranked = rankStrategyCandidates(candidateScores);
  traceEntries.push({
    stage: 'initial-selection',
    label: 'Ranked eligible candidates',
    details: { ranked: ranked.map(r => ({ id: r.patternId, combined: r.combinedScore, direct: r.normalizedDirectScore })) },
  });

  const maxCandidates = mode === 'free' ? CONFIG.free.maximumCandidates : CONFIG.pro.maximumInitialCandidates;
  const band = CONFIG.closeBand.initialRoutingPoints;
  const top = ranked[0];
  const selected: StrategyCandidateSelection[] = [{
    patternId: top.patternId,
    combinedScore: top.combinedScore,
    normalizedDirectScore: top.normalizedDirectScore,
    rawDirectScore: top.rawDirectScore,
    answeredCount: top.answeredCount,
  }];

  const comparisons: { primary: string; candidate: string; difference: number; withinBand: boolean }[] = [];
  for (let i = 1; i < ranked.length && selected.length < maxCandidates; i++) {
    const diff = top.combinedScore - ranked[i].combinedScore;
    const within = diff <= band;
    comparisons.push({
      primary: top.patternId,
      candidate: ranked[i].patternId,
      difference: diff,
      withinBand: within,
    });
    if (within) {
      selected.push({
        patternId: ranked[i].patternId,
        combinedScore: ranked[i].combinedScore,
        normalizedDirectScore: ranked[i].normalizedDirectScore,
        rawDirectScore: ranked[i].rawDirectScore,
        answeredCount: ranked[i].answeredCount,
      });
    }
  }

  traceEntries.push({
    stage: 'initial-selection',
    label: 'Close-band comparisons',
    details: { comparisons },
  });

  traceEntries.push({
    stage: 'initial-selection',
    label: 'Selected candidates',
    details: { selected: selected.map(s => ({ id: s.patternId, combined: s.combinedScore })) },
  });

  return { candidates: selected, combinedScores: ranked, traceEntries };
}

function getItemIdsForPattern(
  strategyId: string,
  itemNumbers: readonly number[],
  excludeAnswered: Set<string>,
): string[] {
  const items = getStrategyItems(strategyId);
  return items
    .filter(i => {
      if (i.strategyScreen) return false;
      const num = getItemNumber(i);
      return itemNumbers.includes(num) && !excludeAnswered.has(i.id);
    })
    .sort((a, b) => getItemNumber(a) - getItemNumber(b))
    .map(i => i.id);
}

export function getFreeStrategyFollowUp(
  candidates: StrategyCandidateSelection[],
  responses: Record<string, number | undefined>,
): {
  assignments: StrategyFollowUpAssignment[];
  duplicatePrevention: string[];
  allItemIds: string[];
  traceEntries: StrategyRoutingTraceEntry[];
} {
  const traceEntries: StrategyRoutingTraceEntry[] = [];
  const duplicatePrevention: string[] = [];
  const assignments: StrategyFollowUpAssignment[] = [];
  const allItemIds: string[] = [];
  const answeredOrSkipped = new Set(
    Object.entries(responses)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([id]) => id),
  );

  for (const c of candidates) {
    const itemIds = getItemIdsForPattern(c.patternId, CONFIG.free.followUpItemNumbers, answeredOrSkipped);
    const skipped = CONFIG.free.followUpItemNumbers
      .map(n => `strategy-${c.patternId}-0${n}`)
      .filter(id => answeredOrSkipped.has(id));
    if (skipped.length > 0) {
      duplicatePrevention.push(`${c.patternId}: skipped/answered follow-up items removed: ${skipped.join(', ')}`);
    }

    assignments.push({
      patternId: c.patternId,
      batchLabel: 'free-follow-up',
      itemIds,
    });
    allItemIds.push(...itemIds);
  }

  traceEntries.push({
    stage: 'follow-up',
    label: 'Free follow-up assignments',
    details: { assignments: assignments.map(a => ({ id: a.patternId, items: a.itemIds })) },
  });

  return { assignments, duplicatePrevention, allItemIds, traceEntries };
}

export function getProFirstStrategyBatch(
  candidates: StrategyCandidateSelection[],
  responses: Record<string, number | undefined>,
): {
  assignments: StrategyFollowUpAssignment[];
  duplicatePrevention: string[];
  allItemIds: string[];
  traceEntries: StrategyRoutingTraceEntry[];
} {
  const traceEntries: StrategyRoutingTraceEntry[] = [];
  const duplicatePrevention: string[] = [];
  const assignments: StrategyFollowUpAssignment[] = [];
  const allItemIds: string[] = [];
  const answeredOrSkipped = new Set(
    Object.entries(responses)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([id]) => id),
  );

  for (const c of candidates) {
    const itemIds = getItemIdsForPattern(c.patternId, CONFIG.pro.firstBatchItemNumbers, answeredOrSkipped);
    const skipped = CONFIG.pro.firstBatchItemNumbers
      .map(n => `strategy-${c.patternId}-0${n}`)
      .filter(id => answeredOrSkipped.has(id));
    if (skipped.length > 0) {
      duplicatePrevention.push(`${c.patternId}: skipped/answered first-batch items removed: ${skipped.join(', ')}`);
    }

    assignments.push({
      patternId: c.patternId,
      batchLabel: 'pro-first-batch',
      itemIds,
    });
    allItemIds.push(...itemIds);
  }

  traceEntries.push({
    stage: 'follow-up',
    label: 'Pro first-batch assignments',
    details: { assignments: assignments.map(a => ({ id: a.patternId, items: a.itemIds })) },
  });

  return { assignments, duplicatePrevention, allItemIds, traceEntries };
}

export function shouldStopProStrategyRouting(
  candidates: StrategyCandidateSelection[],
  updatedScores: StrategyCandidateScore[],
  responses: Record<string, number | undefined>,
): { stopped: boolean; stopReason: string; traceEntries: StrategyRoutingTraceEntry[] } {
  const traceEntries: StrategyRoutingTraceEntry[] = [];

  if (candidates.length === 0) {
    traceEntries.push({ stage: 'follow-up', label: 'Early stop', details: { stopped: true, reason: 'No candidates' } });
    return { stopped: true, stopReason: 'No candidates', traceEntries };
  }

  const leader = candidates[0];
  const leaderAnswered = (updatedScores.find(s => s.patternId === leader.patternId) ?? computeDirectScore(leader.patternId, responses)).answeredCount;

  if (leaderAnswered < CONFIG.pro.earlyStopMinimumAnsweredItems && candidates.length === 1) {
    const leaderScore = updatedScores.find(s => s.patternId === leader.patternId);
    if (leaderScore && leaderScore.normalizedDirectScore >= CONFIG.pro.minimumFinalNormalizedDirectScore && leaderAnswered >= CONFIG.pro.earlyStopMinimumAnsweredItems) {
      traceEntries.push({
        stage: 'follow-up',
        label: 'Early stop single candidate',
        details: { stopped: true, reason: `Single candidate passed minimum answered items` },
      });
      return { stopped: true, stopReason: `Single candidate passed (answered ${leaderAnswered})`, traceEntries };
    }
  }

  if (candidates.length === 1) {
    traceEntries.push({
      stage: 'follow-up',
      label: 'Early stop check single',
      details: { stopped: false, reason: `Single candidate needs more items` },
    });
    return { stopped: false, stopReason: 'Single candidate — continue to second batch', traceEntries };
  }

  const allMeetMin = candidates.every(c => {
    const s = updatedScores.find(s => s.patternId === c.patternId) ?? computeDirectScore(c.patternId, responses);
    return s.answeredCount >= CONFIG.pro.earlyStopMinimumAnsweredItems;
  });

  if (!allMeetMin) {
    traceEntries.push({
      stage: 'follow-up',
      label: 'Early stop check',
      details: { stopped: false, reason: 'Not all candidates meet minimum answered items' },
    });
    return { stopped: false, stopReason: 'Not all candidates meet minimum answered items', traceEntries };
  }

  const leaderScore = updatedScores.find(s => s.patternId === leader.patternId);
  if (!leaderScore) {
    traceEntries.push({ stage: 'follow-up', label: 'Early stop error', details: { stopped: true, reason: 'Leader score not found' } });
    return { stopped: true, stopReason: 'Leader score not found', traceEntries };
  }

  for (let i = 1; i < candidates.length; i++) {
    const competitor = candidates[i];
    const compScore = updatedScores.find(s => s.patternId === competitor.patternId);
    if (!compScore) continue;
    const diff = leaderScore.combinedScore - compScore.combinedScore;
    if (diff < CONFIG.pro.earlyStopLeadPoints) {
      traceEntries.push({
        stage: 'follow-up',
        label: 'Early stop check',
        details: { stopped: false, reason: `Leader leads ${competitor.patternId} by ${diff.toFixed(2)} < ${CONFIG.pro.earlyStopLeadPoints}` },
      });
      return { stopped: false, stopReason: `Lead over ${competitor.patternId} insufficient`, traceEntries };
    }
  }

  const finalBand = CONFIG.closeBand.finalSecondaryPoints;
  for (let i = 1; i < candidates.length; i++) {
    const competitor = candidates[i];
    const compScore = updatedScores.find(s => s.patternId === competitor.patternId);
    if (!compScore) continue;
    const diff = leaderScore.combinedScore - compScore.combinedScore;
    if (diff <= finalBand) {
      traceEntries.push({
        stage: 'follow-up',
        label: 'Early stop check',
        details: { stopped: false, reason: `${competitor.patternId} within final secondary band (diff ${diff.toFixed(2)} <= ${finalBand})` },
      });
      return { stopped: false, stopReason: `${competitor.patternId} within final secondary band`, traceEntries };
    }
  }

  traceEntries.push({
    stage: 'follow-up',
    label: 'Early stop triggered',
    details: { stopped: true, reason: `Leader leads all by >= ${CONFIG.pro.earlyStopLeadPoints} and no candidates in final band` },
  });
  return { stopped: true, stopReason: `Leader leads all by >= ${CONFIG.pro.earlyStopLeadPoints}, no secondary band`, traceEntries };
}

export function getProSecondStrategyBatch(
  candidates: StrategyCandidateSelection[],
  responses: Record<string, number | undefined>,
  updatedScores: StrategyCandidateScore[],
): {
  assignments: StrategyFollowUpAssignment[];
  duplicatePrevention: string[];
  allItemIds: string[];
  traceEntries: StrategyRoutingTraceEntry[];
} {
  const traceEntries: StrategyRoutingTraceEntry[] = [];
  const duplicatePrevention: string[] = [];
  const assignments: StrategyFollowUpAssignment[] = [];
  const allItemIds: string[] = [];
  const answeredOrSkipped = new Set(
    Object.entries(responses)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([id]) => id),
  );

  const leader = candidates[0];
  const band = CONFIG.closeBand.finalSecondaryPoints;
  const leaderScore = updatedScores.find(s => s.patternId === leader.patternId)?.combinedScore ?? leader.combinedScore;

  const secondBatchCandidates = candidates.filter(c => {
    if (c.patternId === leader.patternId) return true;
    const cs = updatedScores.find(s => s.patternId === c.patternId)?.combinedScore ?? c.combinedScore;
    return (leaderScore - cs) <= band;
  });

  for (const c of secondBatchCandidates) {
    const itemIds = getItemIdsForPattern(c.patternId, CONFIG.pro.secondBatchItemNumbers, answeredOrSkipped);
    const skipped = CONFIG.pro.secondBatchItemNumbers
      .map(n => `strategy-${c.patternId}-0${n}`)
      .filter(id => answeredOrSkipped.has(id));
    if (skipped.length > 0) {
      duplicatePrevention.push(`${c.patternId}: skipped/answered second-batch items removed: ${skipped.join(', ')}`);
    }

    assignments.push({
      patternId: c.patternId,
      batchLabel: 'pro-second-batch',
      itemIds,
    });
    allItemIds.push(...itemIds);
  }

  traceEntries.push({
    stage: 'follow-up',
    label: 'Pro second-batch assignments',
    details: { assignments: assignments.map(a => ({ id: a.patternId, items: a.itemIds })) },
  });

  return { assignments, duplicatePrevention, allItemIds, traceEntries };
}

function produceFinalQualifications(
  candidates: StrategyCandidateSelection[],
  allResponses: Record<string, number | undefined>,
  mode: StrategyRoutingMode,
  eligibility: StrategyEligibility[],
): {
  qualifications: StrategyCandidateQualification[];
  traceEntries: StrategyRoutingTraceEntry[];
} {
  const traceEntries: StrategyRoutingTraceEntry[] = [];
  const minItems = mode === 'free'
    ? CONFIG.free.minimumFinalAnsweredItemsPerCandidate
    : CONFIG.pro.minimumFinalAnsweredItemsPerCandidate;
  const minNorm = CONFIG.free.minimumFinalNormalizedDirectScore;

  const qualifications: StrategyCandidateQualification[] = [];
  for (const c of candidates) {
    const ds = computeDirectScore(c.patternId, allResponses);
    const eligible = eligibility.find(e => e.patternId === c.patternId);
    const wasEligible = eligible?.status === 'eligible';
    const meetsItems = ds.answeredCount >= minItems;
    const meetsScore = ds.normalizedDirectScore >= minNorm;
    const qualified = wasEligible && meetsItems && meetsScore;
    const reasons: string[] = [];
    if (!wasEligible) reasons.push('not initially eligible');
    if (!meetsItems) reasons.push(`answered ${ds.answeredCount}/${minItems} items`);
    if (!meetsScore) reasons.push(`normalized ${ds.normalizedDirectScore.toFixed(2)} < ${minNorm}`);

    qualifications.push({
      patternId: c.patternId,
      eligible: qualified,
      reason: qualified ? 'Qualified' : `Not qualified: ${reasons.join(', ')}`,
      answeredItemCount: ds.answeredCount,
      normalizedDirectScore: ds.normalizedDirectScore,
    });
  }

  traceEntries.push({
    stage: 'final',
    label: 'Final qualifications',
    details: { qualifications: qualifications.map(q => ({ id: q.patternId, eligible: q.eligible, reason: q.reason })) },
  });

  return { qualifications, traceEntries };
}

export function explainStrategyRoutingDecision(
  result: StrategyRoutingResult,
): string {
  return result.trace.finalOutcomeReason;
}

export function produceStrategyRoutingResult(
  responses: Record<string, number | undefined>,
  mode: StrategyRoutingMode,
): StrategyRoutingResult {
  const traceEntries: StrategyRoutingTraceEntry[] = [];

  const answeredItemIds = Object.entries(responses)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([id]) => id);
  const skippedItemIds = Object.entries(responses)
    .filter(([, v]) => v === undefined || v === null)
    .map(([id]) => id);

  const retryableUniversal = getRetryableUniversalScreeners(responses);

  const eligibility = evaluateUniversalEligibility(responses);
  traceEntries.push({
    stage: 'universal',
    label: 'Universal eligibility evaluated',
    details: { eligibility: eligibility.map(e => ({ id: e.patternId, status: e.status, reason: e.reason })) },
  });

  const allDirectScores = scoreStrategyDirectEvidence(responses);
  traceEntries.push({
    stage: 'universal',
    label: 'Direct scores computed',
    details: { scores: allDirectScores.map(d => ({ id: d.patternId, raw: d.rawDirectScore, norm: d.normalizedDirectScore, answered: d.answeredCount })) },
  });

  const compatibleCoreScores = STRATEGY_PATTERN_IDS.map(sid => ({
    patternId: sid as StrategyPatternId,
    normalizedScore: computeCompatibleCoreScore(sid as StrategyPatternId),
  }));

  const { candidates: initialCandidates, combinedScores: allCombinedScores, traceEntries: initialTrace } =
    selectInitialStrategyCandidates(eligibility, allDirectScores, mode, responses);
  traceEntries.push(...initialTrace);

  if (initialCandidates.length === 0) {
    const noEligible = eligibility.every(e => e.status === 'incomplete');
    const outcome: StrategyRoutingOutcome = noEligible ? 'insufficient-evidence' : 'no-clear-strategy';
    const reason = noEligible ? 'All strategies incomplete after universal screen' : 'No eligible candidates reach score threshold';

    const trace: StrategyRoutingTrace = {
      configVersion: '1.0',
      mode,
      answeredItemIds,
      skippedItemIds,
      retryableUniversalScreenerIds: retryableUniversal,
      directScores: allDirectScores,
      compatibleCoreScores,
      combinedScores: allCombinedScores.map(s => ({ patternId: s.patternId, combinedScore: s.combinedScore })),
      eligibilityResults: eligibility,
      rankingsAfterEachStage: [{ stage: 'universal', rankedIds: [] }],
      selectedCandidates: [],
      closeBandComparisons: [],
      followUpItemAssignments: [],
      duplicatePreventionDecisions: [],
      stopDecision: { stopped: true, stopReason: reason, stage: 'universal' },
      finalQualifications: [],
      finalOutcomeReason: reason,
    };

    return {
      outcome,
      primary: null,
      primaryRawScore: 0,
      primaryNormalizedScore: 0,
      secondaries: [],
      followUpItemIds: [],
      trace,
    };
  }

  let followUpItemIds: string[] = [];
  const allAssignments: StrategyFollowUpAssignment[] = [];
  const allDuplicatePrevention: string[] = [];

  if (mode === 'free') {
    const freeResult = getFreeStrategyFollowUp(initialCandidates, responses);
    allAssignments.push(...freeResult.assignments);
    allDuplicatePrevention.push(...freeResult.duplicatePrevention);
    followUpItemIds = freeResult.allItemIds;
    traceEntries.push(...freeResult.traceEntries);
  } else {
    const firstBatch = getProFirstStrategyBatch(initialCandidates, responses);
    allAssignments.push(...firstBatch.assignments);
    allDuplicatePrevention.push(...firstBatch.duplicatePrevention);
    followUpItemIds = firstBatch.allItemIds;
    traceEntries.push(...firstBatch.traceEntries);

    const { stopped, stopReason, traceEntries: stopTrace } = shouldStopProStrategyRouting(
      initialCandidates,
      allCombinedScores,
      responses,
    );
    traceEntries.push(...stopTrace);

    traceEntries.push({
      stage: 'follow-up',
      label: 'Pro early stop decision',
      details: { stopped, reason: stopReason },
    });

    if (!stopped && initialCandidates.length > 0) {
      const secondBatch = getProSecondStrategyBatch(initialCandidates, responses, allCombinedScores);
      allAssignments.push(...secondBatch.assignments);
      allDuplicatePrevention.push(...secondBatch.duplicatePrevention);
      followUpItemIds.push(...secondBatch.allItemIds);
      traceEntries.push(...secondBatch.traceEntries);
    }

    traceEntries.push({
      stage: 'follow-up',
      label: 'Pro routing complete',
      details: { stopped, stopReason },
    });
  }

  const { qualifications, traceEntries: qualTrace } = produceFinalQualifications(
    initialCandidates,
    responses,
    mode,
    eligibility,
  );
  traceEntries.push(...qualTrace);

  const qualified = qualifications.filter(q => q.eligible);
  let outcome: StrategyRoutingOutcome;
  let primary: StrategyPatternId | null = null;
  let primaryRawScore = 0;
  let primaryNormalizedScore = 0;
  const secondaries: { patternId: StrategyPatternId; rawScore: number; normalizedScore: number; combinedScore: number }[] = [];

  if (qualified.length === 0) {
    const hasSomeAnswered = initialCandidates.some(c => {
      const ds = computeDirectScore(c.patternId, responses);
      return ds.answeredCount > 0;
    });
    outcome = hasSomeAnswered ? 'no-clear-strategy' : 'insufficient-evidence';
    const reason = outcome === 'no-clear-strategy'
      ? 'No candidate reached final normalized score threshold'
      : 'Insufficient answered items across all candidates';
    const trace: StrategyRoutingTrace = {
      configVersion: '1.0',
      mode,
      answeredItemIds,
      skippedItemIds,
      retryableUniversalScreenerIds: retryableUniversal,
      directScores: allDirectScores,
      compatibleCoreScores,
      combinedScores: allCombinedScores.map(s => ({ patternId: s.patternId, combinedScore: s.combinedScore })),
      eligibilityResults: eligibility,
      rankingsAfterEachStage: [
        { stage: 'universal', rankedIds: allCombinedScores.map(s => s.patternId) },
        { stage: 'initial-selection', rankedIds: initialCandidates.map(c => c.patternId) },
      ],
      selectedCandidates: initialCandidates,
      closeBandComparisons: [],
      followUpItemAssignments: allAssignments,
      duplicatePreventionDecisions: allDuplicatePrevention,
      stopDecision: { stopped: true, stopReason: reason, stage: 'final' },
      finalQualifications: qualifications,
      finalOutcomeReason: reason,
    };

    return {
      outcome,
      primary: null,
      primaryRawScore: 0,
      primaryNormalizedScore: 0,
      secondaries: [],
      followUpItemIds,
      trace,
    };
  }

  const rankedQualified = rankStrategyCandidates(
    qualified.map(q => {
      const ds = computeDirectScore(q.patternId, responses);
      const combinedScore = allCombinedScores.find(s => s.patternId === q.patternId)?.combinedScore ?? ds.normalizedDirectScore;
      return {
        patternId: q.patternId,
        answeredCount: ds.answeredCount,
        rawDirectScore: ds.rawDirectScore,
        normalizedDirectScore: ds.normalizedDirectScore,
        compatibleCorePatternId: q.patternId,
        compatibleCoreNormalizedScore: computeCompatibleCoreScore(q.patternId),
        combinedScore,
      };
    }),
  );

  primary = rankedQualified[0].patternId;
  primaryRawScore = rankedQualified[0].rawDirectScore;
  primaryNormalizedScore = rankedQualified[0].normalizedDirectScore;

  const band = CONFIG.closeBand.finalSecondaryPoints;
  const maxSecondaries = CONFIG.closeBand.maximumSecondaries;
  const closeBandComparisons: { primary: string; candidate: string; difference: number; withinBand: boolean }[] = [];

  for (let i = 1; i < rankedQualified.length && secondaries.length < maxSecondaries; i++) {
    const diff = rankedQualified[0].combinedScore - rankedQualified[i].combinedScore;
    const within = diff <= band;
    closeBandComparisons.push({
      primary: primary,
      candidate: rankedQualified[i].patternId,
      difference: diff,
      withinBand: within,
    });
    if (within) {
      secondaries.push({
        patternId: rankedQualified[i].patternId,
        rawScore: rankedQualified[i].rawDirectScore,
        normalizedScore: rankedQualified[i].normalizedDirectScore,
        combinedScore: rankedQualified[i].combinedScore,
      });
    }
  }

  if (secondaries.length > 0) {
    outcome = secondaries.length >= 1 ? 'primary-with-secondary' : 'primary';
  } else {
    outcome = 'primary';
  }

  const reason = secondaries.length > 0
    ? `Primary: ${primary} (${primaryNormalizedScore.toFixed(2)}), secondary: ${secondaries.map(s => s.patternId).join(', ')}`
    : `Primary: ${primary} (${primaryNormalizedScore.toFixed(2)})`;

  const trace: StrategyRoutingTrace = {
    configVersion: '1.0',
    mode,
    answeredItemIds,
    skippedItemIds,
    retryableUniversalScreenerIds: retryableUniversal,
    directScores: allDirectScores,
    compatibleCoreScores,
    combinedScores: allCombinedScores.map(s => ({ patternId: s.patternId, combinedScore: s.combinedScore })),
    eligibilityResults: eligibility,
    rankingsAfterEachStage: [
      { stage: 'universal', rankedIds: allCombinedScores.map(s => s.patternId) },
      { stage: 'initial-selection', rankedIds: initialCandidates.map(c => c.patternId) },
      { stage: 'final', rankedIds: rankedQualified.map(q => q.patternId) },
    ],
    selectedCandidates: initialCandidates,
    closeBandComparisons,
    followUpItemAssignments: allAssignments,
    duplicatePreventionDecisions: allDuplicatePrevention,
    stopDecision: { stopped: false, stopReason: 'Routing complete', stage: 'final' },
    finalQualifications: qualifications,
    finalOutcomeReason: reason,
  };

  return {
    outcome,
    primary,
    primaryRawScore,
    primaryNormalizedScore,
    secondaries,
    followUpItemIds,
    trace,
  };
}
