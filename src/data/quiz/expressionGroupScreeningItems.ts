import type { ExpressionGroupItemDefinition } from '../../types/expressionGroupScreening';

export const EXPRESSION_GROUP_SCREENING_ITEMS: readonly ExpressionGroupItemDefinition[] = [
  {
    id: "expression-group-screen-silenced-one-conflict-suppression-01",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 1,
    prompt: "I hold back what I really think when I sense disagreement coming.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-silenced-one-conflict-suppression-02",
    groupId: "expression-group-silenced-one-conflict-suppression",
    itemNumber: 2,
    prompt: "I go quiet when tension rises in a conversation.",
    access: "pro",
    reverseScored: false,
  },

  {
    id: "expression-group-screen-silenced-one-speech-emergence-01",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 1,
    prompt: "I feel pressure building inside before I finally speak.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-silenced-one-speech-emergence-02",
    groupId: "expression-group-silenced-one-speech-emergence",
    itemNumber: 2,
    prompt: "After holding things in, speaking can feel hard to control.",
    access: "pro",
    reverseScored: false,
  },

  {
    id: "expression-group-screen-unheld-one-attachment-alarm-and-return-01",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 1,
    prompt: "I worry that important people in my life might not stay close.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-unheld-one-attachment-alarm-and-return-02",
    groupId: "expression-group-unheld-one-attachment-alarm-and-return",
    itemNumber: 2,
    prompt: "I check for signs that someone is still there for me.",
    access: "pro",
    reverseScored: false,
  },

  {
    id: "expression-group-screen-unheld-one-relationship-threat-interpretation-01",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 1,
    prompt: "I read small changes in a relationship as signs of disconnection.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-unheld-one-relationship-threat-interpretation-02",
    groupId: "expression-group-unheld-one-relationship-threat-interpretation",
    itemNumber: 2,
    prompt: "When I sense distance in a relationship, I feel driven to restore the connection right away.",
    access: "pro",
    reverseScored: false,
  },

  {
    id: "expression-group-screen-invisible-one-presence-avoidance-01",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 1,
    prompt: "I make myself less noticeable when being seen or evaluated feels uncomfortable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-invisible-one-presence-avoidance-02",
    groupId: "expression-group-invisible-one-presence-avoidance",
    itemNumber: 2,
    prompt: "I keep my ambitions to myself to avoid drawing attention.",
    access: "pro",
    reverseScored: false,
  },

  {
    id: "expression-group-screen-invisible-one-recognition-conflict-01",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 1,
    prompt: "I feel uncomfortable when people openly recognize or praise me.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-invisible-one-recognition-conflict-02",
    groupId: "expression-group-invisible-one-recognition-conflict",
    itemNumber: 2,
    prompt: "I adjust how I present myself to fit what others seem to want.",
    access: "pro",
    reverseScored: false,
  },

  // ── Shame Bearer: Core Defectiveness ───────────────────────────
  {
    id: "expression-group-screen-shame-bearer-core-defectiveness-01",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 1,
    prompt: "I feel like I am not good enough compared to other people.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-shame-bearer-core-defectiveness-02",
    groupId: "expression-group-shame-bearer-core-defectiveness",
    itemNumber: 2,
    prompt: "I question whether I deserve the place, support, or opportunities I have.",
    access: "pro",
    reverseScored: false,
  },

  // ── Shame Bearer: Exposure Concealment ─────────────────────────
  {
    id: "expression-group-screen-shame-bearer-exposure-concealment-01",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 1,
    prompt: "I hide parts of myself because I fear how others would react if they knew.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-shame-bearer-exposure-concealment-02",
    groupId: "expression-group-shame-bearer-exposure-concealment",
    itemNumber: 2,
    prompt: "When I notice a flaw in myself, positive feedback becomes hard to accept.",
    access: "pro",
    reverseScored: false,
  },

  // ── Shame Bearer: Shame Expression Channels ────────────────────
  {
    id: "expression-group-screen-shame-bearer-shame-expression-channels-01",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 1,
    prompt: "When I feel ashamed or exposed, my response becomes stronger than the situation seems to call for.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-shame-bearer-shame-expression-channels-02",
    groupId: "expression-group-shame-bearer-shame-expression-channels",
    itemNumber: 2,
    prompt: "When I feel at fault, I feel driven to do something quickly to relieve the shame.",
    access: "pro",
    reverseScored: false,
  },

  // ── Shame Bearer: Body and Moral Condemnation ──────────────────
  {
    id: "expression-group-screen-shame-bearer-body-moral-condemnation-01",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 1,
    prompt: "I feel deep shame about parts of myself that seem unacceptable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-shame-bearer-body-moral-condemnation-02",
    groupId: "expression-group-shame-bearer-body-moral-condemnation",
    itemNumber: 2,
    prompt: "A flaw or mistake can make me judge my worth as a whole person.",
    access: "pro",
    reverseScored: false,
  },

  // ── Controller: Standards Evaluation ───────────────────────────
  {
    id: "expression-group-screen-controller-standards-evaluation-01",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 1,
    prompt: "I frequently evaluate whether my work or behavior measures up.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-controller-standards-evaluation-02",
    groupId: "expression-group-controller-standards-evaluation",
    itemNumber: 2,
    prompt: "I push myself to prove my abilities through achievements.",
    access: "pro",
    reverseScored: false,
  },

  // ── Controller: Situation Management ───────────────────────────
  {
    id: "expression-group-screen-controller-situation-management-01",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 1,
    prompt: "I have trouble moving forward until I feel I understand what is happening.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-controller-situation-management-02",
    groupId: "expression-group-controller-situation-management",
    itemNumber: 2,
    prompt: "I feel unsettled when I cannot control how things are unfolding.",
    access: "pro",
    reverseScored: false,
  },

  // ── Avoidant One: Delay and Distraction ────────────────────────
  {
    id: "expression-group-screen-avoidant-one-delay-distraction-01",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 1,
    prompt: "I put off dealing with things that feel uncomfortable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-avoidant-one-delay-distraction-02",
    groupId: "expression-group-avoidant-one-delay-distraction",
    itemNumber: 2,
    prompt: "When something difficult comes up, I shift my attention to something else.",
    access: "pro",
    reverseScored: false,
  },

  // ── Avoidant One: Withdrawal and Disappearance ─────────────────
  {
    id: "expression-group-screen-avoidant-one-withdrawal-disappearance-01",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 1,
    prompt: "I pull back from people or situations when things feel like too much.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-avoidant-one-withdrawal-disappearance-02",
    groupId: "expression-group-avoidant-one-withdrawal-disappearance",
    itemNumber: 2,
    prompt: "I check out or disengage when I feel overwhelmed.",
    access: "pro",
    reverseScored: false,
  },

  // ── Avoidant One: Decision and Commitment ──────────────────────
  {
    id: "expression-group-screen-avoidant-one-decision-commitment-01",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 1,
    prompt: "I struggle to settle on a decision when committing feels uncomfortable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-avoidant-one-decision-commitment-02",
    groupId: "expression-group-avoidant-one-decision-commitment",
    itemNumber: 2,
    prompt: "I keep gathering information instead of deciding or committing.",
    access: "pro",
    reverseScored: false,
  },

  // ── Hypervigilant One: Anticipatory Threat ─────────────────────
  {
    id: "expression-group-screen-hypervigilant-one-anticipatory-threat-01",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 1,
    prompt: "I imagine what could go wrong before events even happen.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-hypervigilant-one-anticipatory-threat-02",
    groupId: "expression-group-hypervigilant-one-anticipatory-threat",
    itemNumber: 2,
    prompt: "I mentally rehearse threatening outcomes before they happen.",
    access: "pro",
    reverseScored: false,
  },

  // ── Hypervigilant One: Preparedness and Exit ───────────────────
  {
    id: "expression-group-screen-hypervigilant-one-preparedness-exit-01",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 1,
    prompt: "I keep plans or options ready in case something goes wrong.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-hypervigilant-one-preparedness-exit-02",
    groupId: "expression-group-hypervigilant-one-preparedness-exit",
    itemNumber: 2,
    prompt: "I remain on guard even when no immediate danger is clear.",
    access: "pro",
    reverseScored: false,
  },

  // ── Hypervigilant One: Relational Scanning ─────────────────────
  {
    id: "expression-group-screen-hypervigilant-one-relational-scanning-01",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 1,
    prompt: "I closely track small changes in how someone close to me behaves.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-hypervigilant-one-relational-scanning-02",
    groupId: "expression-group-hypervigilant-one-relational-scanning",
    itemNumber: 2,
    prompt: "I interpret unclear signals from others as possible warnings that something is wrong.",
    access: "pro",
    reverseScored: false,
  },

  // ── Hypervigilant One: Monitoring ──────────────────────────────
  {
    id: "expression-group-screen-hypervigilant-one-monitoring-01",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 1,
    prompt: "I check repeatedly for signs that something may be wrong or unsafe.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-hypervigilant-one-monitoring-02",
    groupId: "expression-group-hypervigilant-one-monitoring",
    itemNumber: 2,
    prompt: "Once I start monitoring for problems, I find it hard to stop.",
    access: "pro",
    reverseScored: false,
  },

  // ── Entangled One: Proximity and Pursuit ───────────────────────
  {
    id: "expression-group-screen-entangled-one-proximity-pursuit-01",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 1,
    prompt: "I feel driven to restore closeness when it seems to be slipping.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-entangled-one-proximity-pursuit-02",
    groupId: "expression-group-entangled-one-proximity-pursuit",
    itemNumber: 2,
    prompt: "I change my own preferences to help preserve closeness with someone.",
    access: "pro",
    reverseScored: false,
  },

  // ── Entangled One: Identity Merger ─────────────────────────────
  {
    id: "expression-group-screen-entangled-one-identity-merger-01",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 1,
    prompt: "I have trouble telling where my feelings end and someone else's begin.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-entangled-one-identity-merger-02",
    groupId: "expression-group-entangled-one-identity-merger",
    itemNumber: 2,
    prompt: "I feel responsible for the emotional state between me and someone close.",
    access: "pro",
    reverseScored: false,
  },

  // ── Grief Bearer: Unexpressed and Delayed ──────────────────────
  {
    id: "expression-group-screen-grief-bearer-unexpressed-delayed-01",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 1,
    prompt: "My grief can be difficult for me to recognize or express in the moment.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-grief-bearer-unexpressed-delayed-02",
    groupId: "expression-group-grief-bearer-unexpressed-delayed",
    itemNumber: 2,
    prompt: "I often notice grief after I have carried it quietly for some time.",
    access: "pro",
    reverseScored: false,
  },

  // ── Grief Bearer: Loss Attachment ──────────────────────────────
  {
    id: "expression-group-screen-grief-bearer-loss-attachment-01",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 1,
    prompt: "I worry that feeling better or moving forward might mean I am letting go of what I lost.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-grief-bearer-loss-attachment-02",
    groupId: "expression-group-grief-bearer-loss-attachment",
    itemNumber: 2,
    prompt: "I protect myself from grief in ways that also keep me closely tied to the loss.",
    access: "pro",
    reverseScored: false,
  },

  // ── Martyr: Overgiving and Depletion ───────────────────────────
  {
    id: "expression-group-screen-martyr-overgiving-depletion-01",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 1,
    prompt: "I keep giving to others even when I am already running low.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-martyr-overgiving-depletion-02",
    groupId: "expression-group-martyr-overgiving-depletion",
    itemNumber: 2,
    prompt: "I minimize my own needs while continuing to support other people.",
    access: "pro",
    reverseScored: false,
  },

  // ── Martyr: Recognition and Reciprocity ────────────────────────
  {
    id: "expression-group-screen-martyr-recognition-reciprocity-01",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 1,
    prompt: "I keep track of whether the effort I give is returned.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-martyr-recognition-reciprocity-02",
    groupId: "expression-group-martyr-recognition-reciprocity",
    itemNumber: 2,
    prompt: "I feel hurt when the effort I give is not acknowledged.",
    access: "pro",
    reverseScored: false,
  },

  // ── Martyr: Overfunctioning and Crisis ─────────────────────────
  {
    id: "expression-group-screen-martyr-overfunctioning-crisis-01",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 1,
    prompt: "When problems come up, I take on more than I can sustain for long.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-martyr-overfunctioning-crisis-02",
    groupId: "expression-group-martyr-overfunctioning-crisis",
    itemNumber: 2,
    prompt: "I feel like things will fall apart unless I keep handling them.",
    access: "pro",
    reverseScored: false,
  },

  // ── Rescuer: Intervention and Fixing ───────────────────────────
  {
    id: "expression-group-screen-rescuer-intervention-fixing-01",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 1,
    prompt: "I feel compelled to step in when someone close to me is struggling.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-rescuer-intervention-fixing-02",
    groupId: "expression-group-rescuer-intervention-fixing",
    itemNumber: 2,
    prompt: "I offer solutions before someone has clearly asked for help.",
    access: "pro",
    reverseScored: false,
  },

  // ── Rescuer: Consequence Prevention ────────────────────────────
  {
    id: "expression-group-screen-rescuer-consequence-prevention-01",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 1,
    prompt: "I step in to prevent others from facing the results of their own choices.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-rescuer-consequence-prevention-02",
    groupId: "expression-group-rescuer-consequence-prevention",
    itemNumber: 2,
    prompt: "I take on another person's burden to protect them from hardship.",
    access: "pro",
    reverseScored: false,
  },

  // ── Rescuer: Indispensable Helper ──────────────────────────────
  {
    id: "expression-group-screen-rescuer-indispensable-helper-01",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 1,
    prompt: "I feel especially valuable when others rely heavily on my help.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-rescuer-indispensable-helper-02",
    groupId: "expression-group-rescuer-indispensable-helper",
    itemNumber: 2,
    prompt: "I feel uncomfortable when I am not needed to help or support someone.",
    access: "pro",
    reverseScored: false,
  },

  // ── Rescuer: Hidden Contract and Control ───────────────────────
  {
    id: "expression-group-screen-rescuer-hidden-contract-control-01",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 1,
    prompt: "I give help with the quiet hope that it will shape how the other person responds.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-rescuer-hidden-contract-control-02",
    groupId: "expression-group-rescuer-hidden-contract-control",
    itemNumber: 2,
    prompt: "I feel upset when my help does not lead to the response I expected.",
    access: "pro",
    reverseScored: false,
  },

  // ── Over-Responsible One: Emotional Care ───────────────────────
  {
    id: "expression-group-screen-over-responsible-one-emotional-care-01",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 1,
    prompt: "I feel responsible for how other people are feeling.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-over-responsible-one-emotional-care-02",
    groupId: "expression-group-over-responsible-one-emotional-care",
    itemNumber: 2,
    prompt: "I step in to stabilize things when tension or distress appears.",
    access: "pro",
    reverseScored: false,
  },

  // ── Over-Responsible One: Guilt and Blame ──────────────────────
  {
    id: "expression-group-screen-over-responsible-one-guilt-blame-01",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 1,
    prompt: "I assume personal responsibility when something goes wrong.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-over-responsible-one-guilt-blame-02",
    groupId: "expression-group-over-responsible-one-guilt-blame",
    itemNumber: 2,
    prompt: "I feel compelled to apologize for things that are not entirely my fault.",
    access: "pro",
    reverseScored: false,
  },

  // ── Over-Responsible One: Boundary and Rest ────────────────────
  {
    id: "expression-group-screen-over-responsible-one-boundary-rest-01",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 1,
    prompt: "I feel guilty when I protect my personal capacity.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-over-responsible-one-boundary-rest-02",
    groupId: "expression-group-over-responsible-one-boundary-rest",
    itemNumber: 2,
    prompt: "Allowing myself relief can make me feel undeserving.",
    access: "pro",
    reverseScored: false,
  },

  // ── Over-Responsible One: Anticipatory Moral ───────────────────
  {
    id: "expression-group-screen-over-responsible-one-anticipatory-moral-01",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 1,
    prompt: "I try to anticipate what others may need before they have to ask.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-over-responsible-one-anticipatory-moral-02",
    groupId: "expression-group-over-responsible-one-anticipatory-moral",
    itemNumber: 2,
    prompt: "I take more responsibility than is mine to prevent possible harm.",
    access: "pro",
    reverseScored: false,
  },

  // ── Overloaded One: Capacity and Backup ────────────────────────
  {
    id: "expression-group-screen-overloaded-one-capacity-backup-01",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 1,
    prompt: "I feel like things will fall to me if someone else does not step up.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-overloaded-one-capacity-backup-02",
    groupId: "expression-group-overloaded-one-capacity-backup",
    itemNumber: 2,
    prompt: "I carry responsibilities because I do not have reliable backup.",
    access: "pro",
    reverseScored: false,
  },

  // ── Overloaded One: Mental Load ────────────────────────────────
  {
    id: "expression-group-screen-overloaded-one-mental-load-01",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 1,
    prompt: "I carry the ongoing mental burden of keeping responsibilities on track.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-overloaded-one-mental-load-02",
    groupId: "expression-group-overloaded-one-mental-load",
    itemNumber: 2,
    prompt: "I find it hard to release oversight because others may not handle things as needed.",
    access: "pro",
    reverseScored: false,
  },

  // ── Overloaded One: Crisis, Stop, and Resume ───────────────────
  {
    id: "expression-group-screen-overloaded-one-crisis-stop-resume-01",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 1,
    prompt: "I keep pushing through overload even when I am near my limit.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-overloaded-one-crisis-stop-resume-02",
    groupId: "expression-group-overloaded-one-crisis-stop-resume",
    itemNumber: 2,
    prompt: "After I have to stop, I return to responsibilities before I am fully recovered.",
    access: "pro",
    reverseScored: false,
  },

  // ── Perfectionist: Standards and Evaluation ────────────────────
  {
    id: "expression-group-screen-perfectionist-standards-evaluation-01",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 1,
    prompt: "I have difficulty deciding that my work is good enough to stop.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-perfectionist-standards-evaluation-02",
    groupId: "expression-group-perfectionist-standards-evaluation",
    itemNumber: 2,
    prompt: "I judge my performance against standards that leave little room for partial success.",
    access: "pro",
    reverseScored: false,
  },

  // ── Perfectionist: Performance Exposure ────────────────────────
  {
    id: "expression-group-screen-perfectionist-performance-exposure-01",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 1,
    prompt: "I avoid situations where my performance might be imperfect and visible.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-perfectionist-performance-exposure-02",
    groupId: "expression-group-perfectionist-performance-exposure",
    itemNumber: 2,
    prompt: "I carefully control how my performance is presented so imperfections stay hidden.",
    access: "pro",
    reverseScored: false,
  },

  // ── Anger Shield: Explosive and Contempt ───────────────────────
  {
    id: "expression-group-screen-anger-shield-explosive-contempt-01",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 1,
    prompt: "My anger becomes forceful when I feel vulnerable.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-anger-shield-explosive-contempt-02",
    groupId: "expression-group-anger-shield-explosive-contempt",
    itemNumber: 2,
    prompt: "I use harshness to make other people back away.",
    access: "pro",
    reverseScored: false,
  },

  // ── Anger Shield: Cold and Defensive ───────────────────────────
  {
    id: "expression-group-screen-anger-shield-cold-defensive-01",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 1,
    prompt: "I create emotional distance when I feel hurt.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-anger-shield-cold-defensive-02",
    groupId: "expression-group-anger-shield-cold-defensive",
    itemNumber: 2,
    prompt: "I express anger indirectly when open engagement feels too vulnerable.",
    access: "pro",
    reverseScored: false,
  },

  // ── Anger Shield: Righteous Cycle ──────────────────────────────
  {
    id: "expression-group-screen-anger-shield-righteous-cycle-01",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 1,
    prompt: "Being certain I am right can make me feel protected.",
    access: "pro",
    reverseScored: false,
  },
  {
    id: "expression-group-screen-anger-shield-righteous-cycle-02",
    groupId: "expression-group-anger-shield-righteous-cycle",
    itemNumber: 2,
    prompt: "After anger, I try to repair things without changing the pattern that led to it.",
    access: "pro",
    reverseScored: false,
  },
];
