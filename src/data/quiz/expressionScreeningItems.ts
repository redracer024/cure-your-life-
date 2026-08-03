/*
 * Expression Individual Screening Items
 *
 * This registry will hold the 290 individual screening items (2 per Expression
 * for all 145 registered Expressions) once they are authored.
 *
 * These items screen individual Expressions within the groups that advanced
 * from group screening. They are not confirmation items — confirmation is a
 * separate stage that validates the final selected Expression(s).
 *
 * All items are Pro-only, direct-scored (reverseScored: false), and use the
 * same 1-5 Likert scale as group screening.
 *
 * Each Expression requires exactly 2 items with itemNumber 1 and 2.
 *
 * Batch 1: 12 items, 6 Expressions, 2 groups (silenced-one)
 *   expression-group-silenced-one-conflict-suppression
 *   expression-group-silenced-one-speech-emergence
 *
 * Batch 2: 12 items, 6 Expressions, 2 groups (unheld-one)
 *   expression-group-unheld-one-attachment-alarm-and-return
 *   expression-group-unheld-one-relationship-threat-interpretation
 *
 * Batch 3: 14 items, 7 Expressions, 2 groups (invisible-one)
 *   expression-group-invisible-one-presence-avoidance
 *   expression-group-invisible-one-recognition-conflict
 *
 * Batch 4: 14 items, 7 Expressions, 2 groups (shame-bearer)
 *   expression-group-shame-bearer-core-defectiveness
 *   expression-group-shame-bearer-exposure-concealment
 *
 * Batch 5: 20 items, 10 Expressions, 3 groups
 *   expression-group-shame-bearer-shame-expression-channels
 *   expression-group-shame-bearer-body-moral-condemnation
 *   expression-group-controller-standards-evaluation
 *
 * Batch 6: 24 items, 12 Expressions, 3 groups
 *   expression-group-controller-situation-management
 *   expression-group-avoidant-one-delay-distraction
 *   expression-group-avoidant-one-withdrawal-disappearance
 *
 * Batch 7: 24 items, 12 Expressions, 3 groups
 *   expression-group-avoidant-one-decision-commitment
 *   expression-group-hypervigilant-one-anticipatory-threat
 *   expression-group-hypervigilant-one-preparedness-exit
 *
 * Batch 8: 22 items, 11 Expressions, 3 groups
 *   expression-group-hypervigilant-one-relational-scanning
 *   expression-group-hypervigilant-one-monitoring
 *   expression-group-entangled-one-proximity-pursuit
 *
 * Batch 9: 20 items, 10 Expressions, 3 groups
 *   expression-group-entangled-one-identity-merger
 *   expression-group-grief-bearer-unexpressed-delayed
 *   expression-group-grief-bearer-loss-attachment
 *
 * Batch 10: 20 items, 10 Expressions, 3 groups (martyr)
 *   expression-group-martyr-overgiving-depletion
 *   expression-group-martyr-recognition-reciprocity
 *   expression-group-martyr-overfunctioning-crisis
 *
 * Batch 11: 22 items, 11 Expressions, 3 groups (rescuer)
 *   expression-group-rescuer-intervention-fixing
 *   expression-group-rescuer-consequence-prevention
 *   expression-group-rescuer-indispensable-helper
 *
 * Batch 12: 30 items, 15 Expressions, 4 groups (rescuer, over-responsible-one)
 *   expression-group-rescuer-hidden-contract-control
 *   expression-group-over-responsible-one-emotional-care
 *   expression-group-over-responsible-one-guilt-blame
 *   expression-group-over-responsible-one-boundary-rest
 *
 * Batch 13: 28 items, 14 Expressions, 4 groups (over-responsible-one, overloaded-one)
 *   expression-group-over-responsible-one-anticipatory-moral
 *   expression-group-overloaded-one-capacity-backup
 *   expression-group-overloaded-one-mental-load
 *   expression-group-overloaded-one-crisis-stop-resume
 *
 * Batch 14 (final): 28 items, 14 Expressions, 5 groups (perfectionist, anger-shield)
 *   expression-group-perfectionist-standards-evaluation
 *   expression-group-perfectionist-performance-exposure
 *   expression-group-anger-shield-explosive-contempt
 *   expression-group-anger-shield-cold-defensive
 *   expression-group-anger-shield-righteous-cycle
 *
 * Current item count: 290
 */

import type { ExpressionScreeningItemDefinition } from '../../types/expressionScreening';

