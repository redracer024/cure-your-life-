import React, { createContext, useContext } from 'react';
import { usePremiumState, PremiumState } from '../hooks/usePremiumState';
import { useAuth } from './AuthContext';

const PremiumContext = createContext<PremiumState | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const premium = usePremiumState(auth.authUser);
  return <PremiumContext.Provider value={premium}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
