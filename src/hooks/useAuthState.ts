import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAuthMode, getRecoveryCode, clearAuthParams, type AuthMode } from '../lib/auth/authRedirect';
import { sanitizeAuthError } from '../lib/auth/authErrorMessages';

interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthState {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authUser: AuthUser | null;
  authResolved: boolean;
  authMessage: string | null;
  authLoading: boolean;
  authMode: AuthMode;
  recoveryEmail: string;
  setRecoveryEmail: (email: string) => void;
  resetPasswordLoading: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
  submitNewPassword: (newPassword: string, confirm: string) => Promise<void>;
  handleAuthSubmit: (e: FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
}

function getRedirectTo(): string {
  const origin = window.location.origin;
  return `${origin}/?auth=recovery`;
}

export function useAuthState(): AuthState {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [codeExchanged, setCodeExchanged] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const mode = getAuthMode(search);
    setAuthMode(mode);

    if (mode === 'recovery') {
      const code = getRecoveryCode(search);
      if (code && supabase && !codeExchanged) {
        setCodeExchanged(true);
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            setAuthMessage(sanitizeAuthError(error));
          } else {
            setAuthMessage(null);
          }
          clearAuthParams();
        });
      }
    }
    if (mode === 'confirm') {
      const code = getRecoveryCode(search);
      if (code && supabase && !codeExchanged) {
        setCodeExchanged(true);
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            setAuthMessage(sanitizeAuthError(error));
          }
          clearAuthParams();
        });
      }
    }
  }, [codeExchanged]);

  useEffect(() => {
    if (!supabase) {
      setAuthMessage('Supabase frontend env is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      setAuthResolved(true);
      return;
    }

    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setAuthUser((data.session?.user as AuthUser | null) ?? null);
        setAuthResolved(true);
      })
      .catch(() => {
        if (!alive) return;
        setAuthUser(null);
        setAuthResolved(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;

      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('recovery');
        setAuthMessage(null);
        return;
      }

      setAuthUser((session?.user as AuthUser | null) ?? null);
      setAuthResolved(true);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function requestPasswordReset(email: string): Promise<void> {
    if (!supabase) {
      setAuthMessage('Supabase is not configured on the frontend.');
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setAuthMessage('Please enter your email address.');
      return;
    }
    setResetPasswordLoading(true);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getRedirectTo(),
      });
      if (error) {
        setAuthMessage(sanitizeAuthError(error));
      } else {
        setAuthMessage('If an account exists for that email, you will receive a password reset link.');
      }
    } finally {
      setResetPasswordLoading(false);
    }
  }

  async function submitNewPassword(newPassword: string, confirm: string): Promise<void> {
    if (!supabase) {
      setAuthMessage('Supabase is not configured on the frontend.');
      return;
    }
    if (newPassword.length < 8) {
      setAuthMessage('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setAuthMessage('Passwords do not match.');
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setAuthMessage(sanitizeAuthError(error));
      } else {
        setAuthMessage('Your password has been updated.');
        setAuthMode(null);
        clearAuthParams();
      }
    } finally {
      setAuthLoading(false);
    }
  }

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthMessage('Supabase is not configured on the frontend.');
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage('Enter an email and password first.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const email = authEmail.trim();
      const login = await supabase.auth.signInWithPassword({ email, password: authPassword });

      if (!login.error) {
        setAuthUser((login.data.user as AuthUser | null) ?? null);
        setAuthResolved(true);
        setAuthMessage('Signed in.');
        return;
      }

      const signup = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: { data: { display_name: email.split('@')[0] } },
      });

      if (signup.error) throw signup.error;

      setAuthUser((signup.data.user as AuthUser | null) ?? null);
      setAuthResolved(true);
      setAuthMessage(signup.data.session ? 'Account created and signed in.' : 'Account created. Check email.');
    } catch (error: any) {
      setAuthMessage(error.message || 'Supabase auth failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      setAuthResolved(true);
      setAuthMessage('Signed out.');
      setAuthMode(null);
      clearAuthParams();
    } catch (error: any) {
      setAuthMessage(error.message || 'Logout failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authUser, authResolved, authMessage, authLoading,
    authMode,
    recoveryEmail, setRecoveryEmail,
    resetPasswordLoading,
    requestPasswordReset,
    submitNewPassword,
    handleAuthSubmit, handleLogout,
  };
}
