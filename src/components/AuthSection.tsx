import React from 'react';
import { User, Key, ArrowLeft } from 'lucide-react';
import { authFetch, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { deleteCurrentAccount } from '../lib/account/deleteAccount';

export const AuthSection: React.FC = () => {
  const auth = useAuth();
  const premium = usePremium();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deleteInFlight, setDeleteInFlight] = React.useState(false);
  const [deleteMessage, setDeleteMessage] = React.useState<string | null>(null);
  const currentUserIdRef = React.useRef<string | null>(auth.authUser?.id ?? null);

  React.useEffect(() => {
    currentUserIdRef.current = auth.authUser?.id ?? null;
  }, [auth.authUser?.id]);

  React.useEffect(() => {
    if (auth.authUser) return;
    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');
  }, [auth.authUser]);

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
    <div className="border-b border-white/10 bg-black/45 backdrop-blur-xl px-6 md:px-10 py-3 relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-400 font-black">
            Supabase Account Link
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {isSupabaseConfigured
              ? auth.authUser
                ? `Signed in as ${auth.authUser.email || 'Supabase user'}`
                : 'Not signed in. Premium can still run in DEV_PREMIUM mode.'
              : 'Frontend Supabase env missing.'}
          </span>
          {premium.premiumStatus?.message && (
            <span className="text-[11px] text-slate-500 font-mono">
              Premium: {premium.premiumStatus.source || 'unknown'} • {premium.premiumStatus.isPremium ? 'active' : 'locked'}
            </span>
          )}
        </div>

        {auth.authUser ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="px-3 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-[11px] font-mono">
              <User className="inline w-3.5 h-3.5 mr-1" />
              {auth.authUser.email}
            </div>
            <button
              type="button"
              onClick={auth.handleLogout}
              disabled={auth.authLoading || deleteInFlight}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
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
              className="px-4 py-2 rounded-xl border border-red-500/40 text-red-200 hover:text-red-100 hover:bg-red-500/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
            >
              Delete account
            </button>
          </div>
        ) : (
          <form onSubmit={auth.handleAuthSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              type="email"
              value={auth.authEmail}
              onChange={(e) => auth.setAuthEmail(e.target.value)}
              placeholder="email"
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[190px]"
            />
            <input
              type="password"
              value={auth.authPassword}
              onChange={(e) => auth.setAuthPassword(e.target.value)}
              placeholder="password"
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[160px]"
            />
            <button
              type="submit"
              disabled={auth.authLoading || !isSupabaseConfigured}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {auth.authLoading ? 'Working...' : 'Login / Create'}
            </button>
          </form>
        )}
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
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
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
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
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
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black text-[11px] uppercase tracking-widest font-black disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black disabled:opacity-50"
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
