export interface PathNode {
  title: string;
  description: string;
  expandedDetails: string;
}

export interface MedicalSafety {
  critical_alerts: string[];
  seek_immediate_care_if: string[];
  schedule_care_if: string[];
  self_care_allowed_if: string;
  do_not_ignore: string;
  disclaimer: string;
}

export interface Ailment {
  structuredContent?: any;
  id: string;
  name: string;
  category: string;
  emotionalRoot: string;
  metaphor: string;
  physiologicalDescription: string;
  sarcasticAdvice: string;
  mindfulnessPrompts: string[];
  physicalTherapyTip: string;
  // Expanded Premium Fields
  tags?: string[];
  riskLevel?: 'Low' | 'Moderate' | 'Medical monitoring recommended';
  biologyPath?: PathNode[];
  tones?: {
    clinical: {
      mechanism: string;
      protocol: string[];
      citations: string[];
    };
    witty: {
      metaphorTitle: string;
      metaphorText: string;
      wittyAdvice: string;
      visualWarehouseDescription?: string;
    };
    brutal: {
      realityCheck: string;
      protocolTitle: string;
      protocolSteps: string[];
    };
  };
  medical_safety?: MedicalSafety;
}

export interface SymptomAnalysisResponse {
  analysisContractVersion?: string;
  medical?: {
    possibleMedicalContext: string;
    redFlags: string[];
    whenToSeekCare: string;
    uncertainty: string;
  };
  mindBody?: {
    evidenceLevel: string;
    possibleContributors: string[];
    symptomAmplifiers: string[];
    behavioralFactors: string[];
    noKnownEmotionalCause: boolean;
  };
  reflection?: {
    somaticQuestions: string[];
    relationshipQuestions: string[];
    behavioralQuestions: string[];
    optionalPractices: string[];
  };
  traditional?: {
    framework: string;
    proposedMeaningOrCause: string;
    attribution: string;
    evidenceStatus: string;
  };
  claimBoundaries?: string[];
  emotionalRoot: string;
  physiologicalDescription: string;
  sarcasticReview: string;
  mindfulnessPrompts: string[];
  practicalTips: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAnalysis?: boolean;
  analysisData?: SymptomAnalysisResponse;
}

export interface DailyPrompt {
  id: string;
  prompt: string;
  category: string;
  reflectionQuestion: string;
  sarcasticQuote: string;
}

export interface SomaticJournalEntry {
  id: string;
  date: string;
  physicalSymptom: string;
  emotionalState: string;
  descriptionOfDay: string;
  potentialConnection?: string;
  sarcasticReview?: string;
  intensity: number;
  reflectionPrompt?: string;
  reflectionResponse?: string;
  sourcePatternId?: string;
  sourcePatternName?: string;
}
