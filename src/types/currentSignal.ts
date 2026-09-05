export type SignalStatus = 'draft' | 'active' | 'saved';

export interface CurrentSignal {
  id: string;
  status: SignalStatus;
  createdAt: string;
  updatedAt: string;
  symptomText: string;
  ailmentId?: string;
  ailmentTitle?: string;
  bodyRegion?: string;
  bodySide?: string;
  bodyLocationDetail?: string;
  intensity?: number;
  duration?: string;
  onset?: string;
  userNotes?: string;
  medicalSafetyStatus?: 'none' | 'monitor' | 'urgent';
  redFlags?: string[];
  uncertaintyNote?: string;
  selectedLenses?: string[];
  reflectionReference?: string;
  aiAnalysisReference?: string;
  journalSaveReference?: string;
}

export type CurrentSignalPatch = Partial<Omit<CurrentSignal, 'id' | 'createdAt'>>;
export type CreateCurrentSignalInput = {
  [K in keyof Omit<CurrentSignal, 'id' | 'createdAt' | 'updatedAt'>]?: CurrentSignal[K];
};
