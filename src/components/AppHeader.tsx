import React from 'react';
import { AlertOctagon, ChevronRight } from 'lucide-react';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../lib/brand';
import { SplitRevealHeading } from './ui/SplitRevealHeading';

export const AppHeader: React.FC = () => {
    return (
        <>
            {/* Medical Disclaimer */}
            <div className="bg-red-950/20 border border-red-500/25 p-4 md:px-5 rounded-2xl text-xs text-red-200 relative overflow-hidden backdrop-blur-md mb-2 shrink-0 w-full">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                <div className="flex gap-3 items-start">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="leading-7 font-sans text-slate-400">
                        Educational reflection only. Not a diagnosis. Never stop or change prescribed medication without consulting your doctor.
                    </p>
                </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
            <SplitRevealHeading
                title={PRODUCT_NAME}
                reveal={PRODUCT_TAGLINE}
                accessibleReveal="Explore the whole pattern."
                titleClassName="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300"
                revealClassName="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-indigo-300"
            />
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
                className="relative flex items-center p-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl group focus-within:border-white/25 transition-all duration-300"
            >
                <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Describe a symptom to decode..."
                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-xs py-3 pl-5 focus:outline-none focus:ring-0 font-mono"
                />
                <button
                    type="submit"
                    className="px-5 py-3 md:px-6 md:py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-200 font-mono text-[11px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all duration-300 flex items-center gap-2 shrink-0"
                >
                    <span>Decode</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />
                </button>
            </form>
        </div>
    );
};