export const EXPRESSION_SCREENING_ITEMS: readonly ExpressionScreeningItemDefinition[] = [
  // ── Group: expression-group-silenced-one-conflict-suppression ───────────

  // silenced-people-pleaser
  {
    id: "expression-screen-people-pleaser-01",
    expressionId: "silenced-people-pleaser",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 1,
    prompt: "I change what I choose to better match what others seem to want.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-people-pleaser-02",
    expressionId: "silenced-people-pleaser",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 2,
    prompt: "I prioritize keeping others' approval over expressing my own preferences.",
    access: "pro",
    reverseScored: false,
  },

  // silenced-conflict-avoider
  {
    id: "expression-screen-conflict-avoider-01",
    expressionId: "silenced-conflict-avoider",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 1,
    prompt: "I postpone necessary disagreements because engaging feels difficult.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-conflict-avoider-02",
    expressionId: "silenced-conflict-avoider",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 2,
    prompt: "When disagreement becomes possible, I back away rather than expressing a different view.",
    access: "pro",
    reverseScored: false,
  },

  // silenced-tension-and-silence
  {
    id: "expression-screen-tension-and-silence-01",
    expressionId: "silenced-tension-and-silence",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 1,
    prompt: "I become noticeably quieter when tension appears in an interaction.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-tension-and-silence-02",
    expressionId: "silenced-tension-and-silence",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 2,
    prompt: "I have trouble finding words during moments of interpersonal tension.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-silenced-one-speech-emergence ──────────────

  // silenced-pressure-building-anger
  {
    id: "expression-screen-pressure-building-anger-01",
    expressionId: "silenced-pressure-building-anger",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 1,
    prompt: "I hold back irritation until it builds up inside me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-pressure-building-anger-02",
    expressionId: "silenced-pressure-building-anger",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 2,
    prompt: "After holding reactions in, my anger comes out more strongly than I expected.",
    access: "pro",
    reverseScored: false,
  },

  // silenced-blurt-or-freeze
  {
    id: "expression-screen-blurt-or-freeze-01",
    expressionId: "silenced-blurt-or-freeze",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 1,
    prompt: "Under interpersonal pressure, I lose control over how quickly my words come.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-blurt-or-freeze-02",
    expressionId: "silenced-blurt-or-freeze",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 2,
    prompt: "Under interpersonal pressure, accessing the words I intend to say becomes difficult.",
    access: "pro",
    reverseScored: false,
  },

  // silenced-explanation-flood
  {
    id: "expression-screen-explanation-flood-01",
    expressionId: "silenced-explanation-flood",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 1,
    prompt: "I continue explaining after my main point has already been made.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-explanation-flood-02",
    expressionId: "silenced-explanation-flood",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 2,
    prompt: "I add more detail because a concise answer does not feel sufficient.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-unheld-one-attachment-alarm-and-return ─────

  // unheld-attachment-alarm
  {
    id: "expression-screen-attachment-alarm-01",
    expressionId: "unheld-attachment-alarm",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 1,
    prompt: "I become internally alarmed when someone important feels less available.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-attachment-alarm-02",
    expressionId: "unheld-attachment-alarm",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 2,
    prompt: "I have difficulty settling internally when a relationship feels uncertain.",
    access: "pro",
    reverseScored: false,
  },

  // unheld-reassurance-seeker
  {
    id: "expression-screen-reassurance-seeker-01",
    expressionId: "unheld-reassurance-seeker",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 1,
    prompt: "I directly ask for confirmation that someone still cares about me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-reassurance-seeker-02",
    expressionId: "unheld-reassurance-seeker",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 2,
    prompt: "After uncertainty appears, I need repeated evidence of care to feel settled.",
    access: "pro",
    reverseScored: false,
  },

  // unheld-return-tester
  {
    id: "expression-screen-return-tester-01",
    expressionId: "unheld-return-tester",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 1,
    prompt: "I pull back partly to see whether the other person moves toward me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-return-tester-02",
    expressionId: "unheld-return-tester",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 2,
    prompt: "I use another person's response to distance as evidence about whether the connection is stable.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-unheld-one-relationship-threat-interpretation ─

  // unheld-jealousy-interpreter
  {
    id: "expression-screen-jealousy-interpreter-01",
    expressionId: "unheld-jealousy-interpreter",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 1,
    prompt: "I treat another person's attention toward someone close to me as a threat to my place in the relationship.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-jealousy-interpreter-02",
    expressionId: "unheld-jealousy-interpreter",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 2,
    prompt: "I compare my place in the relationship with the apparent importance of someone else.",
    access: "pro",
    reverseScored: false,
  },

  // unheld-conflict-for-contact
  {
    id: "expression-screen-conflict-for-contact-01",
    expressionId: "unheld-conflict-for-contact",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 1,
    prompt: "I engage in disagreement partly because it still produces contact with the other person.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-conflict-for-contact-02",
    expressionId: "unheld-conflict-for-contact",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 2,
    prompt: "I continue conflict because disengagement feels worse than negative contact.",
    access: "pro",
    reverseScored: false,
  },

  // unheld-relationship-threat-scanner
  {
    id: "expression-screen-relationship-threat-scanner-01",
    expressionId: "unheld-relationship-threat-scanner",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 1,
    prompt: "I closely track subtle changes in how someone relates to me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-relationship-threat-scanner-02",
    expressionId: "unheld-relationship-threat-scanner",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 2,
    prompt: "I interpret ambiguous relational changes through the concern that connection is becoming less secure.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-invisible-one-presence-avoidance ─────────

  // invisible-presence-minimizer
  {
    id: "expression-screen-presence-minimizer-01",
    expressionId: "invisible-presence-minimizer",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 1,
    prompt: "I make my presence less noticeable when attention becomes possible.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-presence-minimizer-02",
    expressionId: "invisible-presence-minimizer",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 2,
    prompt: "I reduce my visible participation even when I have something relevant to contribute.",
    access: "pro",
    reverseScored: false,
  },

  // invisible-background-positioner
  {
    id: "expression-screen-background-positioner-01",
    expressionId: "invisible-background-positioner",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 1,
    prompt: "I choose less visible roles even when I could take a more central one.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-background-positioner-02",
    expressionId: "invisible-background-positioner",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 2,
    prompt: "I allow others to take the visible position while I remain supportive.",
    access: "pro",
    reverseScored: false,
  },

  // invisible-hidden-ambition
  {
    id: "expression-screen-hidden-ambition-01",
    expressionId: "invisible-hidden-ambition",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 1,
    prompt: "I keep my aspirations private rather than letting others know what I want to pursue.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hidden-ambition-02",
    expressionId: "invisible-hidden-ambition",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 2,
    prompt: "I downplay my desire for advancement because openly wanting it would attract attention.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-invisible-one-recognition-conflict ────────

  // invisible-praise-deflector
  {
    id: "expression-screen-praise-deflector-01",
    expressionId: "invisible-praise-deflector",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 1,
    prompt: "I minimize the importance of what another person is praising me for.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-praise-deflector-02",
    expressionId: "invisible-praise-deflector",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 2,
    prompt: "I redirect credit away from myself after receiving recognition.",
    access: "pro",
    reverseScored: false,
  },

  // invisible-recognition-conflict
  {
    id: "expression-screen-recognition-conflict-01",
    expressionId: "invisible-recognition-conflict",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 1,
    prompt: "I want my contribution to be noticed, but attention also makes me feel exposed.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-recognition-conflict-02",
    expressionId: "invisible-recognition-conflict",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 2,
    prompt: "After moving toward visibility, I want to retreat once attention reaches me.",
    access: "pro",
    reverseScored: false,
  },

  // invisible-approval-chameleon
  {
    id: "expression-screen-approval-chameleon-01",
    expressionId: "invisible-approval-chameleon",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 1,
    prompt: "I change how I present myself to match what the people around me seem to approve of.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-approval-chameleon-02",
    expressionId: "invisible-approval-chameleon",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 2,
    prompt: "I show the version of myself that seems most likely to be accepted.",
    access: "pro",
    reverseScored: false,
  },

  // invisible-needs-concealer
  {
    id: "expression-screen-needs-concealer-01",
    expressionId: "invisible-needs-concealer",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 1,
    prompt: "I keep my needs hidden even when sharing them would be reasonably safe.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-needs-concealer-02",
    expressionId: "invisible-needs-concealer",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 2,
    prompt: "I present myself as self-sufficient even when support would actually be useful.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-shame-bearer-core-defectiveness ──────────

  // shame-defective-one
  {
    id: "expression-screen-defective-one-01",
    expressionId: "shame-defective-one",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 1,
    prompt: "A specific flaw or failure can make me feel like there is something fundamentally wrong with me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-defective-one-02",
    expressionId: "shame-defective-one",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 2,
    prompt: "I feel internally wrong or unacceptable rather than just dissatisfied with a particular behavior.",
    access: "pro",
    reverseScored: false,
  },

  // shame-burden
  {
    id: "expression-screen-burden-01",
    expressionId: "shame-burden",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 1,
    prompt: "I believe my personal needs place an unreasonable cost on other people.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-burden-02",
    expressionId: "shame-burden",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 2,
    prompt: "I question whether I deserve support because of how my needs affect others.",
    access: "pro",
    reverseScored: false,
  },

  // shame-imposter
  {
    id: "expression-screen-imposter-01",
    expressionId: "shame-imposter",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 1,
    prompt: "I worry that others might discover I am less capable than they assume.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-imposter-02",
    expressionId: "shame-imposter",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 2,
    prompt: "I discount my competence or achievements as not genuinely earned.",
    access: "pro",
    reverseScored: false,
  },

  // shame-comparison-prisoner
  {
    id: "expression-screen-comparison-prisoner-01",
    expressionId: "shame-comparison-prisoner",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 1,
    prompt: "I use another person's strengths or progress as evidence of my own inadequacy.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-comparison-prisoner-02",
    expressionId: "shame-comparison-prisoner",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 2,
    prompt: "I remain mentally caught in an unfavorable comparison after noticing someone is ahead of me.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-shame-bearer-exposure-concealment ─────────

  // shame-praise-disqualifier
  {
    id: "expression-screen-praise-disqualifier-01",
    expressionId: "shame-praise-disqualifier",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 1,
    prompt: "I treat positive feedback as unreliable because the other person does not know enough about me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-praise-disqualifier-02",
    expressionId: "shame-praise-disqualifier",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 2,
    prompt: "I find reasons that praise does not count as meaningful evidence about me.",
    access: "pro",
    reverseScored: false,
  },

  // shame-secret-keeper
  {
    id: "expression-screen-secret-keeper-01",
    expressionId: "shame-secret-keeper",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 1,
    prompt: "I keep personally significant information hidden from otherwise trusted people.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-secret-keeper-02",
    expressionId: "shame-secret-keeper",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 2,
    prompt: "I fear that if someone knew me fully, their view of me would change in a negative way.",
    access: "pro",
    reverseScored: false,
  },

  // shame-self-punisher
  {
    id: "expression-screen-self-punisher-01",
    expressionId: "shame-self-punisher",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 1,
    prompt: "After making a mistake, I believe I should lose access to something comforting.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-self-punisher-02",
    expressionId: "shame-self-punisher",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 2,
    prompt: "I withhold ordinary kindness or comfort from myself as a form of penalty.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-perfection-01",
    expressionId: "shame-to-perfection",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "I set personal standards so high that I practically guarantee falling short.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-perfection-02",
    expressionId: "shame-to-perfection",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "I hold myself to an impossible ideal and then criticize myself for not reaching it.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-anger-01",
    expressionId: "shame-to-anger",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "When I feel exposed or inadequate, my first reaction is irritation or anger.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-anger-02",
    expressionId: "shame-to-anger",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "I get defensive and snap at others whenever I feel shame rising up.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-disappearance-01",
    expressionId: "shame-to-disappearance",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "I have a strong urge to vanish or become invisible whenever I feel ashamed.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-to-disappearance-02",
    expressionId: "shame-to-disappearance",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "My instinct when humiliated is to shrink away and disappear from view.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-chronic-apologizer-01",
    expressionId: "shame-chronic-apologizer",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "I apologize constantly — even for things that clearly are not my fault.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-chronic-apologizer-02",
    expressionId: "shame-chronic-apologizer",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "Saying sorry has become my automatic response to any tension or discomfort.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-confession-loop-01",
    expressionId: "shame-confession-loop",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "I feel compelled to confess my flaws or mistakes before anyone can point them out.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-confession-loop-02",
    expressionId: "shame-confession-loop",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "I preemptively admit fault in an attempt to soften the judgment I expect from others.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-body-shamed-self-01",
    expressionId: "shame-body-shamed-self",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 1,
    prompt: "My body feels like something to be ashamed of rather than to inhabit with pride.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-body-shamed-self-02",
    expressionId: "shame-body-shamed-self",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 2,
    prompt: "I avoid looking at or touching my own body because I find it deeply unappealing.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-morally-condemned-self-01",
    expressionId: "shame-morally-condemned-self",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 1,
    prompt: "I believe I am fundamentally bad or morally corrupt at my core.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-morally-condemned-self-02",
    expressionId: "shame-morally-condemned-self",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 2,
    prompt: "No amount of good behavior could ever make me a truly good person.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-standard-enforcer-01",
    expressionId: "controller-standard-enforcer",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 1,
    prompt: "I hold myself to impossibly exact standards and judge myself harshly when I fail to meet them.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-standard-enforcer-02",
    expressionId: "controller-standard-enforcer",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 2,
    prompt: "I treat any deviation from my personal standards as a sign of personal failure.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-constant-evaluator-01",
    expressionId: "controller-constant-evaluator",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 1,
    prompt: "I am constantly evaluating whether I am measuring up to expectations.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-constant-evaluator-02",
    expressionId: "controller-constant-evaluator",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 2,
    prompt: "I analyze my own performance almost nonstop, looking for evidence that I am falling short.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-proving-achiever-01",
    expressionId: "controller-proving-achiever",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 1,
    prompt: "I feel driven to prove my worth through external achievements and recognition.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-proving-achiever-02",
    expressionId: "controller-proving-achiever",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 2,
    prompt: "My sense of value depends heavily on what I accomplish or produce.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-controller-situation-management ─────────────

  // controller-control-scanner
  {
    id: "expression-screen-control-scanner-01",
    expressionId: "controller-control-scanner",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 1,
    prompt: "I automatically notice which parts of a situation are not fully managed.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-control-scanner-02",
    expressionId: "controller-control-scanner",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 2,
    prompt: "My attention goes to what could become difficult to manage.",
    access: "pro",
    reverseScored: false,
  },

  // controller-analysis-gatekeeper
  {
    id: "expression-screen-analysis-gatekeeper-01",
    expressionId: "controller-analysis-gatekeeper",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 1,
    prompt: "I need more analysis before I allow myself to act.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-analysis-gatekeeper-02",
    expressionId: "controller-analysis-gatekeeper",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 2,
    prompt: "I postpone commitment because uncertainty still feels unresolved.",
    access: "pro",
    reverseScored: false,
  },

  // controller-fixed-plan
  {
    id: "expression-screen-fixed-plan-01",
    expressionId: "controller-fixed-plan",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 1,
    prompt: "I feel unsettled when a plan I made has to change.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-fixed-plan-02",
    expressionId: "controller-fixed-plan",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 2,
    prompt: "I hold onto the original plan even after a workable alternative appears.",
    access: "pro",
    reverseScored: false,
  },

  // controller-perception-manager
  {
    id: "expression-screen-perception-manager-01",
    expressionId: "controller-perception-manager",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 1,
    prompt: "I carefully choose which parts of a situation I emphasize to others.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perception-manager-02",
    expressionId: "controller-perception-manager",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 2,
    prompt: "I try to guide how another person interprets what happened.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-avoidant-one-delay-distraction ──────────────

  // avoidant-procrastinator
  {
    id: "expression-screen-procrastinator-01",
    expressionId: "avoidant-procrastinator",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 1,
    prompt: "I put off starting a task even when I know it needs to be done.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-procrastinator-02",
    expressionId: "avoidant-procrastinator",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 2,
    prompt: "I wait until pressure increases before I take action.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-distractor
  {
    id: "expression-screen-distractor-01",
    expressionId: "avoidant-distractor",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 1,
    prompt: "I turn my attention elsewhere quickly when discomfort appears.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-distractor-02",
    expressionId: "avoidant-distractor",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 2,
    prompt: "I seek stimulation so inner discomfort stays less noticeable.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-busy-avoider
  {
    id: "expression-screen-busy-avoider-01",
    expressionId: "avoidant-busy-avoider",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 1,
    prompt: "I take on more activity when being still would bring a difficult issue into awareness.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-busy-avoider-02",
    expressionId: "avoidant-busy-avoider",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 2,
    prompt: "I choose useful tasks instead of addressing an emotionally difficult matter.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-intellectualizer
  {
    id: "expression-screen-intellectualizer-01",
    expressionId: "avoidant-intellectualizer",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 1,
    prompt: "I analyze an emotional experience instead of noticing how it feels.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-intellectualizer-02",
    expressionId: "avoidant-intellectualizer",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 2,
    prompt: "I explain why something happened while staying disconnected from my emotional response.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-avoidant-one-withdrawal-disappearance ────────

  // avoidant-emotional-evader
  {
    id: "expression-screen-emotional-evader-01",
    expressionId: "avoidant-emotional-evader",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 1,
    prompt: "I change focus when an emotion starts becoming clear.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-emotional-evader-02",
    expressionId: "avoidant-emotional-evader",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 2,
    prompt: "I steer away from discussing my emotional experience even with someone reasonably safe.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-ghost
  {
    id: "expression-screen-ghost-01",
    expressionId: "avoidant-ghost",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 1,
    prompt: "I allow messages to go unanswered because responding feels emotionally difficult.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-ghost-02",
    expressionId: "avoidant-ghost",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 2,
    prompt: "I withdraw from a relationship without explaining the change even when communication would be reasonably safe.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-sleep-disappear
  {
    id: "expression-screen-sleep-disappear-01",
    expressionId: "avoidant-sleep-disappear",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 1,
    prompt: "I want to sleep when emotional pressure becomes difficult to face.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-sleep-disappear-02",
    expressionId: "avoidant-sleep-disappear",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 2,
    prompt: "I stay in bed longer to postpone facing an uncomfortable situation even when I am not especially tired.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-pleasure-avoider
  {
    id: "expression-screen-pleasure-avoider-01",
    expressionId: "avoidant-pleasure-avoider",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 1,
    prompt: "I pull away when enjoyment itself begins to feel uncomfortable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-pleasure-avoider-02",
    expressionId: "avoidant-pleasure-avoider",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 2,
    prompt: "I limit positive experiences because allowing enjoyment feels emotionally difficult.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-avoidant-one-decision-commitment ────────────

  // avoidant-indecisive-one
  {
    id: "expression-screen-avoidant-indecisive-one-01",
    expressionId: "avoidant-indecisive-one",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 1,
    prompt: "I move back and forth between reasonable options without settling on one.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-avoidant-indecisive-one-02",
    expressionId: "avoidant-indecisive-one",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 2,
    prompt: "I delay choosing because selecting one option means giving up others.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-commitment-dodger
  {
    id: "expression-screen-avoidant-commitment-dodger-01",
    expressionId: "avoidant-commitment-dodger",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 1,
    prompt: "I lose momentum once a choice starts to feel binding.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-avoidant-commitment-dodger-02",
    expressionId: "avoidant-commitment-dodger",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 2,
    prompt: "I keep escape routes open even after I have chosen a direction.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-perpetual-researcher
  {
    id: "expression-screen-avoidant-perpetual-researcher-01",
    expressionId: "avoidant-perpetual-researcher",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 1,
    prompt: "I continue researching after the main decision-relevant questions are answered.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-avoidant-perpetual-researcher-02",
    expressionId: "avoidant-perpetual-researcher",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 2,
    prompt: "I look for one more source before allowing myself to act.",
    access: "pro",
    reverseScored: false,
  },

  // avoidant-crisis-creator
  {
    id: "expression-screen-avoidant-crisis-creator-01",
    expressionId: "avoidant-crisis-creator",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 1,
    prompt: "I wait until a situation becomes urgent before I fully engage with it.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-avoidant-crisis-creator-02",
    expressionId: "avoidant-crisis-creator",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 2,
    prompt: "I do not fully address manageable demands until they become last-minute pressure.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-hypervigilant-one-anticipatory-threat ───────

  // hypervigilant-threat-forecaster
  {
    id: "expression-screen-hypervigilant-threat-forecaster-01",
    expressionId: "hypervigilant-threat-forecaster",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 1,
    prompt: "I notice how a situation could become unsafe before clear warning signs appear.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-threat-forecaster-02",
    expressionId: "hypervigilant-threat-forecaster",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 2,
    prompt: "I project forward to possible danger in situations that contain uncertainty.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-conflict-predictor
  {
    id: "expression-screen-hypervigilant-conflict-predictor-01",
    expressionId: "hypervigilant-conflict-predictor",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 1,
    prompt: "I read ambiguous interactions as likely to become conflict.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-conflict-predictor-02",
    expressionId: "hypervigilant-conflict-predictor",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 2,
    prompt: "I prepare for disagreement before the other person has expressed one.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-worst-case-rehearser
  {
    id: "expression-screen-hypervigilant-worst-case-rehearser-01",
    expressionId: "hypervigilant-worst-case-rehearser",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 1,
    prompt: "I repeatedly imagine the most damaging outcome of a situation.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-worst-case-rehearser-02",
    expressionId: "hypervigilant-worst-case-rehearser",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 2,
    prompt: "I mentally practice how to respond to a feared scenario.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-loss-forecaster
  {
    id: "expression-screen-hypervigilant-loss-forecaster-01",
    expressionId: "hypervigilant-loss-forecaster",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 1,
    prompt: "I expect positive situations to become unavailable to me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-loss-forecaster-02",
    expressionId: "hypervigilant-loss-forecaster",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 2,
    prompt: "I mentally prepare for the removal of something important.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-hypervigilant-one-preparedness-exit ─────────

  // hypervigilant-exit-planner
  {
    id: "expression-screen-hypervigilant-exit-planner-01",
    expressionId: "hypervigilant-exit-planner",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 1,
    prompt: "I notice available ways out even when no clear danger is present.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-exit-planner-02",
    expressionId: "hypervigilant-exit-planner",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 2,
    prompt: "I mentally plan how to leave if conditions change.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-emergency-preparer
  {
    id: "expression-screen-hypervigilant-emergency-preparer-01",
    expressionId: "hypervigilant-emergency-preparer",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 1,
    prompt: "I prepare backup resources beyond what the current situation clearly requires.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-emergency-preparer-02",
    expressionId: "hypervigilant-emergency-preparer",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 2,
    prompt: "I feel calmer only after backup arrangements are in place.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-sleepless-guard
  {
    id: "expression-screen-hypervigilant-sleepless-guard-01",
    expressionId: "hypervigilant-sleepless-guard",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 1,
    prompt: "I have difficulty settling into sleep while monitoring for possible problems.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-sleepless-guard-02",
    expressionId: "hypervigilant-sleepless-guard",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 2,
    prompt: "I stay mentally ready when rest would otherwise be possible.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-protective-parent
  {
    id: "expression-screen-hypervigilant-protective-parent-01",
    expressionId: "hypervigilant-protective-parent",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 1,
    prompt: "I keep monitoring the safety of someone I feel responsible for after reasonable precautions are already in place.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-protective-parent-02",
    expressionId: "hypervigilant-protective-parent",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 2,
    prompt: "I find it difficult to step back from monitoring another person's risks.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-hypervigilant-one-relational-scanning ───────

  // hypervigilant-mood-scanner
  {
    id: "expression-screen-hypervigilant-mood-scanner-01",
    expressionId: "hypervigilant-mood-scanner",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 1,
    prompt: "I quickly notice small shifts in another person's emotional tone.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-mood-scanner-02",
    expressionId: "hypervigilant-mood-scanner",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 2,
    prompt: "I monitor emotional tone before deciding how to respond.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-betrayal-scanner
  {
    id: "expression-screen-hypervigilant-betrayal-scanner-01",
    expressionId: "hypervigilant-betrayal-scanner",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 1,
    prompt: "I look for inconsistencies that might signal betrayal.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-betrayal-scanner-02",
    expressionId: "hypervigilant-betrayal-scanner",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 2,
    prompt: "I notice possible evidence that someone's loyalty has changed.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-ambiguous-signal-interpreter
  {
    id: "expression-screen-hypervigilant-ambiguous-signal-interpreter-01",
    expressionId: "hypervigilant-ambiguous-signal-interpreter",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 1,
    prompt: "I interpret an unclear response as a sign that something is wrong.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-ambiguous-signal-interpreter-02",
    expressionId: "hypervigilant-ambiguous-signal-interpreter",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 2,
    prompt: "I form a concerning explanation before enough information is available.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-weather-reporter
  {
    id: "expression-screen-hypervigilant-weather-reporter-01",
    expressionId: "hypervigilant-weather-reporter",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 1,
    prompt: "I notice shifts in the emotional atmosphere and name them aloud.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-weather-reporter-02",
    expressionId: "hypervigilant-weather-reporter",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 2,
    prompt: "I inform others about the emotional state I believe another person is in.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-hypervigilant-one-monitoring ────────────────

  // hypervigilant-body-monitor
  {
    id: "expression-screen-hypervigilant-body-monitor-01",
    expressionId: "hypervigilant-body-monitor",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 1,
    prompt: "I repeatedly check a bodily sensation for change.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-body-monitor-02",
    expressionId: "hypervigilant-body-monitor",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 2,
    prompt: "I pay close attention to physical signals even when no immediate action is required.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-digital-monitor
  {
    id: "expression-screen-hypervigilant-digital-monitor-01",
    expressionId: "hypervigilant-digital-monitor",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 1,
    prompt: "I repeatedly check whether another person is active or responsive online.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-digital-monitor-02",
    expressionId: "hypervigilant-digital-monitor",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 2,
    prompt: "I repeatedly examine digital information that is already lawfully visible to me for clues about what may be happening.",
    access: "pro",
    reverseScored: false,
  },

  // hypervigilant-substance-watcher
  {
    id: "expression-screen-hypervigilant-substance-watcher-01",
    expressionId: "hypervigilant-substance-watcher",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 1,
    prompt: "I watch for behavioral signs that someone may have used a substance.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-hypervigilant-substance-watcher-02",
    expressionId: "hypervigilant-substance-watcher",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 2,
    prompt: "I notice visible changes in a shared environment that might suggest substance use.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-entangled-one-proximity-pursuit ─────────────

  // entangled-pursuer
  {
    id: "expression-screen-entangled-pursuer-01",
    expressionId: "entangled-pursuer",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 1,
    prompt: "When another person becomes distant without setting a boundary, I increase my attempts to reconnect.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-pursuer-02",
    expressionId: "entangled-pursuer",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 2,
    prompt: "I feel driven to resolve distance before allowing the interaction to pause.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-appeaser
  {
    id: "expression-screen-entangled-appeaser-01",
    expressionId: "entangled-appeaser",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 1,
    prompt: "I give up a preference when another person seems upset even when expressing it would be reasonably safe.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-appeaser-02",
    expressionId: "entangled-appeaser",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 2,
    prompt: "I quickly agree in order to reduce tension.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-direction-dependent
  {
    id: "expression-screen-entangled-direction-dependent-01",
    expressionId: "entangled-direction-dependent",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 1,
    prompt: "I wait for another person's direction before making a personal choice.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-direction-dependent-02",
    expressionId: "entangled-direction-dependent",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 2,
    prompt: "I doubt my own direction when it differs from someone important.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-crisis-pair
  {
    id: "expression-screen-entangled-crisis-pair-01",
    expressionId: "entangled-crisis-pair",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 1,
    prompt: "I experience a temporary increase in closeness during urgent relational problems.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-crisis-pair-02",
    expressionId: "entangled-crisis-pair",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 2,
    prompt: "I return to closeness through repeated crisis-and-repair cycles.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-entangled-one-identity-merger ───────────────

  // entangled-rescuer
  {
    id: "expression-screen-entangled-rescuer-01",
    expressionId: "entangled-rescuer",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 1,
    prompt: "I step in quickly when someone close to me struggles even when they have not asked me to take over.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-rescuer-02",
    expressionId: "entangled-rescuer",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 2,
    prompt: "I feel responsible for fixing problems that belong primarily to someone else.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-mutual-monitor
  {
    id: "expression-screen-entangled-mutual-monitor-01",
    expressionId: "entangled-mutual-monitor",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 1,
    prompt: "I feel that staying close requires frequent updates about what each person is doing.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-mutual-monitor-02",
    expressionId: "entangled-mutual-monitor",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 2,
    prompt: "I feel uneasy when mutual checking or information-sharing decreases.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-identity-merger
  {
    id: "expression-screen-entangled-identity-merger-01",
    expressionId: "entangled-identity-merger",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 1,
    prompt: "I have difficulty identifying a preference that is separate from someone close to me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-identity-merger-02",
    expressionId: "entangled-identity-merger",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 2,
    prompt: "I feel that differences between me and someone close could threaten our closeness.",
    access: "pro",
    reverseScored: false,
  },

  // entangled-withdraw-return
  {
    id: "expression-screen-entangled-withdraw-return-01",
    expressionId: "entangled-withdraw-return",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 1,
    prompt: "I pull away when closeness starts to feel emotionally intense.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-entangled-withdraw-return-02",
    expressionId: "entangled-withdraw-return",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 2,
    prompt: "I return to renewed connection once the distance begins to feel painful.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-grief-bearer-unexpressed-delayed ────────────

  // grief-unexpressed
  {
    id: "expression-screen-grief-unexpressed-01",
    expressionId: "grief-unexpressed",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 1,
    prompt: "I feel grief without being able to express it clearly.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-unexpressed-02",
    expressionId: "grief-unexpressed",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 2,
    prompt: "I keep grief inside even when some expression would feel reasonably safe.",
    access: "pro",
    reverseScored: false,
  },

  // grief-silent-mourning
  {
    id: "expression-screen-grief-silent-mourning-01",
    expressionId: "grief-silent-mourning",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 1,
    prompt: "I carry grief privately rather than inviting others into the mourning process.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-silent-mourning-02",
    expressionId: "grief-silent-mourning",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 2,
    prompt: "I keep mourning separate from my ordinary relationships.",
    access: "pro",
    reverseScored: false,
  },

  // grief-later-emerging
  {
    id: "expression-screen-grief-later-emerging-01",
    expressionId: "grief-later-emerging",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 1,
    prompt: "I realize the emotional impact of a loss after significant time has passed.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-later-emerging-02",
    expressionId: "grief-later-emerging",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 2,
    prompt: "I experience grief more strongly after the immediate demands have settled.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-grief-bearer-loss-attachment ────────────────

  // grief-specific-loss
  {
    id: "expression-screen-grief-specific-loss-01",
    expressionId: "grief-specific-loss",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 1,
    prompt: "I repeatedly return emotionally to one particular loss.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-specific-loss-02",
    expressionId: "grief-specific-loss",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 2,
    prompt: "I experience current life through the absence of what was lost.",
    access: "pro",
    reverseScored: false,
  },

  // grief-loyalty-to-pain
  {
    id: "expression-screen-grief-loyalty-to-pain-01",
    expressionId: "grief-loyalty-to-pain",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 1,
    prompt: "I feel disloyal when the pain of a loss becomes less intense.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-loyalty-to-pain-02",
    expressionId: "grief-loyalty-to-pain",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 2,
    prompt: "I take ongoing pain as evidence that the loss still matters.",
    access: "pro",
    reverseScored: false,
  },

  // grief-protective-numbing
  {
    id: "expression-screen-grief-protective-numbing-01",
    expressionId: "grief-protective-numbing",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 1,
    prompt: "I notice myself becoming emotionally numb when grief begins to intensify.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-grief-protective-numbing-02",
    expressionId: "grief-protective-numbing",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 2,
    prompt: "I limit contact with reminders because the emotional impact feels too large.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-martyr-overgiving-depletion ────────────────

  // martyr-over-giver
  {
    id: "expression-screen-martyr-over-giver-01",
    expressionId: "martyr-over-giver",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 1,
    prompt: "I continue giving even when my own energy is running low.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-over-giver-02",
    expressionId: "martyr-over-giver",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 2,
    prompt: "I offer more help than was requested or required.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-silent-sufferer
  {
    id: "expression-screen-martyr-silent-sufferer-01",
    expressionId: "martyr-silent-sufferer",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 1,
    prompt: "I continue through strain without naming the personal cost even when doing so would be reasonably safe.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-silent-sufferer-02",
    expressionId: "martyr-silent-sufferer",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 2,
    prompt: "I hope others will notice my sacrifice without being told.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-refuses-to-receive
  {
    id: "expression-screen-martyr-refuses-to-receive-01",
    expressionId: "martyr-refuses-to-receive",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 1,
    prompt: "I turn down available help even when I am strained.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-refuses-to-receive-02",
    expressionId: "martyr-refuses-to-receive",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 2,
    prompt: "I feel more comfortable giving support than receiving it.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-martyr-recognition-reciprocity ─────────────

  // martyr-scorekeeper
  {
    id: "expression-screen-martyr-scorekeeper-01",
    expressionId: "martyr-scorekeeper",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 1,
    prompt: "I keep a mental record of the sacrifices I have made for others.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-scorekeeper-02",
    expressionId: "martyr-scorekeeper",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 2,
    prompt: "I compare my contribution with what others have given.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-guilt-tripper
  {
    id: "expression-screen-martyr-guilt-tripper-01",
    expressionId: "martyr-guilt-tripper",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 1,
    prompt: "I emphasize my personal sacrifice when I disagree with someone.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-guilt-tripper-02",
    expressionId: "martyr-guilt-tripper",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 2,
    prompt: "I emphasize my disappointment to influence another person's choice.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-martyr-overfunctioning-crisis ───────────────

  // martyr-overfunctioning
  {
    id: "expression-screen-martyr-overfunctioning-01",
    expressionId: "martyr-overfunctioning",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "I automatically take over when something needs to be done.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-overfunctioning-02",
    expressionId: "martyr-overfunctioning",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "I carry responsibilities that could reasonably be shared.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-rescuer-martyr
  {
    id: "expression-screen-martyr-rescuer-martyr-01",
    expressionId: "martyr-rescuer-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "I rescue others at a significant personal cost to myself.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-rescuer-martyr-02",
    expressionId: "martyr-rescuer-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "I feel overlooked after repeatedly stepping in to help.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-moral-martyr
  {
    id: "expression-screen-martyr-moral-martyr-01",
    expressionId: "martyr-moral-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "I view my willingness to sacrifice as proof of my moral character.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-moral-martyr-02",
    expressionId: "martyr-moral-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "I see people who set limits as less committed than I am.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-crisis-martyr
  {
    id: "expression-screen-martyr-crisis-martyr-01",
    expressionId: "martyr-crisis-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "I take on a central burden during crisis even when support could be shared.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-crisis-martyr-02",
    expressionId: "martyr-crisis-martyr",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "I feel especially necessary when others are overwhelmed.",
    access: "pro",
    reverseScored: false,
  },

  // martyr-burnout-blame
  {
    id: "expression-screen-martyr-burnout-blame-01",
    expressionId: "martyr-burnout-blame",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "I continue carrying too much until resentment builds.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-martyr-burnout-blame-02",
    expressionId: "martyr-burnout-blame",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "After exceeding my limits, I focus on how others allowed the burden to continue.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-rescuer-intervention-fixing ────────────────

  // rescuer-fixer
  {
    id: "expression-screen-rescuer-fixer-01",
    expressionId: "rescuer-fixer",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 1,
    prompt: "I move quickly from hearing a problem to trying to solve it.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-fixer-02",
    expressionId: "rescuer-fixer",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 2,
    prompt: "I take over solving a practical problem that primarily belongs to someone else.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-crisis-rescuer
  {
    id: "expression-screen-rescuer-crisis-rescuer-01",
    expressionId: "rescuer-crisis-rescuer",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 1,
    prompt: "I step quickly into another person's urgent situation.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-crisis-rescuer-02",
    expressionId: "rescuer-crisis-rescuer",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 2,
    prompt: "I feel especially useful when someone else is in crisis.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-advice-giver
  {
    id: "expression-screen-rescuer-advice-giver-01",
    expressionId: "rescuer-advice-giver",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 1,
    prompt: "I offer suggestions before finding out whether the other person wants advice.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-advice-giver-02",
    expressionId: "rescuer-advice-giver",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 2,
    prompt: "I continue explaining what someone should do after they have not asked for direction.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-emotional-paramedic
  {
    id: "expression-screen-rescuer-emotional-paramedic-01",
    expressionId: "rescuer-emotional-paramedic",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 1,
    prompt: "I feel compelled to reduce another person's emotional distress.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-emotional-paramedic-02",
    expressionId: "rescuer-emotional-paramedic",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 2,
    prompt: "I take responsibility for restoring another person's emotional stability.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-rescuer-consequence-prevention ─────────────

  // rescuer-consequence-blocker
  {
    id: "expression-screen-rescuer-consequence-blocker-01",
    expressionId: "rescuer-consequence-blocker",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 1,
    prompt: "I step in so another person does not face an outcome tied to their choice.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-consequence-blocker-02",
    expressionId: "rescuer-consequence-blocker",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 2,
    prompt: "I repair a problem before the other person has to address it.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-financial-rescuer
  {
    id: "expression-screen-rescuer-financial-rescuer-01",
    expressionId: "rescuer-financial-rescuer",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 1,
    prompt: "I use my money to stabilize another person's recurring difficulties.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-financial-rescuer-02",
    expressionId: "rescuer-financial-rescuer",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 2,
    prompt: "I use my financial resources to help another person even when doing so places meaningful strain on me.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-protective-parent
  {
    id: "expression-screen-rescuer-protective-parent-01",
    expressionId: "rescuer-protective-parent",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 1,
    prompt: "I step in to prevent a capable person from facing manageable difficulty.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-protective-parent-02",
    expressionId: "rescuer-protective-parent",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 2,
    prompt: "I take protective action before a capable person has had a chance to handle a manageable difficulty.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-rescuer-indispensable-helper ───────────────

  // rescuer-indispensable-one
  {
    id: "expression-screen-rescuer-indispensable-one-01",
    expressionId: "rescuer-indispensable-one",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 1,
    prompt: "I feel especially important when another person relies heavily on my help.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-indispensable-one-02",
    expressionId: "rescuer-indispensable-one",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 2,
    prompt: "I feel unsettled when someone no longer needs as much of my help.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-white-knight
  {
    id: "expression-screen-rescuer-white-knight-01",
    expressionId: "rescuer-white-knight",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 1,
    prompt: "I feel compelled to become the person who saves someone from hardship.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-white-knight-02",
    expressionId: "rescuer-white-knight",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 2,
    prompt: "I experience strong purpose when defending someone I see as vulnerable.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-professional-helper
  {
    id: "expression-screen-rescuer-professional-helper-01",
    expressionId: "rescuer-professional-helper",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 1,
    prompt: "I move into an expert role during ordinary personal interactions.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-professional-helper-02",
    expressionId: "rescuer-professional-helper",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 2,
    prompt: "I rely on my knowledge or experience to guide someone without a clear request.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-recovery-manager
  {
    id: "expression-screen-rescuer-recovery-manager-01",
    expressionId: "rescuer-recovery-manager",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 1,
    prompt: "I keep track of whether another person is following a recovery plan even when I am not responsible for managing it.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-recovery-manager-02",
    expressionId: "rescuer-recovery-manager",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 2,
    prompt: "I feel responsible for keeping another person's recovery on course.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-rescuer-hidden-contract-control ────────────

  // rescuer-overfunctioner
  {
    id: "expression-screen-rescuer-overfunctioner-01",
    expressionId: "rescuer-overfunctioner",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 1,
    prompt: "I take over tasks for others because doing it myself feels easier.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-overfunctioner-02",
    expressionId: "rescuer-overfunctioner",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 2,
    prompt: "I take control of a task because I believe doing so will help.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-hidden-contract-helper
  {
    id: "expression-screen-rescuer-hidden-contract-helper-01",
    expressionId: "rescuer-hidden-contract-helper",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 1,
    prompt: "I hope helping someone will lead them to respond to me in a particular way.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-hidden-contract-helper-02",
    expressionId: "rescuer-hidden-contract-helper",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 2,
    prompt: "I become upset when the unstated return I expected does not happen.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-to-control
  {
    id: "expression-screen-rescuer-to-control-01",
    expressionId: "rescuer-to-control",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 1,
    prompt: "I expect helping someone to give me more influence over what they decide.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-to-control-02",
    expressionId: "rescuer-to-control",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 2,
    prompt: "I refer back to my prior help when someone makes a choice I disagree with.",
    access: "pro",
    reverseScored: false,
  },

  // rescuer-to-martyr
  {
    id: "expression-screen-rescuer-to-martyr-01",
    expressionId: "rescuer-to-martyr",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 1,
    prompt: "I step in willingly and later feel trapped by the responsibility.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-rescuer-to-martyr-02",
    expressionId: "rescuer-to-martyr",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 2,
    prompt: "I move from helping into resentment about carrying too much.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-over-responsible-one-emotional-care ─────────

  // over-responsible-emotional-caretaker
  {
    id: "expression-screen-over-responsible-emotional-caretaker-01",
    expressionId: "over-responsible-emotional-caretaker",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 1,
    prompt: "I treat another person's mood as my personal responsibility.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-emotional-caretaker-02",
    expressionId: "over-responsible-emotional-caretaker",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 2,
    prompt: "I adjust my attention or behavior to keep someone else emotionally stable.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-peacekeeper
  {
    id: "expression-screen-over-responsible-peacekeeper-01",
    expressionId: "over-responsible-peacekeeper",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 1,
    prompt: "I step between people when tension between them rises.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-peacekeeper-02",
    expressionId: "over-responsible-peacekeeper",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 2,
    prompt: "I feel responsible for restoring calm between other people.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-parentified-one
  {
    id: "expression-screen-over-responsible-parentified-one-01",
    expressionId: "over-responsible-parentified-one",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 1,
    prompt: "I take on the mature caretaking role in relationships with other capable adults.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-parentified-one-02",
    expressionId: "over-responsible-parentified-one",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 2,
    prompt: "I carry decisions or care that reasonably belongs to someone with equal responsibility.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-family-stabilizer
  {
    id: "expression-screen-over-responsible-family-stabilizer-01",
    expressionId: "over-responsible-family-stabilizer",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 1,
    prompt: "I feel responsible for keeping my family or family-like group together.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-family-stabilizer-02",
    expressionId: "over-responsible-family-stabilizer",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 2,
    prompt: "I feel that the group may become unstable if I step back.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-over-responsible-one-guilt-blame ────────────

  // over-responsible-chronic-apologizer
  {
    id: "expression-screen-over-responsible-chronic-apologizer-01",
    expressionId: "over-responsible-chronic-apologizer",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 1,
    prompt: "I apologize before responsibility has been established.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-chronic-apologizer-02",
    expressionId: "over-responsible-chronic-apologizer",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 2,
    prompt: "I apologize to reduce tension even when my fault is limited.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-blame-taker
  {
    id: "expression-screen-over-responsible-blame-taker-01",
    expressionId: "over-responsible-blame-taker",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 1,
    prompt: "I assume personal fault when something goes wrong.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-blame-taker-02",
    expressionId: "over-responsible-blame-taker",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 2,
    prompt: "I accept blame to bring conflict or uncertainty to an end.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-responsibility-sponge
  {
    id: "expression-screen-over-responsible-responsibility-sponge-01",
    expressionId: "over-responsible-responsibility-sponge",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 1,
    prompt: "I feel responsible for problems involving several different people.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-responsibility-sponge-02",
    expressionId: "over-responsible-responsibility-sponge",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 2,
    prompt: "I assume responsibility simply because no one else is taking it.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-consequence-carrier
  {
    id: "expression-screen-over-responsible-consequence-carrier-01",
    expressionId: "over-responsible-consequence-carrier",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 1,
    prompt: "I take on a burden created by another person's decision.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-consequence-carrier-02",
    expressionId: "over-responsible-consequence-carrier",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 2,
    prompt: "I shield another person by personally carrying the result of their choices.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-over-responsible-one-boundary-rest ──────────

  // over-responsible-rest-guilty
  {
    id: "expression-screen-over-responsible-rest-guilty-01",
    expressionId: "over-responsible-rest-guilty",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 1,
    prompt: "I find it difficult to rest while something still needs attention.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-rest-guilty-02",
    expressionId: "over-responsible-rest-guilty",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 2,
    prompt: "I interpret rest as neglecting my responsibilities.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-boundary-guilty
  {
    id: "expression-screen-over-responsible-boundary-guilty-01",
    expressionId: "over-responsible-boundary-guilty",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 1,
    prompt: "I feel guilty after reasonably declining a request in a situation where doing so feels safe.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-boundary-guilty-02",
    expressionId: "over-responsible-boundary-guilty",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 2,
    prompt: "I feel responsible for another person's disappointment after setting a limit.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-survivor-guilt
  {
    id: "expression-screen-over-responsible-survivor-guilt-01",
    expressionId: "over-responsible-survivor-guilt",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 1,
    prompt: "I feel uncomfortable when I am doing better than someone who has struggled.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-survivor-guilt-02",
    expressionId: "over-responsible-survivor-guilt",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 2,
    prompt: "I feel that my personal relief is unfair while others remain burdened.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-over-responsible-one-anticipatory-moral ─────

  // over-responsible-mind-reader
  {
    id: "expression-screen-over-responsible-mind-reader-01",
    expressionId: "over-responsible-mind-reader",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 1,
    prompt: "I feel responsible for anticipating another person's needs before they are expressed.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-mind-reader-02",
    expressionId: "over-responsible-mind-reader",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 2,
    prompt: "I change my behavior based on an assumed expectation that has not been confirmed.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-preventer
  {
    id: "expression-screen-over-responsible-preventer-01",
    expressionId: "over-responsible-preventer",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 1,
    prompt: "I take responsibility for planning around possible problems that involve other people.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-preventer-02",
    expressionId: "over-responsible-preventer",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 2,
    prompt: "I feel responsible when a preventable problem occurs, even when ownership is unclear.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-moral-overcorrector
  {
    id: "expression-screen-over-responsible-moral-overcorrector-01",
    expressionId: "over-responsible-moral-overcorrector",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 1,
    prompt: "I make more repair than the situation reasonably requires.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-moral-overcorrector-02",
    expressionId: "over-responsible-moral-overcorrector",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 2,
    prompt: "I take extra responsibility to make sure others see me as fair and responsible.",
    access: "pro",
    reverseScored: false,
  },

  // over-responsible-confession-seeker
  {
    id: "expression-screen-over-responsible-confession-seeker-01",
    expressionId: "over-responsible-confession-seeker",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 1,
    prompt: "I feel pressure to disclose a possible mistake before its significance is clear.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-over-responsible-confession-seeker-02",
    expressionId: "over-responsible-confession-seeker",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 2,
    prompt: "I seek relief by telling someone about something that may not require disclosure.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-overloaded-one-capacity-backup ──────────────

  // overloaded-human-backup-system
  {
    id: "expression-screen-overloaded-human-backup-system-01",
    expressionId: "overloaded-human-backup-system",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 1,
    prompt: "I anticipate needing to finish what someone else leaves undone.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-human-backup-system-02",
    expressionId: "overloaded-human-backup-system",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 2,
    prompt: "I step in as the fallback after another person fails to follow through.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-default-adult
  {
    id: "expression-screen-overloaded-default-adult-01",
    expressionId: "overloaded-default-adult",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 1,
    prompt: "I become the person others expect to handle practical matters.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-default-adult-02",
    expressionId: "overloaded-default-adult",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 2,
    prompt: "I automatically manage routine responsibilities without explicit agreement.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-no-backup
  {
    id: "expression-screen-overloaded-no-backup-01",
    expressionId: "overloaded-no-backup",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 1,
    prompt: "I believe essential responsibilities will stop if I cannot continue.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-no-backup-02",
    expressionId: "overloaded-no-backup",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 2,
    prompt: "I feel unable to step away because no reliable substitute is available.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-overloaded-one-mental-load ──────────────────

  // overloaded-mental-load-carrier
  {
    id: "expression-screen-overloaded-mental-load-carrier-01",
    expressionId: "overloaded-mental-load-carrier",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 1,
    prompt: "I mentally track tasks that other people may not notice.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-mental-load-carrier-02",
    expressionId: "overloaded-mental-load-carrier",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 2,
    prompt: "I feel responsible for remembering what needs to happen next.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-cannot-delegate
  {
    id: "expression-screen-overloaded-cannot-delegate-01",
    expressionId: "overloaded-cannot-delegate",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 1,
    prompt: "I keep responsibility for a task when I do not trust another person to handle it reliably.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-cannot-delegate-02",
    expressionId: "overloaded-cannot-delegate",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 2,
    prompt: "I closely retain oversight after assigning a task to someone else.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-competence-trap
  {
    id: "expression-screen-overloaded-competence-trap-01",
    expressionId: "overloaded-competence-trap",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 1,
    prompt: "I am given more work because others expect me to handle it well.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-competence-trap-02",
    expressionId: "overloaded-competence-trap",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 2,
    prompt: "I feel that doing something well leads to becoming responsible for it again.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-overloaded-one-crisis-stop-resume ───────────

  // overloaded-crisis-juggler
  {
    id: "expression-screen-overloaded-crisis-juggler-01",
    expressionId: "overloaded-crisis-juggler",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 1,
    prompt: "I handle multiple urgent problems at the same time.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-crisis-juggler-02",
    expressionId: "overloaded-crisis-juggler",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 2,
    prompt: "I shift rapidly between crises while remaining responsible for all of them.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-capacity-denier
  {
    id: "expression-screen-overloaded-capacity-denier-01",
    expressionId: "overloaded-capacity-denier",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 1,
    prompt: "I continue despite clear signs that my capacity is limited.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-capacity-denier-02",
    expressionId: "overloaded-capacity-denier",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 2,
    prompt: "I treat my personal limits as obstacles to push through.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-last-minute-preventer
  {
    id: "expression-screen-overloaded-last-minute-preventer-01",
    expressionId: "overloaded-last-minute-preventer",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 1,
    prompt: "I intervene when someone else's unfinished responsibility is close to failing.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-last-minute-preventer-02",
    expressionId: "overloaded-last-minute-preventer",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 2,
    prompt: "I repeatedly rescue deadlines or obligations at the final moment.",
    access: "pro",
    reverseScored: false,
  },

  // overloaded-stop-then-resume
  {
    id: "expression-screen-overloaded-stop-then-resume-01",
    expressionId: "overloaded-stop-then-resume",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 1,
    prompt: "I stop only when continuing becomes impossible.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-overloaded-stop-then-resume-02",
    expressionId: "overloaded-stop-then-resume",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 2,
    prompt: "I resume the same level of responsibility after a brief recovery.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-perfectionist-standards-evaluation ─────────

  // perfectionist-endless-reviser
  {
    id: "expression-screen-perfectionist-endless-reviser-01",
    expressionId: "perfectionist-endless-reviser",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 1,
    prompt: "I continue making changes to work that already meets its purpose.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perfectionist-endless-reviser-02",
    expressionId: "perfectionist-endless-reviser",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 2,
    prompt: "I delay completion because another revision still seems necessary.",
    access: "pro",
    reverseScored: false,
  },

  // perfectionist-moving-goalpost
  {
    id: "expression-screen-perfectionist-moving-goalpost-01",
    expressionId: "perfectionist-moving-goalpost",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 1,
    prompt: "I decide that a goal I have already met is no longer enough.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perfectionist-moving-goalpost-02",
    expressionId: "perfectionist-moving-goalpost",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 2,
    prompt: "I create a stricter success standard after meeting the original one.",
    access: "pro",
    reverseScored: false,
  },

  // perfectionist-all-or-nothing-evaluator
  {
    id: "expression-screen-perfectionist-all-or-nothing-evaluator-01",
    expressionId: "perfectionist-all-or-nothing-evaluator",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 1,
    prompt: "I interpret an imperfect result as a failure.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perfectionist-all-or-nothing-evaluator-02",
    expressionId: "perfectionist-all-or-nothing-evaluator",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 2,
    prompt: "I discount meaningful progress because the final outcome is incomplete.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-perfectionist-performance-exposure ─────────

  // perfectionist-beginner-avoider
  {
    id: "expression-screen-perfectionist-beginner-avoider-01",
    expressionId: "perfectionist-beginner-avoider",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 1,
    prompt: "I avoid starting when early mistakes may be visible.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perfectionist-beginner-avoider-02",
    expressionId: "perfectionist-beginner-avoider",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 2,
    prompt: "I prefer not to participate rather than appear inexperienced.",
    access: "pro",
    reverseScored: false,
  },

  // perfectionist-performance-curator
  {
    id: "expression-screen-perfectionist-performance-curator-01",
    expressionId: "perfectionist-performance-curator",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 1,
    prompt: "I withhold my work until it appears polished.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-perfectionist-performance-curator-02",
    expressionId: "perfectionist-performance-curator",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 2,
    prompt: "I selectively show successful attempts while keeping weaker ones private.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-anger-shield-explosive-contempt ────────────

  // anger-explosive-shield
  {
    id: "expression-screen-anger-explosive-shield-01",
    expressionId: "anger-explosive-shield",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 1,
    prompt: "My anger rises rapidly before I have time to reflect.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-explosive-shield-02",
    expressionId: "anger-explosive-shield",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 2,
    prompt: "My outward intensity becomes much stronger than the immediate situation.",
    access: "pro",
    reverseScored: false,
  },

  // anger-contempt-shield
  {
    id: "expression-screen-anger-contempt-shield-01",
    expressionId: "anger-contempt-shield",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 1,
    prompt: "During conflict, I dismiss another person's viewpoint as not worth serious consideration.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-contempt-shield-02",
    expressionId: "anger-contempt-shield",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 2,
    prompt: "I use dismissive judgment to avoid feeling affected by what someone says.",
    access: "pro",
    reverseScored: false,
  },

  // anger-intimidator
  {
    id: "expression-screen-anger-intimidator-01",
    expressionId: "anger-intimidator",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 1,
    prompt: "My intensity increases when I feel challenged, and the other person may back down.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-intimidator-02",
    expressionId: "anger-intimidator",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 2,
    prompt: "I notice that others become cautious because of my angry presence.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-anger-shield-cold-defensive ────────────────

  // anger-cold-shield
  {
    id: "expression-screen-anger-cold-shield-01",
    expressionId: "anger-cold-shield",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 1,
    prompt: "I become emotionally distant after feeling hurt.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-cold-shield-02",
    expressionId: "anger-cold-shield",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 2,
    prompt: "I become emotionally distant when further vulnerability feels difficult.",
    access: "pro",
    reverseScored: false,
  },

  // anger-defensive-debater
  {
    id: "expression-screen-anger-defensive-debater-01",
    expressionId: "anger-defensive-debater",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 1,
    prompt: "I shift quickly into argument when I receive criticism.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-defensive-debater-02",
    expressionId: "anger-defensive-debater",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 2,
    prompt: "I focus on disproving details before considering what the other person may be trying to communicate.",
    access: "pro",
    reverseScored: false,
  },

  // anger-passive-aggressive-shield
  {
    id: "expression-screen-anger-passive-aggressive-shield-01",
    expressionId: "anger-passive-aggressive-shield",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 1,
    prompt: "I make an indirect pointed remark instead of naming my anger directly.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-passive-aggressive-shield-02",
    expressionId: "anger-passive-aggressive-shield",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 2,
    prompt: "I express resistance indirectly enough that my meaning can remain unclear.",
    access: "pro",
    reverseScored: false,
  },

  // anger-grievance-keeper
  {
    id: "expression-screen-anger-grievance-keeper-01",
    expressionId: "anger-grievance-keeper",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 1,
    prompt: "I mentally preserve past injuries as warnings.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-grievance-keeper-02",
    expressionId: "anger-grievance-keeper",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 2,
    prompt: "I return to remembered unfairness during present conflict.",
    access: "pro",
    reverseScored: false,
  },

  // ── Group: expression-group-anger-shield-righteous-cycle ───────────────

  // anger-righteous-avenger
  {
    id: "expression-screen-anger-righteous-avenger-01",
    expressionId: "anger-righteous-avenger",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 1,
    prompt: "I feel that my anger gives me authority to confront perceived injustice.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-righteous-avenger-02",
    expressionId: "anger-righteous-avenger",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 2,
    prompt: "I view my anger as necessary to protect someone or enforce fairness.",
    access: "pro",
    reverseScored: false,
  },

  // anger-apology-cycle
  {
    id: "expression-screen-anger-apology-cycle-01",
    expressionId: "anger-apology-cycle",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 1,
    prompt: "I regret my angry intensity after I calm down.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-screen-anger-apology-cycle-02",
    expressionId: "anger-apology-cycle",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 2,
    prompt: "I apologize or try to repair things after anger escalates, but the same cycle later happens again.",
    access: "pro",
    reverseScored: false,
  },
];
