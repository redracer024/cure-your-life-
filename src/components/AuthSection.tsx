import React, { useState, useEffect } from 'react';
import { User, Key, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { authFetch, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { deleteCurrentAccount } from '../lib/account/deleteAccount';

export const AuthSection: React.FC = () => {
  const auth = useAuth();
  const premium = usePremium();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteInFlight, setDeleteInFlight] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [authExpanded, setAuthExpanded] = useState(false);
  const currentUserIdRef = React.useRef<string | null>(auth.authUser?.id ?? null);

  useEffect(() => {
    currentUserIdRef.current = auth.authUser?.id ?? null;
  }, [auth.authUser?.id]);

  useEffect(() => {
    if (auth.authUser) return;
    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');
  }, [auth.authUser]);

  useEffect(() => {
    if (auth.authMode === 'recovery' || auth.authMode === 'confirm') {
      setAuthExpanded(true);
    }
  }, [auth.authMode]);

  const handleDeleteAccount = async () => {
    if (deleteInFlight) return;

    const signedInUserId = auth.authUser?.id?.trim() ?? '';
    if (!signedInUserId) {
      setDeleteMessage('No signed-in account found.');
      return;
    }

    setDeleteInFlight(true);
    setDeleteMessage(null);

    const result = await deleteCurrentAccount(signedInUserId, {
      requestDelete: () =>
        authFetch('/api/me/account', {
          method: 'DELETE',
        }),
      getCurrentUserId: () => currentUserIdRef.current,
      signOut: auth.handleLogout,
    });

    if (currentUserIdRef.current && currentUserIdRef.current !== signedInUserId) {
      setDeleteInFlight(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
      return;
    }

    if (result.status === 'network-error') {
      setDeleteMessage('Account deletion could not be completed due to a network issue. Please try again.');
      setDeleteInFlight(false);
      return;
    }

    if (result.status === 'server-error') {
      setDeleteMessage('Account deletion could not be completed right now. Please try again.');
      setDeleteInFlight(false);
      return;
    }

    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');
    if (result.cleanupWarning) {
      setDeleteMessage('Account deleted. Some browser-local data could not be cleared.');
    } else if (result.signedOut) {
      setDeleteMessage('Account deleted. Signed out successfully.');
    } else {
      setDeleteMessage('Account deleted.');
    }
    setDeleteInFlight(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = auth.recoveryEmail.trim();
    if (!email) {
      auth.setAuthMessage('Please enter your email address.');
      return;
    }
    await auth.requestPasswordReset(email);
    if (!auth.resetPasswordLoading) {
      auth.setRecoveryEmail('');
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = auth.authPassword;
    const confirm = (e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement)?.value ?? '';
    await auth.submitNewPassword(password, confirm);
  };

  const showRecoveryRequest = auth.authMode === 'recovery' && !auth.authUser;
  const showConfirmRequest = auth.authMode === 'confirm' && !auth.authUser;
  const isRecoveryMode = auth.authMode === 'recovery' && Boolean(auth.authUser);

  return (
    <div className="border-b border-white/10 bg-black/45 backdrop-blur-xl px-4 md:px-10 py-2 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {auth.authUser ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-[11px] font-mono">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">{auth.authUser.email}</span>
            </div>
            <button
              type="button"
              onClick={auth.handleLogout}
              disabled={auth.authLoading || deleteInFlight}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 transition-colors"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteMessage(null);
                setDeleteConfirmOpen((open) => !open);
                setDeleteConfirmText('');
              }}
              disabled={auth.authLoading || deleteInFlight}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-300 hover:text-red-100 hover:bg-red-500/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuthExpanded((prev) => !prev)}
              aria-expanded={authExpanded}
              aria-controls="compact-auth-form"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-[11px] uppercase tracking-widest font-black font-mono transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              {authExpanded ? 'Close' : 'Sign in'}
            </button>
            {!authExpanded && (
              <button
                type="button"
                onClick={() => setAuthExpanded(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create account
              </button>
            )}
          </div>
        )}
      </div>

      <div
        id="compact-auth-form"
        className={`max-w-7xl mx-auto mt-3 transition-all duration-300 ${authExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >
        <form
          onSubmit={auth.handleAuthSubmit}
          className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto"
        >
          <input
            type="email"
            value={auth.authEmail}
            onChange={(e) => auth.setAuthEmail(e.target.value)}
            placeholder="email"
            autoComplete="email"
            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-full sm:min-w-[190px]"
          />
          <input
            type="password"
            value={auth.authPassword}
            onChange={(e) => auth.setAuthPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-full sm:min-w-[160px]"
          />
          <button
            type="submit"
            disabled={auth.authLoading || !isSupabaseConfigured}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {auth.authLoading ? 'Working...' : 'Login / Create'}
          </button>
        </form>
      </div>

      {showRecoveryRequest && (
        <div className="max-w-7xl mx-auto mt-3 rounded-xl border border-slate-500/20 bg-slate-500/5 px-3 py-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <Key className="w-3.5 h-3.5" />
            <span>Forgot your password?</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-2">
            Enter your email and we'll send you a password reset link.
          </p>
          <form onSubmit={handleForgotPassword} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={auth.recoveryEmail}
              onChange={(e) => auth.setRecoveryEmail(e.target.value)}
              placeholder="email address"
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 w-full sm:w-60"
            />
            <button
              type="submit"
              disabled={auth.resetPasswordLoading || !isSupabaseConfigured}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 transition-colors"
            >
              {auth.resetPasswordLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
      )}

      {showConfirmRequest && (
        <div className="max-w-7xl mx-auto mt-3 rounded-xl border border-slate-500/20 bg-slate-500/5 px-3 py-3 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Confirming your email address…</span>
          </div>
        </div>
      )}

      {isRecoveryMode && (
        <div className="max-w-7xl mx-auto mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-cyan-300 mb-2">
            <Key className="w-3.5 h-3.5" />
            <span>Set a new password</span>
          </div>
          <form onSubmit={handleSetNewPassword} className="flex flex-col gap-2 w-full sm:w-72">
            <input
              type="password"
              name="newPassword"
              value={auth.authPassword}
              onChange={(e) => auth.setAuthPassword(e.target.value)}
              placeholder="new password (min 8 characters)"
              minLength={8}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="confirm new password"
              minLength={8}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={auth.authLoading || !isSupabaseConfigured}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 transition-colors"
            >
              {auth.authLoading ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        </div>
      )}

      {auth.authUser && deleteConfirmOpen && (
        <div className="max-w-7xl mx-auto mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-[11px] font-mono text-red-100">
          <p className="leading-relaxed">
            Account deletion is permanent. Your account and associated account data will be deleted. Any active subscription for this account will be cancelled during deletion. Browser-local data for this account will be cleared after server confirmation.
          </p>
          <label className="block mt-3 text-red-200 uppercase tracking-[0.18em] text-[10px]">Type DELETE to confirm</label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            className="mt-2 w-full sm:w-60 bg-black/50 border border-red-300/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-red-200/50 focus:outline-none focus:border-red-300/70"
          />
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteInFlight || deleteConfirmText !== 'DELETE'}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black text-[11px] uppercase tracking-widest font-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteInFlight ? 'Deleting...' : 'Permanently delete account'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteInFlight) return;
                setDeleteConfirmOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={deleteInFlight}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {auth.authMessage && (
        <div className="max-w-7xl mx-auto mt-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {auth.authMessage}
        </div>
      )}

      {deleteMessage && (
        <div className="max-w-7xl mx-auto mt-2 text-[11px] font-mono text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {deleteMessage}
        </div>
      )}
    </div>
  );
};
