import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../lib/supabaseClient';
import type { AuthStatus } from './useAuthState';
import type { AuthMode } from '../lib/auth/authRedirect';

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

interface UsePremiumStateDeps {
  authUser: { id: string; email?: string } | null;
  authStatus: AuthStatus;
  authMode: AuthMode;
}

export function usePremiumState(deps: UsePremiumStateDeps): PremiumState {
  const { authUser, authStatus, authMode } = deps;

  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);

  const generationRef = useRef(0);
  const lastAuthenticatedUserIdRef = useRef<string | null>(null);

  const isClearStatus =
    authStatus === 'anonymous' ||
    authStatus === 'session-expired';

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
      setIsPremium(Boolean(data?.isPremium));
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
    if (authStatus === 'authenticated' && authUser) {
      if (authMode === 'recovery' || authMode === 'confirm') return;

      if (lastAuthenticatedUserIdRef.current === authUser.id) {
        return;
      }
      lastAuthenticatedUserIdRef.current = authUser.id;

      generationRef.current += 1;
      refreshPremiumStatus();
      return;
    }

    if (isClearStatus) {
      generationRef.current += 1;
      setPremiumStatus(null);
      setIsPremium(false);
      setIsPremiumLoading(false);
    }
  }, [authUser, authStatus, authMode, refreshPremiumStatus, isClearStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      lastAuthenticatedUserIdRef.current = authUser?.id ?? null;
    }
  }, [authStatus, authUser]);

  return {
    isPremium, premiumStatus, isPremiumLoading,
    billingMessage, showPaywall, showBillingInfo,
    setShowPaywall, setShowBillingInfo, setBillingMessage,
    refreshPremiumStatus,
  };
}
