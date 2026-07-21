import React from 'react';
import { AlertOctagon, Sparkles, ChevronRight, Compass } from 'lucide-react';

export const AppHeader: React.FC = () => {
    return (
        <>
            {/* Global Disclaimer Banner */}
            <div className="bg-red-950/20 border border-red-500/25 p-5 md:px-6 rounded-2xl text-xs text-red-200 shadow-lg relative overflow-hidden backdrop-blur-md mb-2 shrink-0 w-full">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                <div className="flex gap-4.5 items-start">
                    <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-red-400 block font-black">
                            CRITICAL MEDICAL STANDARDS & PHARMACEUTICAL REASSURANCE
                        </span>
                        <p className="leading-7 font-sans text-slate-300">
                            This psychosomatic map is for <strong>educational reflection and stress-pattern awareness only</strong>. It is not diagnostic and does not replace medical treatment. <strong>Under no circumstances should you discontinue, alter, or delay any prescribed medicine</strong> (including insulin, metformin, thyroid replacement, cardiovascular, or blood sugar therapies). Somatic healing complements physical medicine; it does not replace it.
                        </p>
                    </div>
                </div>
            </div>

            {/* Intro Header with Gorgeous Gradient Text */}
            <div className="space-y-2 relative">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest block font-black">
                    PSYCHOSOMATIC INTUITIVE EXPLORER & CLINICAL DECODER ENCYCLOPEDIA
                </span>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                    CURE YOUR LIFE<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">SYMPTOM EXPLORER+</span>
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-2xl font-light leading-7">
                    Discover the deep emotional truths, somatic metaphors, and physical warnings hidden behind your chronic aches, pains, and micro-malfunctions.
                </p>
            </div>
        </>
    );
};

interface SearchCommandBarProps {
    customSymptom: string;
    setCustomSymptom: (val: string) => void;
    onAnalyze: () => void;
    selectedCategory: string | null;
}

export const SearchCommandBar: React.FC<SearchCommandBarProps> = ({
    customSymptom,
    setCustomSymptom,
    onAnalyze,
    selectedCategory
}) => {
    if (selectedCategory) return null;

    return (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-6">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onAnalyze();
                }}
                className="relative flex items-center p-1.5 rounded-full border border-indigo-500/35 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.15)] group focus-within:border-indigo-400 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-300"
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 -z-10 group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
                <div className="flex items-center justify-center pl-4 pr-2.5 shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-[pulse_2s_infinite]" />
                </div>
                <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Enter your custom symptom to decode (e.g., sharp pain under right rib, tight jaw when stressed)..."
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-[11px] md:text-xs py-3 focus:outline-none focus:ring-0 font-mono"
                />
                <button
                    type="submit"
                    className="px-5 py-3 md:px-7 md:py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-[11px] md:text-xs font-black uppercase tracking-widest rounded-full cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                    <span>Analyze Symptom</span>
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/90 shrink-0" />
                </button>
            </form>
        </div>
    );
};
