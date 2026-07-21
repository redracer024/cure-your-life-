import { useState, type FormEvent } from 'react';
import { SymptomAnalysisResponse } from '../types';
import { authFetch } from '../lib/supabaseClient';

export interface DecoderState {
  customSymptom: string;
  setCustomSymptom: (val: string) => void;
  customHabits: string;
  setCustomHabits: (val: string) => void;
  isDecoding: boolean;
  decodedResult: SymptomAnalysisResponse | null;
  decodeError: string | null;
  setDecodedResult: (result: SymptomAnalysisResponse | null) => void;
  handleDecodeSymptom: (e: FormEvent) => Promise<void>;
}

export function useDecoderState(isPremium: boolean, setShowPaywall: (show: boolean) => void): DecoderState {
  const [customSymptom, setCustomSymptom] = useState('');
  const [customHabits, setCustomHabits] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<SymptomAnalysisResponse | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const handleDecodeSymptom = async (e: FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;

    if (!isPremium) {
      setShowPaywall(true);
      setDecodeError('AI Somatic Decoder is a premium feature. Backend says no. Rude, but financially coherent.');
      return;
    }

    setIsDecoding(true);
    setDecodeError(null);
    setDecodedResult(null);

    try {
      const response = await authFetch('/api/analyze-symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom: customSymptom, habits: customHabits }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402 || data.requiresPremium) setShowPaywall(true);
        throw new Error(data.error || 'Failed to analyze symptom');
      }
      setDecodedResult(data);
    } catch (err: any) {
      setDecodeError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  return {
    customSymptom, setCustomSymptom,
    customHabits, setCustomHabits,
    isDecoding, decodedResult, decodeError, setDecodedResult,
    handleDecodeSymptom,
  };
}
