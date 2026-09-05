import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import type { CurrentSignal, CurrentSignalPatch, SignalStatus, CreateCurrentSignalInput } from '../types/currentSignal';
import {
  loadCurrentSignal,
  saveCurrentSignal,
  clearCurrentSignal,
  createDefaultSignal,
} from '../lib/storage/currentSignalStorage';

export interface CurrentSignalState {
  currentSignal: CurrentSignal | null;
  isLoading: boolean;
  startSignal: (partial?: CreateCurrentSignalInput) => void;
  patchSignal: (patch: CurrentSignalPatch) => void;
  clearSignal: () => void;
  saveSignal: () => void;
  setSignalStatus: (status: SignalStatus) => void;
}

const CurrentSignalContext = createContext<CurrentSignalState | undefined>(undefined);

export function CurrentSignalProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [currentSignal, setCurrentSignal] = useState<CurrentSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authUserId = auth.authUser?.id;
  const owner = useMemo(() => {
    if (!auth.authResolved) return null;
    if (authUserId) return { kind: 'user' as const, userId: authUserId };
    return { kind: 'anonymous' as const };
  }, [auth.authResolved, authUserId]);

  const ownerRef = useRef(owner);
  ownerRef.current = owner;

  useEffect(() => {
    if (!owner) {
      setCurrentSignal(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = loadCurrentSignal(owner);
    if (result.status === 'loaded' && result.signal) {
      setCurrentSignal(result.signal);
    } else {
      setCurrentSignal(null);
    }
    setIsLoading(false);
  }, [owner]);

  const persist = useCallback((signal: CurrentSignal | null) => {
    const currentOwner = ownerRef.current;
    if (!currentOwner) return;
    saveCurrentSignal(signal, currentOwner);
  }, []);

  const startSignal = useCallback((partial?: CreateCurrentSignalInput) => {
    const next = createDefaultSignal(partial);
    setCurrentSignal(next);
    persist(next);
  }, [persist]);

  const patchSignal = useCallback((patch: CurrentSignalPatch) => {
    setCurrentSignal((prev) => {
      if (!prev) return prev;
      const next: CurrentSignal = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const clearSignal = useCallback(() => {
    setCurrentSignal(null);
    const currentOwner = ownerRef.current;
    if (currentOwner) {
      clearCurrentSignal(currentOwner);
    }
  }, []);

  const saveSignal = useCallback(() => {
    setCurrentSignal((prev) => {
      if (!prev) return prev;
      const next: CurrentSignal = {
        ...prev,
        status: 'saved',
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const setSignalStatus = useCallback((status: SignalStatus) => {
    setCurrentSignal((prev) => {
      if (!prev) return prev;
      const next: CurrentSignal = {
        ...prev,
        status,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo(() => ({
    currentSignal,
    isLoading,
    startSignal,
    patchSignal,
    clearSignal,
    saveSignal,
    setSignalStatus,
  }), [currentSignal, isLoading, startSignal, patchSignal, clearSignal, saveSignal, setSignalStatus]);

  return (
    <CurrentSignalContext.Provider value={value}>
      {children}
    </CurrentSignalContext.Provider>
  );
}

export function useCurrentSignal(): CurrentSignalState {
  const ctx = useContext(CurrentSignalContext);
  if (!ctx) {
    throw new Error('useCurrentSignal must be used within CurrentSignalProvider');
  }
  return ctx;
}
