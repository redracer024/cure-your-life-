export interface PatternSubPattern {
  name: string;
  description: string;
}

export interface PatternPairing {
  pairsWith: string;
  looksLike: string;
}

export interface PatternProfile {
  mainMetaphor?: string;
  narrativeAnalogy?: string;
  paragraphs: string[];
}

export interface PatternResetProtocol {
  title?: string;
  steps: string[];
}

export interface PatternBoundaryPractice {
  title?: string;
  items: string[];
}

export interface SomaticJungianArchetype {
  name: string;
  items: string[];
}

export interface SomaticContext {
  jungianArchetypes?: SomaticJungianArchetype[];
  additionalItems?: string[];
}

export interface MindMapBranchConfig {
  /** Key of the branch to customize */
  key: string;
  /** Custom label to display */
  label?: string;
  /** Whether to show this branch */
  show?: boolean;
}

export interface MindMapBranch {
  id: string;
  label: string;
  description?: string;
  children?: MindMapBranch[];
}

export interface MindMapConfig {
  /** Custom labels for branches */
  branchLabels?: {
    coreProfile?: string;
    coreBeliefs?: string;
    protectiveStrategies?: string;
    bodyThemes?: string;
    somaticManifestations?: string;
    emotionalSignature?: string;
    subPatterns?: string;
    behavioralSubPatterns?: string;
    origins?: string;
    relationshipPattern?: string;
    relationshipPatterns?: string;
    patternPairings?: string;
    resetProtocol?: string;
    somaticContext?: string;
    deeperContext?: string;
    linkedSymptoms?: string;
    [key: string]: string | undefined;
  };
  /** Custom ordering of branch keys (branches not listed appear at end in default order) */
  branchOrder?: string[];
  /** Branches to hide entirely */
  hideBranches?: string[];
  /** Custom nested branch structures */
  branches?: {
    [key: string]: {
      children: MindMapBranch[];
    };
  };
}

export interface PatternLoopStage {
  stage: string;
  label: string;
  value: string;
}

export interface DayInLifeEntry {
  timeLabel: string;
  title: string;
  narrative: string;
}

export interface RelationshipLens {
  context: string;
  title: string;
  description: string;
}

export interface NervousSystemProfile {
  defaultResponse: string;
  threatScan: string;
  activationSigns: string[];
  shutdownSigns: string[];
  bodyHoldingPatterns: string[];
  regulationNeeds: string[];
}

export interface WisdomPerspective {
  id: string;
  label: string;
  question: string;
  content: string;
  reflection: string;
}

export interface RecoveryStage {
  stage: number;
  title: string;
  goal: string;
  description: string;
  practice: string;
}

export interface PatternEntry {
  id: string;
  name: string;
  quizKey?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  category: 'core' | 'sub';
  rootPatterns?: string[];
  shortDescription: string;
  coreBelief: string;
  coreBeliefs?: string[];
  protectiveStrategy: string;
  emotionalSignature: string[];
  relationshipPattern: string;
  bodyThemes: string;
  commonLinkedSymptoms: string[];
  subPatterns: PatternSubPattern[];
  whereItOftenStarts: string[];
  howItProtectsYou: string;
  howItHurtsYouNow: string;
  seriousProfile: string[];
  wittyProfile: PatternProfile;
  brutalProfile: string[];
  resetProtocol: PatternResetProtocol;
  resetProtocolLabel?: string;
  boundaryPractice: PatternBoundaryPractice;
  journalPrompts: string[];
  quizAnswerPhrases: string[];
  patternPairings: PatternPairing[];
  somaticContext?: SomaticContext;
  mindMapConfig?: MindMapConfig;
  safetyGuardrail: string;
  color: string;
  glowColor: string;
  // Extended prototype fields (Martyr first)
  patternLoop?: PatternLoopStage[];
  strengths?: string[];
  whatItIsNot?: string[];
  dayInTheLife?: DayInLifeEntry[];
  innerMonologue?: string[];
  patternVoice?: string[];
  relationshipLenses?: RelationshipLens[];
  nervousSystemProfile?: NervousSystemProfile;
  wisdomPerspectives?: WisdomPerspective[];
  recoveryRoadmap?: RecoveryStage[];
  originalQuotes?: string[];
  // Body map split fields
  stressAndBody?: string[];
  symbolicBodyMap?: { area: string; meaning: string }[];
}
