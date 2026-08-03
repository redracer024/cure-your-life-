/*
 * Expression Screening Groups
 *
 * These groups are internal routing metadata for the expression assessment
 * pipeline. They are not user-facing patterns, sub-patterns, or diagnoses.
 *
 * Each group collects 2-5 expressions under a shared parent (core or strategy
 * pattern). Groups are used to route users to focused screening for a subset
 * of related expressions after their primary pattern and strategy have been
 * identified.
 *
 * Group responses do NOT directly score individual Expressions. Instead, they
 * determine which Expression-specific screening and confirmation items are
 * presented during the Pro assessment flow.
 *
 * This registry will be populated in a later development chunk. It is
 * intentionally empty during the type and validation layer setup phase.
 */

import type { ExpressionScreeningGroup } from '../../types/expressionGrouping';

export const EXPRESSION_SCREENING_GROUPS: readonly ExpressionScreeningGroup[] = [
  // ── Silenced One ──────────────────────────────────────────────────────
  {
    id: "expression-group-silenced-one-conflict-suppression",
    parentId: "silenced-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "silenced-people-pleaser",
      "silenced-conflict-avoider",
      "silenced-tension-and-silence",
    ],
    expressionOrder: {
      "silenced-people-pleaser": 1,
      "silenced-conflict-avoider": 2,
      "silenced-tension-and-silence": 3,
    },
  },
  {
    id: "expression-group-silenced-one-speech-emergence",
    parentId: "silenced-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "silenced-pressure-building-anger",
      "silenced-blurt-or-freeze",
      "silenced-explanation-flood",
    ],
    expressionOrder: {
      "silenced-pressure-building-anger": 1,
      "silenced-blurt-or-freeze": 2,
      "silenced-explanation-flood": 3,
    },
  },

  // ── Unheld One ────────────────────────────────────────────────────────
  {
    id: "expression-group-unheld-one-attachment-alarm-and-return",
    parentId: "unheld-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "unheld-attachment-alarm",
      "unheld-reassurance-seeker",
      "unheld-return-tester",
    ],
    expressionOrder: {
      "unheld-attachment-alarm": 1,
      "unheld-reassurance-seeker": 2,
      "unheld-return-tester": 3,
    },
  },
  {
    id: "expression-group-unheld-one-relationship-threat-interpretation",
    parentId: "unheld-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "unheld-jealousy-interpreter",
      "unheld-conflict-for-contact",
      "unheld-relationship-threat-scanner",
    ],
    expressionOrder: {
      "unheld-jealousy-interpreter": 1,
      "unheld-conflict-for-contact": 2,
      "unheld-relationship-threat-scanner": 3,
    },
  },

  // ── Invisible One ─────────────────────────────────────────────────────
  {
    id: "expression-group-invisible-one-presence-avoidance",
    parentId: "invisible-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "invisible-presence-minimizer",
      "invisible-background-positioner",
      "invisible-hidden-ambition",
    ],
    expressionOrder: {
      "invisible-presence-minimizer": 1,
      "invisible-background-positioner": 2,
      "invisible-hidden-ambition": 3,
    },
  },
  {
    id: "expression-group-invisible-one-recognition-conflict",
    parentId: "invisible-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "invisible-praise-deflector",
      "invisible-recognition-conflict",
      "invisible-approval-chameleon",
      "invisible-needs-concealer",
    ],
    expressionOrder: {
      "invisible-praise-deflector": 1,
      "invisible-recognition-conflict": 2,
      "invisible-approval-chameleon": 3,
      "invisible-needs-concealer": 4,
    },
  },

  // ── Shame Bearer ──────────────────────────────────────────────────────
  {
    id: "expression-group-shame-bearer-core-defectiveness",
    parentId: "shame-bearer",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "shame-defective-one",
      "shame-burden",
      "shame-imposter",
      "shame-comparison-prisoner",
    ],
    expressionOrder: {
      "shame-defective-one": 1,
      "shame-burden": 2,
      "shame-imposter": 3,
      "shame-comparison-prisoner": 4,
    },
  },
  {
    id: "expression-group-shame-bearer-exposure-concealment",
    parentId: "shame-bearer",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "shame-praise-disqualifier",
      "shame-secret-keeper",
      "shame-self-punisher",
    ],
    expressionOrder: {
      "shame-praise-disqualifier": 1,
      "shame-secret-keeper": 2,
      "shame-self-punisher": 3,
    },
  },
  {
    id: "expression-group-shame-bearer-shame-expression-channels",
    parentId: "shame-bearer",
    parentType: "core",
    groupOrder: 3,
    expressionIds: [
      "shame-to-perfection",
      "shame-to-anger",
      "shame-to-disappearance",
      "shame-chronic-apologizer",
      "shame-confession-loop",
    ],
    expressionOrder: {
      "shame-to-perfection": 1,
      "shame-to-anger": 2,
      "shame-to-disappearance": 3,
      "shame-chronic-apologizer": 4,
      "shame-confession-loop": 5,
    },
  },
  {
    id: "expression-group-shame-bearer-body-moral-condemnation",
    parentId: "shame-bearer",
    parentType: "core",
    groupOrder: 4,
    expressionIds: [
      "shame-body-shamed-self",
      "shame-morally-condemned-self",
    ],
    expressionOrder: {
      "shame-body-shamed-self": 1,
      "shame-morally-condemned-self": 2,
    },
  },

  // ── Controller ────────────────────────────────────────────────────────
  {
    id: "expression-group-controller-standards-evaluation",
    parentId: "controller",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "controller-standard-enforcer",
      "controller-constant-evaluator",
      "controller-proving-achiever",
    ],
    expressionOrder: {
      "controller-standard-enforcer": 1,
      "controller-constant-evaluator": 2,
      "controller-proving-achiever": 3,
    },
  },
  {
    id: "expression-group-controller-situation-management",
    parentId: "controller",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "controller-control-scanner",
      "controller-analysis-gatekeeper",
      "controller-fixed-plan",
      "controller-perception-manager",
    ],
    expressionOrder: {
      "controller-control-scanner": 1,
      "controller-analysis-gatekeeper": 2,
      "controller-fixed-plan": 3,
      "controller-perception-manager": 4,
    },
  },

  // ── Avoidant One ──────────────────────────────────────────────────────
  {
    id: "expression-group-avoidant-one-delay-distraction",
    parentId: "avoidant-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "avoidant-procrastinator",
      "avoidant-distractor",
      "avoidant-busy-avoider",
      "avoidant-intellectualizer",
    ],
    expressionOrder: {
      "avoidant-procrastinator": 1,
      "avoidant-distractor": 2,
      "avoidant-busy-avoider": 3,
      "avoidant-intellectualizer": 4,
    },
  },
  {
    id: "expression-group-avoidant-one-withdrawal-disappearance",
    parentId: "avoidant-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "avoidant-emotional-evader",
      "avoidant-ghost",
      "avoidant-sleep-disappear",
      "avoidant-pleasure-avoider",
    ],
    expressionOrder: {
      "avoidant-emotional-evader": 1,
      "avoidant-ghost": 2,
      "avoidant-sleep-disappear": 3,
      "avoidant-pleasure-avoider": 4,
    },
  },
  {
    id: "expression-group-avoidant-one-decision-commitment",
    parentId: "avoidant-one",
    parentType: "core",
    groupOrder: 3,
    expressionIds: [
      "avoidant-indecisive-one",
      "avoidant-commitment-dodger",
      "avoidant-perpetual-researcher",
      "avoidant-crisis-creator",
    ],
    expressionOrder: {
      "avoidant-indecisive-one": 1,
      "avoidant-commitment-dodger": 2,
      "avoidant-perpetual-researcher": 3,
      "avoidant-crisis-creator": 4,
    },
  },

  // ── Hypervigilant One ──────────────────────────────────────────────────
  {
    id: "expression-group-hypervigilant-one-anticipatory-threat",
    parentId: "hypervigilant-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "hypervigilant-threat-forecaster",
      "hypervigilant-conflict-predictor",
      "hypervigilant-worst-case-rehearser",
      "hypervigilant-loss-forecaster",
    ],
    expressionOrder: {
      "hypervigilant-threat-forecaster": 1,
      "hypervigilant-conflict-predictor": 2,
      "hypervigilant-worst-case-rehearser": 3,
      "hypervigilant-loss-forecaster": 4,
    },
  },
  {
    id: "expression-group-hypervigilant-one-preparedness-exit",
    parentId: "hypervigilant-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "hypervigilant-exit-planner",
      "hypervigilant-emergency-preparer",
      "hypervigilant-sleepless-guard",
      "hypervigilant-protective-parent",
    ],
    expressionOrder: {
      "hypervigilant-exit-planner": 1,
      "hypervigilant-emergency-preparer": 2,
      "hypervigilant-sleepless-guard": 3,
      "hypervigilant-protective-parent": 4,
    },
  },
  {
    id: "expression-group-hypervigilant-one-relational-scanning",
    parentId: "hypervigilant-one",
    parentType: "core",
    groupOrder: 3,
    expressionIds: [
      "hypervigilant-mood-scanner",
      "hypervigilant-betrayal-scanner",
      "hypervigilant-ambiguous-signal-interpreter",
      "hypervigilant-weather-reporter",
    ],
    expressionOrder: {
      "hypervigilant-mood-scanner": 1,
      "hypervigilant-betrayal-scanner": 2,
      "hypervigilant-ambiguous-signal-interpreter": 3,
      "hypervigilant-weather-reporter": 4,
    },
  },
  {
    id: "expression-group-hypervigilant-one-monitoring",
    parentId: "hypervigilant-one",
    parentType: "core",
    groupOrder: 4,
    expressionIds: [
      "hypervigilant-body-monitor",
      "hypervigilant-digital-monitor",
      "hypervigilant-substance-watcher",
    ],
    expressionOrder: {
      "hypervigilant-body-monitor": 1,
      "hypervigilant-digital-monitor": 2,
      "hypervigilant-substance-watcher": 3,
    },
  },

  // ── Entangled One ─────────────────────────────────────────────────────
  {
    id: "expression-group-entangled-one-proximity-pursuit",
    parentId: "entangled-one",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "entangled-pursuer",
      "entangled-appeaser",
      "entangled-direction-dependent",
      "entangled-crisis-pair",
    ],
    expressionOrder: {
      "entangled-pursuer": 1,
      "entangled-appeaser": 2,
      "entangled-direction-dependent": 3,
      "entangled-crisis-pair": 4,
    },
  },
  {
    id: "expression-group-entangled-one-identity-merger",
    parentId: "entangled-one",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "entangled-rescuer",
      "entangled-mutual-monitor",
      "entangled-identity-merger",
      "entangled-withdraw-return",
    ],
    expressionOrder: {
      "entangled-rescuer": 1,
      "entangled-mutual-monitor": 2,
      "entangled-identity-merger": 3,
      "entangled-withdraw-return": 4,
    },
  },

  // ── Grief Bearer ──────────────────────────────────────────────────────
  {
    id: "expression-group-grief-bearer-unexpressed-delayed",
    parentId: "grief-bearer",
    parentType: "core",
    groupOrder: 1,
    expressionIds: [
      "grief-unexpressed",
      "grief-silent-mourning",
      "grief-later-emerging",
    ],
    expressionOrder: {
      "grief-unexpressed": 1,
      "grief-silent-mourning": 2,
      "grief-later-emerging": 3,
    },
  },
  {
    id: "expression-group-grief-bearer-loss-attachment",
    parentId: "grief-bearer",
    parentType: "core",
    groupOrder: 2,
    expressionIds: [
      "grief-specific-loss",
      "grief-loyalty-to-pain",
      "grief-protective-numbing",
    ],
    expressionOrder: {
      "grief-specific-loss": 1,
      "grief-loyalty-to-pain": 2,
      "grief-protective-numbing": 3,
    },
  },

  // ── Martyr ────────────────────────────────────────────────────────────
  {
    id: "expression-group-martyr-overgiving-depletion",
    parentId: "martyr",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "martyr-over-giver",
      "martyr-silent-sufferer",
      "martyr-refuses-to-receive",
    ],
    expressionOrder: {
      "martyr-over-giver": 1,
      "martyr-silent-sufferer": 2,
      "martyr-refuses-to-receive": 3,
    },
  },
  {
    id: "expression-group-martyr-recognition-reciprocity",
    parentId: "martyr",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "martyr-scorekeeper",
      "martyr-guilt-tripper",
    ],
    expressionOrder: {
      "martyr-scorekeeper": 1,
      "martyr-guilt-tripper": 2,
    },
  },
  {
    id: "expression-group-martyr-overfunctioning-crisis",
    parentId: "martyr",
    parentType: "strategy",
    groupOrder: 3,
    expressionIds: [
      "martyr-overfunctioning",
      "martyr-rescuer-martyr",
      "martyr-moral-martyr",
      "martyr-crisis-martyr",
      "martyr-burnout-blame",
    ],
    expressionOrder: {
      "martyr-overfunctioning": 1,
      "martyr-rescuer-martyr": 2,
      "martyr-moral-martyr": 3,
      "martyr-crisis-martyr": 4,
      "martyr-burnout-blame": 5,
    },
  },

  // ── Rescuer ───────────────────────────────────────────────────────────
  {
    id: "expression-group-rescuer-intervention-fixing",
    parentId: "rescuer",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "rescuer-fixer",
      "rescuer-crisis-rescuer",
      "rescuer-advice-giver",
      "rescuer-emotional-paramedic",
    ],
    expressionOrder: {
      "rescuer-fixer": 1,
      "rescuer-crisis-rescuer": 2,
      "rescuer-advice-giver": 3,
      "rescuer-emotional-paramedic": 4,
    },
  },
  {
    id: "expression-group-rescuer-consequence-prevention",
    parentId: "rescuer",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "rescuer-consequence-blocker",
      "rescuer-financial-rescuer",
      "rescuer-protective-parent",
    ],
    expressionOrder: {
      "rescuer-consequence-blocker": 1,
      "rescuer-financial-rescuer": 2,
      "rescuer-protective-parent": 3,
    },
  },
  {
    id: "expression-group-rescuer-indispensable-helper",
    parentId: "rescuer",
    parentType: "strategy",
    groupOrder: 3,
    expressionIds: [
      "rescuer-indispensable-one",
      "rescuer-white-knight",
      "rescuer-professional-helper",
      "rescuer-recovery-manager",
    ],
    expressionOrder: {
      "rescuer-indispensable-one": 1,
      "rescuer-white-knight": 2,
      "rescuer-professional-helper": 3,
      "rescuer-recovery-manager": 4,
    },
  },
  {
    id: "expression-group-rescuer-hidden-contract-control",
    parentId: "rescuer",
    parentType: "strategy",
    groupOrder: 4,
    expressionIds: [
      "rescuer-overfunctioner",
      "rescuer-hidden-contract-helper",
      "rescuer-to-control",
      "rescuer-to-martyr",
    ],
    expressionOrder: {
      "rescuer-overfunctioner": 1,
      "rescuer-hidden-contract-helper": 2,
      "rescuer-to-control": 3,
      "rescuer-to-martyr": 4,
    },
  },

  // ── Over-Responsible One ──────────────────────────────────────────────
  {
    id: "expression-group-over-responsible-one-emotional-care",
    parentId: "over-responsible-one",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "over-responsible-emotional-caretaker",
      "over-responsible-peacekeeper",
      "over-responsible-parentified-one",
      "over-responsible-family-stabilizer",
    ],
    expressionOrder: {
      "over-responsible-emotional-caretaker": 1,
      "over-responsible-peacekeeper": 2,
      "over-responsible-parentified-one": 3,
      "over-responsible-family-stabilizer": 4,
    },
  },
  {
    id: "expression-group-over-responsible-one-guilt-blame",
    parentId: "over-responsible-one",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "over-responsible-chronic-apologizer",
      "over-responsible-blame-taker",
      "over-responsible-responsibility-sponge",
      "over-responsible-consequence-carrier",
    ],
    expressionOrder: {
      "over-responsible-chronic-apologizer": 1,
      "over-responsible-blame-taker": 2,
      "over-responsible-responsibility-sponge": 3,
      "over-responsible-consequence-carrier": 4,
    },
  },
  {
    id: "expression-group-over-responsible-one-boundary-rest",
    parentId: "over-responsible-one",
    parentType: "strategy",
    groupOrder: 3,
    expressionIds: [
      "over-responsible-rest-guilty",
      "over-responsible-boundary-guilty",
      "over-responsible-survivor-guilt",
    ],
    expressionOrder: {
      "over-responsible-rest-guilty": 1,
      "over-responsible-boundary-guilty": 2,
      "over-responsible-survivor-guilt": 3,
    },
  },
  {
    id: "expression-group-over-responsible-one-anticipatory-moral",
    parentId: "over-responsible-one",
    parentType: "strategy",
    groupOrder: 4,
    expressionIds: [
      "over-responsible-mind-reader",
      "over-responsible-preventer",
      "over-responsible-moral-overcorrector",
      "over-responsible-confession-seeker",
    ],
    expressionOrder: {
      "over-responsible-mind-reader": 1,
      "over-responsible-preventer": 2,
      "over-responsible-moral-overcorrector": 3,
      "over-responsible-confession-seeker": 4,
    },
  },

  // ── Overloaded One ────────────────────────────────────────────────────
  {
    id: "expression-group-overloaded-one-capacity-backup",
    parentId: "overloaded-one",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "overloaded-human-backup-system",
      "overloaded-default-adult",
      "overloaded-no-backup",
    ],
    expressionOrder: {
      "overloaded-human-backup-system": 1,
      "overloaded-default-adult": 2,
      "overloaded-no-backup": 3,
    },
  },
  {
    id: "expression-group-overloaded-one-mental-load",
    parentId: "overloaded-one",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "overloaded-mental-load-carrier",
      "overloaded-cannot-delegate",
      "overloaded-competence-trap",
    ],
    expressionOrder: {
      "overloaded-mental-load-carrier": 1,
      "overloaded-cannot-delegate": 2,
      "overloaded-competence-trap": 3,
    },
  },
  {
    id: "expression-group-overloaded-one-crisis-stop-resume",
    parentId: "overloaded-one",
    parentType: "strategy",
    groupOrder: 3,
    expressionIds: [
      "overloaded-crisis-juggler",
      "overloaded-capacity-denier",
      "overloaded-last-minute-preventer",
      "overloaded-stop-then-resume",
    ],
    expressionOrder: {
      "overloaded-crisis-juggler": 1,
      "overloaded-capacity-denier": 2,
      "overloaded-last-minute-preventer": 3,
      "overloaded-stop-then-resume": 4,
    },
  },

  // ── Perfectionist ─────────────────────────────────────────────────────
  {
    id: "expression-group-perfectionist-standards-evaluation",
    parentId: "perfectionist",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "perfectionist-endless-reviser",
      "perfectionist-moving-goalpost",
      "perfectionist-all-or-nothing-evaluator",
    ],
    expressionOrder: {
      "perfectionist-endless-reviser": 1,
      "perfectionist-moving-goalpost": 2,
      "perfectionist-all-or-nothing-evaluator": 3,
    },
  },
  {
    id: "expression-group-perfectionist-performance-exposure",
    parentId: "perfectionist",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "perfectionist-beginner-avoider",
      "perfectionist-performance-curator",
    ],
    expressionOrder: {
      "perfectionist-beginner-avoider": 1,
      "perfectionist-performance-curator": 2,
    },
  },

  // ── Anger Shield ──────────────────────────────────────────────────────
  {
    id: "expression-group-anger-shield-explosive-contempt",
    parentId: "anger-shield",
    parentType: "strategy",
    groupOrder: 1,
    expressionIds: [
      "anger-explosive-shield",
      "anger-contempt-shield",
      "anger-intimidator",
    ],
    expressionOrder: {
      "anger-explosive-shield": 1,
      "anger-contempt-shield": 2,
      "anger-intimidator": 3,
    },
  },
  {
    id: "expression-group-anger-shield-cold-defensive",
    parentId: "anger-shield",
    parentType: "strategy",
    groupOrder: 2,
    expressionIds: [
      "anger-cold-shield",
      "anger-defensive-debater",
      "anger-passive-aggressive-shield",
      "anger-grievance-keeper",
    ],
    expressionOrder: {
      "anger-cold-shield": 1,
      "anger-defensive-debater": 2,
      "anger-passive-aggressive-shield": 3,
      "anger-grievance-keeper": 4,
    },
  },
  {
    id: "expression-group-anger-shield-righteous-cycle",
    parentId: "anger-shield",
    parentType: "strategy",
    groupOrder: 3,
    expressionIds: [
      "anger-righteous-avenger",
      "anger-apology-cycle",
    ],
    expressionOrder: {
      "anger-righteous-avenger": 1,
      "anger-apology-cycle": 2,
    },
  },
];
