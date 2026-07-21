import React from 'react';
import { User } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';

export const AuthSection: React.FC = () => {
  const auth = useAuth();
  const premium = usePremium();

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
              disabled={auth.authLoading}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
            >
              Logout
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

      {auth.authMessage && (
        <div className="max-w-7xl mx-auto mt-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {auth.authMessage}
        </div>
      )}
    </div>
  );
};
