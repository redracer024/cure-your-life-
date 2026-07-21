import type { PathNode, MedicalSafety } from '../types';

export interface AilmentCore {
  id: string;
  name: string;
  category: string;
  emotionalRoot: string;
  metaphor: string;
  physiologicalDescription: string;
  sarcasticAdvice: string;
  mindfulnessPrompts: string[];
  physicalTherapyTip: string;
  riskLevel?: 'Low' | 'Moderate' | 'Medical monitoring recommended';
  tags?: string[];
}

export interface AilmentDetail {
  id: string;
  structuredContent?: {
    version?: number;
    hardware?: {
      hapticProfile?: string;
      hapticPattern?: number[];
      uiBackgroundAccent?: string;
    };
    hero?: {
      primaryPattern?: string;
      cascade?: string[];
      tags?: string[];
      safetyPreview?: string;
    };
    biologyPathway?: Array<{
      title: string;
      short?: string;
      detail?: string;
      description?: string;
      expandedDetails?: string;
    }>;
    interpretations?: {
      clinical?: {
        label?: string;
        title?: string;
        sections?: Array<{
          heading: string;
          body: string[];
        }>;
        paragraphs?: string[];
      };
      witty?: {
        label?: string;
        title?: string;
        paragraphs?: string[];
      };
      brutal?: {
        label?: string;
        title?: string;
        paragraphs?: string[];
      };
    };
    reset?: {
      title?: string;
      modality?: string;
      steps?: string[];
    };
    naturalSupport?: {
      title?: string;
      disclaimer?: string;
      items?: Array<{
        label: string;
        detail: string;
      }>;
      avoid?: string[];
    };
    brutalActions?: string[];
    influenceLayers?: Array<{
      layer: number;
      paragraphs?: string[];
      body?: string[];
      text?: string;
      description?: string;
    }>;
  };
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
  biologyPath?: PathNode[];
  medical_safety?: MedicalSafety;
}
