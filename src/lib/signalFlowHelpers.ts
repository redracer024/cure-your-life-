import type { CurrentSignal } from '../types/currentSignal';

export function isMeaningfulSignal(signal: CurrentSignal | null): boolean {
  if (!signal) return false;
  return signal.symptomText.trim().length > 0;
}

export function deriveResumeSummary(signal: CurrentSignal): string {
  const parts: string[] = [];
  if (signal.symptomText.trim()) parts.push(signal.symptomText.trim());
  if (signal.bodyRegion) parts.push(signal.bodyRegion);
  if (signal.bodySide) parts.push(signal.bodySide);
  if (signal.intensity) parts.push(`Intensity ${signal.intensity}/10`);
  if (signal.duration) parts.push(`Duration: ${signal.duration}`);
  if (signal.onset) parts.push(`Onset: ${signal.onset}`);
  return parts.join(' · ');
}

export function isSignalReadyToExplore(signal: CurrentSignal | null): boolean {
  if (!isMeaningfulSignal(signal)) return false;
  if (!signal.bodyRegion) return false;
  if (!signal.medicalSafetyStatus) return false;
  return true;
}

export function getFlowStartingStep(signal: CurrentSignal | null): number {
  if (!isMeaningfulSignal(signal)) return 1;
  if (!signal.bodyRegion) return 2;
  if (!signal.intensity && !signal.duration && !signal.onset) return 3;
  if (signal.medicalSafetyStatus) return 6;
  if (signal.userNotes?.trim()) return 5;
  return 4;
}
