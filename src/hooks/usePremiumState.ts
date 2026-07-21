import { useState, useEffect } from 'react';
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

  const refreshPremiumStatus = async () => {
    setIsPremiumLoading(true);
    try {
      const response = await authFetch('/api/me/premium');
      const data = await response.json();
      setPremiumStatus(data);
      setIsPremium(Boolean(data.isPremium));
    } catch (error) {
      console.error('Failed to load premium status:', error);
      setPremiumStatus(null);
      setIsPremium(false);
    } finally {
      setIsPremiumLoading(false);
    }
  };

  useEffect(() => {
    refreshPremiumStatus();
  }, [authUser]);

  return {
    isPremium, premiumStatus, isPremiumLoading,
    billingMessage, showPaywall, showBillingInfo,
    setShowPaywall, setShowBillingInfo, setBillingMessage,
    refreshPremiumStatus,
  };
}
