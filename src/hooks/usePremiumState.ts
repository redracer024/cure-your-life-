import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../lib/supabaseClient';

export interface PremiumState {
  isPremium: boolean;
  premiumStatus: any;
  isPremiumLoading: boolean;
  billingMessage: string | null;
  showPaywall: boolean;
  showBillingInfo: boolean;
  setShowPaywall: (show: boolean) => void;
  setShowBillingInfo: (show: boolean) => void;
  setBillingMessage: (msg: string | null) => void;
  refreshPremiumStatus: () => Promise<void>;
}

export function usePremiumState(authUser: any): PremiumState {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);

  const generationRef = useRef(0);
  const refreshPremiumStatus = useCallback(async () => {
    const generation = ++generationRef.current;
    setIsPremiumLoading(true);
    try {
      const response = await authFetch('/api/me/premium');
      if (generationRef.current !== generation) return;
      if (response.status === 401) {
        setPremiumStatus(null);
        setIsPremium(false);
        return;
      }
      const data = await response.json();
      if (generationRef.current !== generation) return;
      setPremiumStatus(data);
      setIsPremium(Boolean(data.isPremium));
    } catch (error) {
      if (generationRef.current !== generation) return;
      console.error('Failed to load premium status:', error);
      setPremiumStatus(null);
      setIsPremium(false);
    } finally {
      if (generationRef.current === generation) {
        setIsPremiumLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshPremiumStatus();
  }, [authUser, refreshPremiumStatus]);

  return {
    isPremium, premiumStatus, isPremiumLoading,
    billingMessage, showPaywall, showBillingInfo,
    setShowPaywall, setShowBillingInfo, setBillingMessage,
    refreshPremiumStatus,
  };
}
