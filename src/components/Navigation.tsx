import React from 'react';

interface NavigationProps {
    activeTab: 'dictionary' | 'decoder' | 'daily' | 'journal';
    setActiveTab: (tab: 'dictionary' | 'decoder' | 'daily' | 'journal') => void;
    openDecoder: () => void;
    isPremium: boolean;
    setShowPaywall: (show: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
    activeTab,
    setActiveTab,
    openDecoder,
    isPremium,
    setShowPaywall
}) => {
    return (
        <>
            {/* Header Navigation with Real Glassmorphism */}
            <nav className="h-20 border-b border-white/10 flex items-center justify-between px-6 md:px-10 flex-shrink-0 bg-[#07080d]/60 backdrop-blur-xl sticky top-0 z-50 relative">
                <div
                    onClick={() => setActiveTab('dictionary')}
                    className="text-2xl font-black tracking-tighter not-italic cursor-pointer hover:opacity-95 transition-opacity flex items-center gap-2 font-display"
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Cure Your Life</span>
                    <span className="bg-gradient-to-br from-red-500 to-rose-600 border border-red-400/30 text-white text-[11px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                        +
                    </span>
                </div>

                <div className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 font-display">
                    <button
                        onClick={() => setActiveTab('dictionary')}
                        className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'dictionary' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
                    >
                        Psychosomatic Dictionary
                    </button>
                    <button
                        onClick={openDecoder}
                        className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'decoder' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
                    >
                        AI Somatic Decoder
                    </button>
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'daily' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
                    >
                        Somatic Reflections
                    </button>
                    <button
                        onClick={() => setActiveTab('journal')}
                        className={`cursor-pointer hover:text-white transition-all pb-1 ${activeTab === 'journal' ? 'text-indigo-400 border-b-2 border-indigo-500' : ''}`}
                    >
                        Somatic Journal
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowPaywall(true)}
                        className={`px-4 py-2 font-bold uppercase text-[11px] tracking-widest transition-all rounded-xl cursor-pointer ${isPremium
                            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105'
                            : 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)] backdrop-blur-md'
                            }`}
                    >
                        {isPremium ? '✦ Premium Active' : '✦ Unlock Premium'}
                    </button>

                    <button
                        onClick={openDecoder}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold uppercase text-[11px] tracking-widest transition-all rounded-xl cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    >
                        Analyze Symptom
                    </button>
                </div>
            </nav>

            {/* Mobile Nav Bar with Glassmorphism */}
            <div className="md:hidden flex border-b border-white/10 bg-[#07080d]/80 backdrop-blur-xl justify-around py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 relative z-40 font-display">
                <button
                    onClick={() => setActiveTab('dictionary')}
                    className={`${activeTab === 'dictionary' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                    Dictionary
                </button>
                <button
                    onClick={openDecoder}
                    className={`${activeTab === 'decoder' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                    AI Decoder
                </button>
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`${activeTab === 'daily' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                    Reflections
                </button>
                <button
                    onClick={() => setActiveTab('journal')}
                    className={`${activeTab === 'journal' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                    Journal
                </button>
            </div>
        </>
    );
};
