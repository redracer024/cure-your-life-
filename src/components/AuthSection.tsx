import React from 'react';
import { User } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthSectionProps {
    authUser: any;
    authEmail: string;
    setAuthEmail: (email: string) => void;
    authPassword: string;
    setAuthPassword: (password: string) => void;
    authLoading: boolean;
    authMessage: string | null;
    handleAuthSubmit: (e: React.FormEvent) => Promise<void>;
    handleLogout: () => Promise<void>;
    premiumStatus: any;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
    authUser,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authLoading,
    authMessage,
    handleAuthSubmit,
    handleLogout,
    premiumStatus
}) => {
    return (
        <div className="border-b border-white/10 bg-black/45 backdrop-blur-xl px-6 md:px-10 py-3 relative z-40">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-400 font-black">
                        Supabase Account Link
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                        {isSupabaseConfigured
                            ? authUser
                                ? `Signed in as ${authUser.email || 'Supabase user'}`
                                : 'Not signed in. Premium can still run in DEV_PREMIUM mode.'
                            : 'Frontend Supabase env missing.'}
                    </span>
                    {premiumStatus?.message && (
                        <span className="text-[11px] text-slate-500 font-mono">
                            Premium: {premiumStatus.source || 'unknown'} • {premiumStatus.isPremium ? 'active' : 'locked'}
                        </span>
                    )}
                </div>

                {authUser ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="px-3 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-[11px] font-mono">
                            <User className="inline w-3.5 h-3.5 mr-1" />
                            {authUser.email}
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={authLoading}
                            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAuthSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="email"
                            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[190px]"
                        />
                        <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="password"
                            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 min-w-[160px]"
                        />
                        <button
                            type="submit"
                            disabled={authLoading || !isSupabaseConfigured}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] uppercase tracking-widest font-black font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {authLoading ? 'Working...' : 'Login / Create'}
                        </button>
                    </form>
                )}
            </div>

            {authMessage && (
                <div className="max-w-7xl mx-auto mt-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    {authMessage}
                </div>
            )}
        </div>
    );
};
