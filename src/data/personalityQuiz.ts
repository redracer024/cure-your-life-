export type PatternKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface Pattern {
  key: PatternKey;
  name: string;
  tagline: string;
  color: string;
  glowColor: string;
  description: string;
}

export interface QuizAnswer {
  key: PatternKey;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  answers: QuizAnswer[];
  isFree: boolean;
}

export interface PatternScores {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  G: number;
}

export const FREE_QUESTION_COUNT = 7;
export const PAID_QUESTION_COUNT = 30;

export const PATTERNS: Record<PatternKey, Pattern> = {
  A: {
    key: 'A',
    name: 'The Martyr',
    tagline: 'You give until you are empty, then give more.',
    color: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.15)',
    description:
      'You carry guilt when you rest. You measure your worth by how much you sacrifice for others. Your body holds the weight of everyone you have ever tried to save — and it is running out of room.',
  },
  B: {
    key: 'B',
    name: 'The Silenced One',
    tagline: 'Your truth has been swallowed so many times it has become a stone.',
    color: '#B15CFF',
    glowColor: 'rgba(177, 92, 255, 0.15)',
    description:
      'You learned early that speaking up was dangerous. Now your throat, jaw, and chest carry the sentences you never finished. Your body is speaking the words you buried.',
  },
  C: {
    key: 'C',
    name: 'The Unheld One',
    tagline: 'You have been holding yourself together since before you knew what falling apart meant.',
    color: '#4ECDC4',
    glowColor: 'rgba(78, 205, 196, 0.15)',
    description:
      'You never had someone who made you feel safe enough to stop performing strength. Your nervous system is locked in vigilance, even when the danger has passed.',
  },
  D: {
    key: 'D',
    name: 'The Controller',
    tagline: 'If you can control everything, nothing can hurt you. Except your own body.',
    color: '#FFD000',
    glowColor: 'rgba(255, 208, 0, 0.15)',
    description:
      'Control is your armor against chaos. But the tighter you grip, the more your body rebels — with tension, pain, and systems that refuse to cooperate.',
  },
  E: {
    key: 'E',
    name: 'The Grief-Bearer',
    tagline: 'You carry losses that were never mourned out loud.',
    color: '#5C8AFF',
    glowColor: 'rgba(92, 138, 255, 0.15)',
    description:
      'Unprocessed grief settles into the body like sediment. It pools in your joints, your stomach, your sleep. Your symptoms are the tears you were not allowed to cry.',
  },
  F: {
    key: 'F',
    name: 'The Overloaded One',
    tagline: 'You are not tired. You are depleted on a level that sleep cannot fix.',
    color: '#FF8A00',
    glowColor: 'rgba(255, 138, 0, 0.15)',
    description:
      'You have been running on empty for so long that exhaustion feels like a personality trait. Your body is screaming for rest you keep postponing. The overload is not just physical — it is emotional, mental, existential.',
  },
  G: {
    key: 'G',
    name: 'The Invisible One',
    tagline: 'You disappeared so others could be seen. Now you cannot find yourself.',
    color: '#FF5CD6',
    glowColor: 'rgba(255, 92, 214, 0.15)',
    description:
      'You learned to take up less space. Your needs became invisible, even to you. Now your body signals the presence you erased — through symptoms that demand attention you were taught you did not deserve.',
  },
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'When someone you love is in pain, your first instinct is to:',
    answers: [
      { key: 'A', text: 'Drop everything and fix it, even if it costs you.' },
      { key: 'B', text: 'Quietly absorb their distress so they feel less alone.' },
      { key: 'C', text: 'Wish you had someone doing that for you.' },
      { key: 'D', text: 'Make a plan and take charge of the situation.' },
      { key: 'E', text: 'Feel it in your body — like their pain became yours.' },
      { key: 'F', text: 'Add it to the mental list of things you are already carrying.' },
      { key: 'G', text: 'Put yourself second without even noticing you did it.' },
    ],
    isFree: true,
  },
  {
    id: 2,
    question: 'What does your body do when you are finally alone and quiet?',
    answers: [
      { key: 'A', text: 'Feels guilty for not doing something productive.' },
      { key: 'B', text: 'Throat tightens, jaw clenches — words stuck inside.' },
      { key: 'C', text: 'Hypervigilance kicks in. You scan for threats.' },
      { key: 'D', text: 'Starts cataloguing everything that needs to be done.' },
      { key: 'E', text: 'A heaviness settles in your chest or joints.' },
      { key: 'F', text: 'Crashes. Total collapse the moment you stop.' },
      { key: 'G', text: 'You feel nothing. Not sure what you even feel.' },
    ],
    isFree: true,
  },
  {
    id: 3,
    question: 'Which statement makes your stomach drop?',
    answers: [
      { key: 'A', text: '"You are so strong — I do not know what I would do without you."' },
      { key: 'B', text: '"It is fine, do not worry about it." (when it clearly is not)' },
      { key: 'C', text: '"You are so independent — you never need help."' },
      { key: 'D', text: '"It does not matter what you do, nothing changes."' },
      { key: 'E', text: '"That was a long time ago. You should be over it by now."' },
      { key: 'F', text: '"Can you just add this one more thing?"' },
      { key: 'G', text: '"I did not realize you were upset."' },
    ],
    isFree: true,
  },
  {
    id: 4,
    question: 'Your relationship with boundaries looks like:',
    answers: [
      { key: 'A', text: 'You have them, but you bend them for anyone who asks.' },
      { key: 'B', text: 'You feel them being crossed but cannot find the words to stop it.' },
      { key: 'C', text: 'You do not trust that anyone will respect them.' },
      { key: 'D', text: 'You enforce them rigidly — because softness was punished.' },
      { key: 'E', text: 'You do not even know where yours begin and others end.' },
      { key: 'F', text: 'You know you need them but there is never time to set them.' },
      { key: 'G', text: 'You did not know you were allowed to have them.' },
    ],
    isFree: true,
  },
  {
    id: 5,
    question: 'When you were a child, which role did you learn to play?',
    answers: [
      { key: 'A', text: 'The little caretaker — managing everyone\'s emotions.' },
      { key: 'B', text: 'The quiet one — your needs were too inconvenient to mention.' },
      { key: 'C', text: 'The self-sufficient one — you learned early no one was coming.' },
      { key: 'D', text: 'The good one — perfect behavior was the only safe option.' },
      { key: 'E', text: 'The absorber — you felt everything no one else would feel.' },
      { key: 'F', text: 'The responsible one — too much weight on too-small shoulders.' },
      { key: 'G', text: 'The easy one — the child who never caused problems.' },
    ],
    isFree: true,
  },
  {
    id: 6,
    question: 'Which physical symptom pattern feels most familiar?',
    answers: [
      { key: 'A', text: 'Lower back pain and shoulder tension from carrying everything.' },
      { key: 'B', text: 'Throat issues, jaw pain, neck stiffness — swallowed words.' },
      { key: 'C', text: 'Digestive problems, IBS, stomach knots — unsafe in your own body.' },
      { key: 'D', text: 'Muscle tension, headaches, clenched everything — grip too tight.' },
      { key: 'E', text: 'Joint pain, chest heaviness, fluid retention — grief in the tissues.' },
      { key: 'F', text: 'Total system fatigue, adrenal burnout, immune crashes.' },
      { key: 'G', text: 'Skin issues, allergic reactions, mysterious symptoms — body demanding attention.' },
    ],
    isFree: true,
  },
  {
    id: 7,
    question: 'When you try to rest, what happens inside?',
    answers: [
      { key: 'A', text: 'Guilt. Someone, somewhere, needs me right now.' },
      { key: 'B', text: 'A pressure builds — things I have not said flood in.' },
      { key: 'C', text: 'My body stays tense, like rest is a trap.' },
      { key: 'D', text: 'My mind races through everything I should be doing.' },
      { key: 'E', text: 'Sadness hits. Waves of it. No clear reason.' },
      { key: 'F', text: 'I am too tired to rest. The paradox.' },
      { key: 'G', text: 'Nothing. I do not know what rest even feels like.' },
    ],
    isFree: true,
  },
  {
    id: 8,
    question: 'The phrase "I am fine" means:',
    answers: [
      { key: 'A', text: 'I have made everyone else fine. That is enough.' },
      { key: 'B', text: 'I have something to say but this is not the time or place.' },
      { key: 'C', text: 'I will figure it out. I always do.' },
      { key: 'D', text: 'Everything is under control. Do not question it.' },
      { key: 'E', text: 'I do not have the energy to explain what is wrong.' },
      { key: 'F', text: 'I am surviving. That is the best I can offer right now.' },
      { key: 'G', text: 'Please see through this. But also, do not make me say it.' },
    ],
    isFree: false,
  },
  {
    id: 9,
    question: 'When someone sets a boundary with you, you:',
    answers: [
      { key: 'A', text: 'Wonder what you did wrong and overcompensate.' },
      { key: 'B', text: 'Accept it silently but feel the rejection deeply.' },
      { key: 'C', text: 'Respect it but secretly prepare for them to leave.' },
      { key: 'D', text: 'Analyze it and try to negotiate the terms.' },
      { key: 'E', text: 'Feel the loss before the conversation is even over.' },
      { key: 'F', text: 'Wish someone would extend the same grace to you.' },
      { key: 'G', text: 'Think — I wish I had that kind of clarity about my own needs.' },
    ],
    isFree: false,
  },
  {
    id: 10,
    question: 'What is your relationship with anger?',
    answers: [
      { key: 'A', text: 'You do not get angry. You get tired. Then resentful.' },
      { key: 'B', text: 'It builds silently until it explodes — or disappears entirely.' },
      { key: 'C', text: 'You are afraid of it. Yours and others\'. It feels dangerous.' },
      { key: 'D', text: 'You use it as fuel. Controlled. Directed. Never wasted.' },
      { key: 'E', text: 'It makes you cry instead. Sadness and anger share a channel.' },
      { key: 'F', text: 'You do not have bandwidth for it. Another expense you cannot afford.' },
      { key: 'G', text: 'You do not let yourself feel it. Angry people get abandoned.' },
    ],
    isFree: false,
  },
  {
    id: 11,
    question: 'Your body sends its loudest signals when:',
    answers: [
      { key: 'A', text: 'You finally sit down after helping everyone else.' },
      { key: 'B', text: 'You are about to say something honest in a difficult situation.' },
      { key: 'C', text: 'You are in a relationship where you should feel safe but do not.' },
      { key: 'D', text: 'Something is out of your control and you cannot fix it.' },
      { key: 'E', text: 'An anniversary, a loss, a memory surfaces you did not invite.' },
      { key: 'F', text: 'You have been running on fumes and someone asks for more.' },
      { key: 'G', text: 'Someone overlooks you — again — and you pretend it does not hurt.' },
    ],
    isFree: false,
  },
  {
    id: 12,
    question: 'How do you react when you receive criticism?',
    answers: [
      { key: 'A', text: 'Internalize it. Assume you failed someone.' },
      { key: 'B', text: 'Go quiet. Replay it for days. Never respond.' },
      { key: 'C', text: 'Brace for abandonment. Criticism means exile.' },
      { key: 'D', text: 'Defend your position. Criticism is a problem to solve.' },
      { key: 'E', text: 'Feel it physically. Chest tight. Stomach drops.' },
      { key: 'F', text: 'Add it to the pile. Just another thing you are not enough at.' },
      { key: 'G', text: 'Nod, absorb, disappear further into the background.' },
    ],
    isFree: false,
  },
  {
    id: 13,
    question: 'The emotion you suppress most often is:',
    answers: [
      { key: 'A', text: 'Needing help. That is weakness.' },
      { key: 'B', text: 'Rage. Because the words come out wrong or not at all.' },
      { key: 'C', text: 'Hope. Hoping means you might be let down.' },
      { key: 'D', text: 'Vulnerability. It is a liability.' },
      { key: 'E', text: 'Grief. There is always more to lose than you can process.' },
      { key: 'F', text: 'Desire. Wanting things requires energy you do not have.' },
      { key: 'G', text: 'Self-worth. You were never taught you had any.' },
    ],
    isFree: false,
  },
  {
    id: 14,
    question: 'In conflict, your nervous system goes into:',
    answers: [
      { key: 'A', text: 'Over-functioning — you try to fix the other person\'s distress first.' },
      { key: 'B', text: 'Freeze — your voice leaves your body.' },
      { key: 'C', text: 'Fawn — you adjust yourself to make them comfortable.' },
      { key: 'D', text: 'Fight — you become precise, controlled, strategic.' },
      { key: 'E', text: 'Collapse — it feels like drowning in your own chest.' },
      { key: 'F', text: 'Functional numbness — you get through it, then fall apart later.' },
      { key: 'G', text: 'Disappearance — you shrink so small you forget you exist.' },
    ],
    isFree: false,
  },
  {
    id: 15,
    question: 'What does your inner critic say most often?',
    answers: [
      { key: 'A', text: '"You are not doing enough. Someone, somewhere, is suffering because of you."' },
      { key: 'B', text: '"Your truth does not matter. Stay quiet."' },
      { key: 'C', text: '"You are too much. Or not enough. Either way, you will be left."' },
      { key: 'D', text: '"If you were better at this, none of this would be happening."' },
      { key: 'E', text: '"You should be over this by now. Why are you still hurting?"' },
      { key: 'F', text: '"Everyone is managing. What is wrong with you?"' },
      { key: 'G', text: '"Do not take up space. Do not need things. Do not be a burden."' },
    ],
    isFree: false,
  },
  {
    id: 16,
    question: 'When someone asks "How are you really?" you:',
    answers: [
      { key: 'A', text: 'Deflect. Tell them about someone else who needs help.' },
      { key: 'B', text: 'Pause. Want to answer. Do not know how.' },
      { key: 'C', text: 'Assume they do not really want to know.' },
      { key: 'D', text: 'Give a structured, composed summary. Keep it efficient.' },
      { key: 'E', text: 'Feel the weight of the honest answer and choose not to burden them.' },
      { key: 'F', text: 'Rally. Perform. Save the breakdown for later.' },
      { key: 'G', text: 'Say "fine" and change the subject before anyone notices.' },
    ],
    isFree: false,
  },
  {
    id: 17,
    question: 'Your most recurring physical complaint maps to:',
    answers: [
      { key: 'A', text: 'Exhaustion that does not improve with rest — giving without refilling.' },
      { key: 'B', text: 'Throat, sinus, or vocal issues — words trapped inside.' },
      { key: 'C', text: 'Anxiety, insomnia, or startle response — safety never fully achieved.' },
      { key: 'D', text: 'Tension headaches, TMJ, clenched muscles — constant bracing.' },
      { key: 'E', text: 'Aches that move, swell, or throb with emotional waves — body holding grief.' },
      { key: 'F', text: 'Complete system shutdown — colds, infections, autoimmune flares.' },
      { key: 'G', text: 'Skin reactions, allergies, or invisible symptoms — body making the unseen visible.' },
    ],
    isFree: false,
  },
  {
    id: 18,
    question: 'In your closest relationships, the dynamic you keep recreating is:',
    answers: [
      { key: 'A', text: 'You give more. Always. And quietly resent it.' },
      { key: 'B', text: 'You feel unseen. You stay anyway, hoping to be noticed.' },
      { key: 'C', text: 'You keep people at a distance. Intimacy is a threat.' },
      { key: 'D', text: 'You try to shape the relationship into something predictable.' },
      { key: 'E', text: 'You bond over pain. Lightness feels unfamiliar.' },
      { key: 'F', text: 'You are overwhelmed but say nothing because asking for less feels selfish.' },
      { key: 'G', text: 'You fade into the background of the relationship.' },
    ],
    isFree: false,
  },
  {
    id: 19,
    question: 'When you set a goal for yourself, what happens?',
    answers: [
      { key: 'A', text: 'It is always for someone else. Your own goals feel selfish.' },
      { key: 'B', text: 'You want it but feel unworthy of claiming it out loud.' },
      { key: 'C', text: 'You do not fully commit — commitment means potential loss.' },
      { key: 'D', text: 'You over-plan, over-prepare, and punish yourself if it fails.' },
      { key: 'E', text: 'You feel the weight of every past failure before you begin.' },
      { key: 'F', text: 'You are too depleted to sustain the effort. The goal dies quietly.' },
      { key: 'G', text: 'You abandon it before anyone can say you were not good enough.' },
    ],
    isFree: false,
  },
  {
    id: 20,
    question: 'The phrase "put your own oxygen mask on first" makes you feel:',
    answers: [
      { key: 'A', text: 'Guilty. There are people who need me right now.' },
      { key: 'B', text: 'Lost. You were never taught how to give to yourself.' },
      { key: 'C', text: 'Terrified. Relying on yourself means no one is coming.' },
      { key: 'D', text: 'Anxious. You cannot relax until everyone else is safe.' },
      { key: 'E', text: 'Grief. You have been holding your own breath for so long.' },
      { key: 'F', text: 'Practical. But you still will not do it.' },
      { key: 'G', text: 'Invisible. You did not know your mask existed.' },
    ],
    isFree: false,
  },
  {
    id: 21,
    question: 'Your relationship with sleep is:',
    answers: [
      { key: 'A', text: 'You stay up too late — it is the only time that is yours.' },
      { key: 'B', text: 'Your mind replays conversations and unsaid words on a loop.' },
      { key: 'C', text: 'You stay lightly alert. Full surrender to sleep feels unsafe.' },
      { key: 'D', text: 'You structure your bedtime like a military operation.' },
      { key: 'E', text: 'You dream vividly, painfully. Sleep is not restful.' },
      { key: 'F', text: 'You collapse into it. But wake up more tired than when you went down.' },
      { key: 'G', text: 'You do not notice how poor it is because you do not notice your own needs.' },
    ],
    isFree: false,
  },
  {
    id: 22,
    question: 'How do you process loss?',
    answers: [
      { key: 'A', text: 'You help everyone else grieve. Your own grief can wait.' },
      { key: 'B', text: 'You go silent. The loss is too big for language.' },
      { key: 'C', text: 'You shut down emotionally and brace for the next one.' },
      { key: 'D', text: 'You intellectualize it. Feelings are inefficient.' },
      { key: 'E', text: 'You feel all of it. For longer than anyone thinks is appropriate.' },
      { key: 'F', text: 'You add it to the weight and keep walking. There is no time to stop.' },
      { key: 'G', text: 'You minimize it. Other people had it worse.' },
    ],
    isFree: false,
  },
  {
    id: 23,
    question: 'What makes you feel most alive?',
    answers: [
      { key: 'A', text: 'Knowing you made a difference in someone\'s day.' },
      { key: 'B', text: 'Being truly heard. Without having to explain yourself.' },
      { key: 'C', text: 'Feeling safe with someone. Really safe.' },
      { key: 'D', text: 'Mastering something. Being the person who can handle it.' },
      { key: 'E', text: 'Deep connection. Feeling everything with someone.' },
      { key: 'F', text: 'Rest. Real rest. The kind where you forget what tired means.' },
      { key: 'G', text: 'Being chosen. Someone seeing you and deciding you matter.' },
    ],
    isFree: false,
  },
  {
    id: 24,
    question: 'The body symptom that scares you most is:',
    answers: [
      { key: 'A', text: 'Sudden collapse — your body finally forcing you to stop.' },
      { key: 'B', text: 'Losing your voice or ability to speak clearly.' },
      { key: 'C', text: 'Panic attacks — your body betraying your sense of safety.' },
      { key: 'D', text: 'Losing control of a bodily function or movement.' },
      { key: 'E', text: 'Unexplained pain that moves and has no clear source.' },
      { key: 'F', text: 'Complete exhaustion that no amount of sleep resolves.' },
      { key: 'G', text: 'Skin outbreaks or allergic reactions before important events.' },
    ],
    isFree: false,
  },
  {
    id: 25,
    question: 'When was the last time you cried?',
    answers: [
      { key: 'A', text: 'You cannot remember. Tears feel like they belong to someone else.' },
      { key: 'B', text: 'Alone. In the shower or the car. The only safe places.' },
      { key: 'C', text: 'A long time ago. Crying feels like falling apart, and falling apart is dangerous.' },
      { key: 'D', text: 'You almost did, but controlled it. Crying is inefficient.' },
      { key: 'E', text: 'Recently. Over something small. The grief was already there, waiting.' },
      { key: 'F', text: 'You do not have time to cry. You will later. (You will not.)' },
      { key: 'G', text: 'You do not remember. You might have cried without realizing it.' },
    ],
    isFree: false,
  },
  {
    id: 26,
    question: 'If your body could speak, it would say:',
    answers: [
      { key: 'A', text: '"I have been carrying too much for too long. Put me down."' },
      { key: 'B', text: '"I have been screaming. You have not been listening."' },
      { key: 'C', text: '"I am still waiting to feel safe. When is that happening?"' },
      { key: 'D', text: '"You cannot control me. Stop trying."' },
      { key: 'E', text: '"I remember everything you refused to feel. I am holding it now."' },
      { key: 'F', text: '"I am done. There is nothing left to run on."' },
      { key: 'G', text: '"I exist. I am here. Please notice me."' },
    ],
    isFree: false,
  },
  {
    id: 27,
    question: 'What is the one thing you wish someone would say to you?',
    answers: [
      { key: 'A', text: '"You do not have to earn rest. You have done enough."' },
      { key: 'B', text: '"I want to hear what you have been holding. Take your time."' },
      { key: 'C', text: '"I am not going anywhere. You are safe here."' },
      { key: 'D', text: '"You do not have to be strong for me. I can handle it."' },
      { key: 'E', text: '"Your grief is valid. It does not have an expiration date."' },
      { key: 'F', text: '"Stop. Just stop. You are allowed to stop."' },
      { key: 'G', text: '"I see you. Not who you pretend to be. You."' },
    ],
    isFree: false,
  },
  {
    id: 28,
    question: 'The pattern your family trained you into was:',
    answers: [
      { key: 'A', text: 'Be the helper. The responsible one. The one who holds it together.' },
      { key: 'B', text: 'Do not make waves. Your truth is too much for this household.' },
      { key: 'C', text: 'Be grateful you have what you have. Do not ask for more.' },
      { key: 'D', text: 'Achieve. Perform. Worth is conditional.' },
      { key: 'E', text: 'Feel what no one else will feel. Be the emotional sponge.' },
      { key: 'F', text: 'Be the easy child. The one who never adds to the chaos.' },
      { key: 'G', text: 'Disappear when things get hard. Make yourself useful, not present.' },
    ],
    isFree: false,
  },
  {
    id: 29,
    question: 'Healing, for you, means:',
    answers: [
      { key: 'A', text: 'Learning to receive without guilt.' },
      { key: 'B', text: 'Speaking your truth and surviving the fallout.' },
      { key: 'C', text: 'Trusting someone fully. Without proof. Without armor.' },
      { key: 'D', text: 'Letting go of control and discovering you are still okay.' },
      { key: 'E', text: 'Feeling the grief fully and finding out you do not drown.' },
      { key: 'F', text: 'Saying no. Resting. Without the world collapsing.' },
      { key: 'G', text: 'Taking up space. Wanting things. Being seen without flinching.' },
    ],
    isFree: false,
  },
  {
    id: 30,
    question: 'If you could leave one pattern behind forever, it would be:',
    answers: [
      { key: 'A', text: 'The belief that your worth is measured by what you give.' },
      { key: 'B', text: 'The silence that swallows your voice before it reaches the air.' },
      { key: 'C', text: 'The reflex to brace for abandonment in every act of love.' },
      { key: 'D', text: 'The need to control everything because chaos once destroyed you.' },
      { key: 'E', text: 'The grief that has calcified into your bones and will not release.' },
      { key: 'F', text: 'The exhaustion that has become your identity.' },
      { key: 'G', text: 'The invisibility you wear like armor that has fused to your skin.' },
    ],
    isFree: false,
  },
];

export function calculateScores(answers: PatternKey[]): PatternScores {
  const scores: PatternScores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
  for (const answer of answers) {
    scores[answer]++;
  }
  return scores;
}

export function getDominantPattern(scores: PatternScores): PatternKey {
  const entries = Object.entries(scores) as [PatternKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function getRankedPatterns(scores: PatternScores): Array<{ key: PatternKey; score: number; pattern: Pattern }> {
  const entries = Object.entries(scores) as [PatternKey, number][];
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([key, score]) => ({ key, score, pattern: PATTERNS[key] }));
}
