import type { ApprovedQuizItem } from '../../types/quiz';

export const APPROVED_QUIZ_ITEMS: ApprovedQuizItem[] = [
  /*
   * VALIDATION NOTE — Silenced One (SO-01) vs Invisible One (IV-01)
   *
   * SO-01: "When I disagree with someone close to me, I hold back
   * what I really think." — measures withholding one's own opinion or
   * disagreement during a relational conflict. The mechanism is
   * suppressed voice: having a view but not expressing it.
   *
   * IV-01: "When I contribute to a group discussion, I expect my input
   * to be overlooked." — measures expecting that one's contribution
   * will be dismissed or ignored after it is offered. The mechanism is
   * anticipated erasure: having spoken but not being heard.
   *
   * Although both involve not being heard, the timing and mechanism
   * differ: SO-01 is pre-emptive silence during disagreement, whereas
   * IV-01 is post-contribution expectation of dismissal. Both items
   * are retained as distinct measures.
   */
  {
    id: 'core-silenced-one-01',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'free',
    text: 'When I disagree with someone close to me, I hold back what I really think.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-02',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'free',
    text: 'I stay in the room but say nothing when I disagree with what is happening.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-03',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'free',
    text: 'When someone asks what I want, I say I do not care even when I do.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-04',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'free',
    text: 'After a difficult conversation, I often regret not saying what I really thought or needed.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-05',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'free',
    text: 'When I finally speak up, I give more explanation than I intended.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-06',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'pro',
    text: 'When I am pressured to explain what I think or feel, my mind sometimes goes blank.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-07',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'pro',
    text: 'In group decisions, I keep my preference to myself even when the choice matters to me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-silenced-one-08',
    patternId: 'silenced-one',
    layer: 'core',
    access: 'pro',
    text: 'I stay quiet during tense moments because speaking honestly feels likely to make things worse.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-01',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'free',
    text: 'When I need emotional support, I expect it will not really be there.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-02',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'free',
    text: 'When someone offers to help me, I feel awkward accepting it.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-03',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'free',
    text: 'I handle things myself rather than let anyone see what I need.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-04',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'free',
    text: 'I keep my needs small so they do not become a problem for anyone.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-05',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'free',
    text: 'I brace myself for disappointment when I count on someone.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-06',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'pro',
    text: 'I feel more certain of my place in a relationship when the other person relies on me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-07',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'pro',
    text: 'After I ask for help, I worry that I have asked for too much.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-unheld-one-08',
    patternId: 'unheld-one',
    layer: 'core',
    access: 'pro',
    text: 'Even around people I know well, I can still feel emotionally on my own.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-01',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'free',
    text: 'When I contribute to a group discussion, I expect my input to be overlooked.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-02',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'free',
    text: 'I downplay what I have achieved when someone asks about my work or efforts.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-03',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'free',
    text: 'I pass up visible roles even when I know I could handle them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-04',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'free',
    text: 'I feel uncomfortable when other people openly recognize something I did well.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-05',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'free',
    text: 'I minimize my role in something even when I contributed a lot.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-06',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'pro',
    text: 'I let other people take credit for work or effort I contributed.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-07',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'pro',
    text: 'I keep my successes private because being noticed feels uncomfortable.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-invisible-one-08',
    patternId: 'invisible-one',
    layer: 'core',
    access: 'pro',
    text: 'In close relationships, I make my own needs and contributions seem less important than they are.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-01',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'free',
    text: 'When I make a mistake, I see it as proof of something wrong with me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-02',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'free',
    text: 'I worry that if people knew me fully, they would see something wrong with me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-03',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'free',
    text: 'I hide parts of myself because I fear what people would think if they saw them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-04',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'free',
    text: 'When I am rejected, I take it as a sign of my flaws.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-05',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'free',
    text: 'I can mess up without feeling like a failure as a person.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-06',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'pro',
    text: 'After criticism, I keep thinking about what it says about me as a person.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-07',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'pro',
    text: 'When someone is kind to me, part of me feels I have not earned it.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-shame-bearer-08',
    patternId: 'shame-bearer',
    layer: 'core',
    access: 'pro',
    text: 'I assume other people notice my flaws as much as I do.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-01',
    patternId: 'controller',
    layer: 'core',
    access: 'free',
    text: 'I feel uncomfortable when decisions that affect me are made without my input.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-02',
    patternId: 'controller',
    layer: 'core',
    access: 'free',
    text: 'I find it hard to hand over important tasks without continuing to monitor how they are done.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-03',
    patternId: 'controller',
    layer: 'core',
    access: 'free',
    text: 'When someone handles a task differently than I would, I often step in and take over.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-04',
    patternId: 'controller',
    layer: 'core',
    access: 'free',
    text: 'I get irritated when plans change at the last minute.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-05',
    patternId: 'controller',
    layer: 'core',
    access: 'free',
    text: 'I feel safer when I am the one overseeing the outcome.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-06',
    patternId: 'controller',
    layer: 'core',
    access: 'pro',
    text: 'I feel more settled when I can influence how an uncertain situation will unfold.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-07',
    patternId: 'controller',
    layer: 'core',
    access: 'pro',
    text: 'I take responsibility for outcomes even when other people should be allowed to handle them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-controller-08',
    patternId: 'controller',
    layer: 'core',
    access: 'pro',
    text: 'I can let other people lead without needing to direct how they do it.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Avoidant One items
   *
   * The following items assess habitual emotional avoidance —
   * NOT protective or healthy behaviors such as:
   *
   *   - leaving unsafe or abusive situations
   *   - ending harmful interactions
   *   - setting and maintaining healthy boundaries
   *   - taking a temporary pause and returning later
   *
   * These items must never be scored or interpreted as evidence
   * against safety-seeking, boundary-setting, or self-protective action.
   */
  {
    id: 'core-avoidant-one-01',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'free',
    text: 'I put off important conversations even when I know they need to happen.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-02',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'free',
    text: 'I keep myself busy to avoid paying attention to uncomfortable feelings.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-03',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'free',
    text: 'When tension builds in a close relationship, I reduce contact or emotionally pull away.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-04',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'free',
    text: 'I delay making decisions to avoid the discomfort of choosing.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-05',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'free',
    text: 'I take a pause and then return to difficult topics I have postponed.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-06',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'pro',
    text: 'I tell myself a problem is not that serious so I can avoid dealing with it.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-07',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'pro',
    text: 'I change the subject or create distance when a conversation becomes emotionally personal.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-avoidant-one-08',
    patternId: 'avoidant-one',
    layer: 'core',
    access: 'pro',
    text: 'I avoid manageable situations when I expect them to bring up uncomfortable emotions.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Hypervigilant One items
   *
   * The following items assess habitual hypervigilance and chronic
   * threat-scanning — NOT reasonable awareness in genuinely unsafe
   * or threatening circumstances such as:
   *
   *   - current emergencies or real danger
   *   - abusive or coercive situations
   *   - threatening or unstable environments
   *   - unfamiliar places where caution is appropriate
   *
   * These items must never be scored or interpreted as evidence
   * against appropriate caution, self-protection, or legitimate
   * threat assessment in unsafe conditions.
   */
  {
    id: 'core-hypervigilant-one-01',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'free',
    text: 'I watch people\u2019s expressions closely for signs that tension or trouble may be building.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-02',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'free',
    text: 'Even in familiar places, I scan my surroundings for things that could go wrong.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-03',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'free',
    text: 'I have a hard time relaxing even when I cannot identify a current problem.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-04',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'free',
    text: 'I expect calm situations to change suddenly.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-05',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'free',
    text: 'Once a situation feels safe, I stop scanning for trouble.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-06',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'pro',
    text: 'I prepare for possible problems even when there is little evidence they are likely.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-07',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'pro',
    text: 'I feel responsible for spotting warning signs before other people notice them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-hypervigilant-one-08',
    patternId: 'hypervigilant-one',
    layer: 'core',
    access: 'pro',
    text: 'After a stressful moment has passed, my mind keeps watching for what might happen next.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * CONTENT NOTE — Entangled One items
   *
   * The following items assess chronic emotional fusion and
   * difficulty maintaining a separate sense of self — NOT
   * healthy relating behaviors such as:
   *
   *   - empathy
   *   - ordinary compromise
   *   - caregiving during genuine hardship
   *   - considering how shared decisions affect another person
   *   - temporary support for someone in distress
   *   - healthy emotional closeness
   *   - loyalty
   *   - cooperation
   *
   * These items must never be scored or interpreted as evidence
   * against empathy, caregiving, closeness, or mutuality in healthy
   * relationships.
   */
  {
    id: 'core-entangled-one-01',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'free',
    text: 'When someone close to me is upset, their mood quickly becomes my mood too.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-02',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'free',
    text: 'I change personal plans I want to keep because someone close to me might feel disappointed.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-03',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'free',
    text: 'I feel guilty when I take reasonable time or space for myself.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-04',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'free',
    text: 'When someone close to me is distressed, I struggle to remember that their feelings are not mine to manage.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-05',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'free',
    text: 'I can care about someone\u2019s feelings without taking them on as my own.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-06',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'pro',
    text: 'I feel responsible for keeping people I care about from becoming upset.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-07',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'pro',
    text: 'I lose track of what I want when someone close to me wants something different.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-entangled-one-08',
    patternId: 'entangled-one',
    layer: 'core',
    access: 'pro',
    text: 'I feel uneasy making an independent choice when someone close to me may disagree.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * CONTENT NOTE — Grief-Bearer items
   *
   * The following items assess chronic grief-pattern relating
   * (where loss defines present-moment capacity) — NOT healthy
   * grief, remembrance, or bereavement responses such as:
   *
   *   - normal sadness after a loss
   *   - recent bereavement
   *   - remembering someone or something important
   *   - continuing to love someone who died or is absent
   *   - honoring a person, relationship, identity, or former life
   *   - maintaining meaningful memories
   *   - needing time to adjust to major change
   *   - continuing bonds with someone who died
   *   - occasional sadness triggered by reminders
   *   - grief shaped by cultural, spiritual, or family practices
   *
   * The assessment must not imply that healing requires forgetting,
   * replacing what was lost, stopping love or remembrance, no longer
   * feeling sadness, reaching a fixed timeline, or "moving on" completely.
   *
   * A high score on these items does not indicate prolonged grief
   * disorder or any clinical condition.
   */
  {
    id: 'core-grief-bearer-01',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'free',
    text: 'I compare present experiences with what I lost, even when the situations are different.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-02',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'free',
    text: 'It is hard for me to let new experiences matter alongside what I lost.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-03',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'free',
    text: 'I hold onto a version of the future that did not happen.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-04',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'free',
    text: 'I struggle to understand how what I lost fits into the life I have now.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-05',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'free',
    text: 'I can hold my sadness about the past while still opening to new things.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-06',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'pro',
    text: 'After certain reminders, it takes me a long time to reconnect with the present.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-07',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'pro',
    text: 'Parts of my life feel emotionally paused while the rest of life continues.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'core-grief-bearer-08',
    patternId: 'grief-bearer',
    layer: 'core',
    access: 'pro',
    text: 'What I lost often becomes the reference point for how I understand my life now.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Martyr strategy items
   *
   * The following items assess a pattern of repeated sacrifice,
   * depletion, and difficulty setting limits — NOT protective or
   * healthy behaviors such as:
   *
   *   - generosity
   *   - temporary sacrifice
   *   - parenting responsibilities
   *   - employment duties
   *   - caregiving during genuine hardship
   *   - disability-related dependence or support
   *   - poverty or lack of available help
   *   - legal obligations
   *   - emergencies
   *   - freely chosen support without depletion or resentment
   *
   * The defining evidence involves repeated sacrifice combined with
   * factors such as depletion, difficulty receiving help, inability
   * to set limits, unspoken expectations, or worth tied to enduring.
   * These items must never be scored or interpreted as evidence
   * against generosity, caregiving, or freely chosen support.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-martyr-01',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I keep giving to others even after I have nothing left for myself.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-martyr-02',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I say yes when I want to say no and then feel drained afterward.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-martyr-03',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'free',
    text: 'I turn down help even when I am overwhelmed.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-martyr-04',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'free',
    text: 'I expect people to notice what I give without me having to say it.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-martyr-05',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'free',
    text: 'I set limits on what I give before it begins to wear me down.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-martyr-06',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'pro',
    text: 'I take on more than people actually asked me to do.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-martyr-07',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'pro',
    text: 'I feel guilty resting while other people still want something from me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-martyr-08',
    patternId: 'martyr',
    layer: 'strategy',
    access: 'pro',
    text: 'I feel more worthy when I endure more for others than they asked of me.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Rescuer strategy items
   *
   * The following items assess a pattern of repeated intervention
   * beyond what was requested or needed — NOT protective or healthy
   * behaviors such as:
   *
   *   - emergency assistance
   *   - responding to genuine danger
   *   - parenting responsibilities
   *   - caregiving during illness or disability
   *   - professional helping duties
   *   - mentoring
   *   - collaboration
   *   - requested reasonable assistance
   *   - temporary support during crisis
   *   - helping someone who cannot reasonably perform a task themselves
   *
   * The defining evidence involves repeated intervention beyond what
   * was requested or needed, such as unsolicited solutions, taking
   * over another person's problem, preventing reasonable consequences,
   * doing tasks a person could reasonably do, trying to regulate
   * another person's distress through intervention, or frustration
   * when advice is not followed. These items must never be scored
   * or interpreted as evidence against helping, mentoring, or
   * reasonable assistance.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-rescuer-01',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I offer solutions to people before they have asked for my advice.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-rescuer-02',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I do things for people that they could reasonably do themselves.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-rescuer-03',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'free',
    text: 'I step in to prevent people from dealing with the consequences of their choices.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-rescuer-04',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'free',
    text: 'I feel compelled to step in when someone is upset, even when they have not asked for help.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-rescuer-05',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'free',
    text: 'I can support someone without protecting them from the results of their own decisions.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-rescuer-06',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'pro',
    text: 'I repeatedly help people solve problems they are not taking responsibility for.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-rescuer-07',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'pro',
    text: 'I get frustrated when people do not follow the advice I gave them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-rescuer-08',
    patternId: 'rescuer',
    layer: 'strategy',
    access: 'pro',
    text: 'I sometimes take over while believing I am only being supportive.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Over-Responsible One strategy items
   *
   * The following items assess a pattern of responsibility, blame,
   * guilt, or ownership that exceeds actual role, contribution,
   * obligation, or control — NOT protective or healthy behaviors
   * such as:
   *
   *   - ordinary accountability
   *   - correcting one's own mistakes
   *   - parenting responsibilities
   *   - caregiving duties
   *   - legal obligations
   *   - employment responsibilities
   *   - leadership
   *   - project ownership
   *   - emergency response
   *   - carrying a genuinely assigned role
   *   - reasonable concern for shared outcomes
   *
   * The defining evidence involves responsibility, blame, guilt, or
   * ownership that exceeds actual role, contribution, obligation, or
   * control. These items must never be scored or interpreted as
   * evidence against reasonable accountability or duty.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-over-responsible-one-01',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I take blame for things that go wrong even when several people were involved.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-over-responsible-one-02',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I carry responsibilities that should really belong to other people.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-over-responsible-one-03',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'free',
    text: 'I feel responsible for preventing problems that I cannot actually control.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-over-responsible-one-04',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'free',
    text: 'I feel guilty when someone I care about is disappointed, even when the outcome was not mine to control.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-over-responsible-one-05',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'free',
    text: 'I can tell the difference between my responsibility and what belongs to others.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-over-responsible-one-06',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I fix mistakes that were not mine to correct.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-over-responsible-one-07',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I feel at fault when someone close to me struggles, even when I did not cause the problem.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-over-responsible-one-08',
    patternId: 'over-responsible-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I treat shared outcomes as if they are my personal obligation.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Overloaded One strategy items
   *
   * The following items assess a pattern of carrying excessive
   * responsibility where some realistic choice exists — NOT
   * protective or healthy situations such as:
   *
   *   - poverty
   *   - disability
   *   - chronic illness
   *   - parenting
   *   - caregiving
   *   - understaffing
   *   - employment pressure
   *   - housing instability
   *   - legal obligations
   *   - emergencies
   *   - temporary crisis
   *   - lack of available help
   *   - externally imposed workloads
   *   - temporary busy periods
   *
   * The defining evidence involves repeated patterns where some
   * realistic choice exists in accepting, prioritizing, delegating,
   * communicating, scheduling, or reducing demands. These items must
   * never be scored or interpreted as evidence against managing
   * external workload demands or unavoidable obligations.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-overloaded-one-01',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I say yes to new commitments even when I am already stretched thin.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-overloaded-one-02',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I struggle to figure out what I can postpone or drop from my list.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-overloaded-one-03',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'free',
    text: 'I keep going at the same pace even after I notice I am reaching my limit.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-overloaded-one-04',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'free',
    text: 'I spend much of my available time catching up on commitments I accepted.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-overloaded-one-05',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'free',
    text: 'I notice when I am approaching my limit and adjust my commitments accordingly.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-overloaded-one-06',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I allow myself to become the default person for more tasks than I can manage sustainably.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-overloaded-one-07',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I wait until I am completely drained before reducing how much I have agreed to do.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-overloaded-one-08',
    patternId: 'overloaded-one',
    layer: 'strategy',
    access: 'pro',
    text: 'I leave too little recovery time between commitments when I have some choice in scheduling them.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Perfectionist strategy items
   *
   * The following items assess standards, checking, correction,
   * delay, or dissatisfaction that become rigid, disproportionate,
   * or costly relative to what the situation reasonably requires —
   * NOT protective or healthy behaviors such as:
   *
   *   - ambition
   *   - careful work
   *   - craftsmanship
   *   - professional standards
   *   - safety checks
   *   - quality control
   *   - studying
   *   - preparation
   *   - skill development
   *   - correcting meaningful errors
   *   - meeting exact legal or technical requirements
   *   - attention to detail
   *   - conscientiousness
   *
   * The defining evidence involves standards, checking, correction,
   * delay, or dissatisfaction that become rigid, disproportionate,
   * or costly relative to what the situation reasonably requires.
   * These items must never be scored or interpreted as evidence
   * against careful work, legitimate standards, or conscientiousness.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-perfectionist-01',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I keep improving things long after they are good enough.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-perfectionist-02',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I check my work multiple times for mistakes that are unlikely to be there.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-perfectionist-03',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'free',
    text: 'I delay finishing things because they still do not feel ready.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-perfectionist-04',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'free',
    text: 'I feel dissatisfied with results that meet what the situation actually requires.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-perfectionist-05',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'free',
    text: 'I can finish something on time even when it is not perfect.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-perfectionist-06',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'pro',
    text: 'I treat small mistakes as if they are major problems.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-perfectionist-07',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'pro',
    text: 'I use nearly the same high standard for minor tasks as I do for important ones.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-perfectionist-08',
    patternId: 'perfectionist',
    layer: 'strategy',
    access: 'pro',
    text: 'I focus on imperfections even when other people respond positively to what I did.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /*
   * SAFETY NOTICE — Anger Shield strategy items
   *
   * The following items assess repeated defensive use of anger,
   * irritation, blame, sharpness, or escalation — NOT protective
   * or healthy behaviors such as:
   *
   *   - healthy anger
   *   - assertiveness
   *   - setting boundaries
   *   - leaving an unsafe situation
   *   - responding to abuse or intimidation
   *   - protecting oneself or another person
   *   - raising one\u2019s voice to get help
   *   - naming injustice
   *   - confronting serious misconduct
   *   - rejecting manipulation
   *   - expressing reasonable frustration
   *   - refusing insulting or manipulative feedback
   *   - anger in response to actual danger
   *
   * The defining evidence involves repeated defensive use of anger,
   * irritation, blame, sharpness, or escalation to conceal or replace
   * vulnerable expression, create emotional distance, shut down
   * ordinary uncomfortable conversations, deflect reasonable feedback,
   * treat ordinary disagreement as attack, or regain control during
   * non-dangerous conflict. These items must never be scored or
   * interpreted as evidence against healthy anger, assertiveness,
   * or self-protection.
   */

  /* ---------- UNIVERSAL SCREENERS ---------- */

  {
    id: 'strategy-anger-shield-01',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'When I feel hurt, I get angry instead of showing the hurt.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-anger-shield-02',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'free',
    strategyScreen: 'universal',
    text: 'I use irritation to end conversations that feel uncomfortable.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },

  /* ---------- FREE ITEMS ---------- */

  {
    id: 'strategy-anger-shield-03',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'free',
    text: 'I become defensive when someone gives me reasonable feedback.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-anger-shield-04',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'free',
    text: 'I treat ordinary disagreement as if it is a personal attack.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-anger-shield-05',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'free',
    text: 'I can express hurt without turning it into anger.',
    scale: 'frequency',
    reverseScored: true,
    status: 'approved',
  },

  /* ---------- PRO-ONLY ITEMS ---------- */

  {
    id: 'strategy-anger-shield-06',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'pro',
    text: 'During ordinary conflict, I blame others before considering what I contributed.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-anger-shield-07',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'pro',
    text: 'I show anger when directly asking for reassurance or support feels difficult.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
  {
    id: 'strategy-anger-shield-08',
    patternId: 'anger-shield',
    layer: 'strategy',
    access: 'pro',
    text: 'I raise the emotional intensity of a conversation when I feel I am losing control of it.',
    scale: 'frequency',
    reverseScored: false,
    status: 'approved',
  },
];
