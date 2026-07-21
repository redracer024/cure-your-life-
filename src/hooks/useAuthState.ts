import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AuthState {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authUser: any;
  authMessage: string | null;
  authLoading: boolean;
  handleAuthSubmit: (e: FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useAuthState(): AuthState {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthMessage('Supabase frontend env is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }

    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
        setAuthUser(login.data.user);
        setAuthMessage('Signed in.');
        return;
      }

      const signup = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: { data: { display_name: email.split('@')[0] } },
      });

      if (signup.error) throw signup.error;

      setAuthUser(signup.data.user);
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
      setAuthMessage('Signed out.');
    } catch (error: any) {
      setAuthMessage(error.message || 'Logout failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authUser, authMessage, authLoading,
    handleAuthSubmit, handleLogout,
  };
}
