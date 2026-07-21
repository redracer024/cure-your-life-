import React from 'react';
import { Sparkles, Activity, HelpCircle, RotateCcw, Compass, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SymptomAnalysisResponse } from '../types';
import { renderHolographicFace, renderSarcasticusAvatar } from './visuals/HolographicAvatars';

interface SymptomDecoderProps {
    customSymptom: string;
    setCustomSymptom: (val: string) => void;
    customHabits: string;
    setCustomHabits: (val: string) => void;
    isDecoding: boolean;
    decodedResult: SymptomAnalysisResponse | null;
    decodeError: string | null;
    handleDecodeSymptom: (e: React.FormEvent) => Promise<void>;
    setDecodedResult: (res: SymptomAnalysisResponse | null) => void;
}

export const SymptomDecoder: React.FC<SymptomDecoderProps> = ({
    customSymptom,
    setCustomSymptom,
    customHabits,
    setCustomHabits,
    isDecoding,
    decodedResult,
    decodeError,
    handleDecodeSymptom,
    setDecodedResult
}) => {
    return (
        <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-widest uppercase">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>AI Somatic Diagnostic Lab</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">
                    Symptom<br />
                    <span className="text-indigo-500">Decoder</span>
                </h1>
                <p className="text-base text-slate-400 max-w-2xl leading-7 font-light">
                    Can't find your specific aches in our dictionary? Enter your customized physical misery and let Dr. Sarcasticus diagnose your subconscious fears and poor ergonomic life choices in real-time.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form */}
                <div className="lg:col-span-5 bg-[#07090E] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl space-y-6">
                    <div className="absolute top-0 left-1/4 w-48 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest pb-3 border-b border-[#1E2430] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Input Lab Specimen</span>
                    </h3>

                    <form onSubmit={handleDecodeSymptom} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="custom-symptom-input" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                                1. Describe your physical ailment *
                            </label>
                            <textarea
                                id="custom-symptom-input"
                                required
                                rows={3}
                                value={customSymptom}
                                onChange={(e) => setCustomSymptom(e.target.value)}
                                placeholder="e.g. Sharp throbbing pain behind my right eyeball, or unexplained clicking in my left pinky finger..."
                                className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="custom-habits-input" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                                2. Honestly describe your bad habits (optional)
                            </label>
                            <textarea
                                id="custom-habits-input"
                                rows={3}
                                value={customHabits}
                                onChange={(e) => setCustomHabits(e.target.value)}
                                placeholder="e.g. Sitting cross-legged for 9 hours without moving, drank 4 coffees and 0 waters today, obsessively checking my ex's Instagram..."
                                className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isDecoding || !customSymptom.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isDecoding ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                    <span>Consulting Dr. Sarcasticus...</span>
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4 text-amber-300" />
                                    <span>Run Psychosomatic Decode</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 flex gap-3 items-start">
                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-[11px] text-amber-400/90 leading-7 font-mono">
                            DISCLAIMER: Dr. Sarcasticus is an AI assistant model. His insights are psychosomatically deep and medically accurate, but do not replace your actual real-life doctor if your body is actively complaining of emergency malfunctions.
                        </p>
                    </div>
                </div>

                {/* Right Column: Decoded Output Result */}
                <div className="lg:col-span-7">
                    <AnimatePresence mode="wait">
                        {isDecoding && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-[#07090E] p-8 rounded-[2rem] border border-white/10 relative overflow-hidden flex flex-col items-center text-left space-y-6 shadow-2xl min-h-[420px] justify-center"
                            >
                                <div className="relative w-40 h-40 border border-indigo-500/20 rounded-2xl bg-black/40 p-4 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-[bounce_2.5s_infinite] top-0 z-20" />
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff08_1px,transparent_1px)] bg-[size:10px_10px]" />
                                    <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-30 text-indigo-400">
                                        <circle cx="50" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                                        <line x1="50" y1="32" x2="50" y2="70" stroke="currentColor" strokeWidth="1" />
                                        <line x1="50" y1="42" x2="30" y2="35" stroke="currentColor" strokeWidth="1" />
                                        <line x1="50" y1="42" x2="70" y2="35" stroke="currentColor" strokeWidth="1" />
                                        <line x1="50" y1="70" x2="38" y2="92" stroke="currentColor" strokeWidth="1" />
                                        <line x1="50" y1="70" x2="62" y2="92" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                    <div className="absolute w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 animate-ping" />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-black block animate-pulse">
                                        🔬 CONNECTING SUBCONSCIOUS TRACE PROBES...
                                    </span>
                                    <p className="text-xs text-slate-400 not-italic max-w-sm mx-auto font-sans font-light">
                                        "Analyzing the exact physiological intersection of your modern emotional suppression and sitting folded up like a raw lasagna sheet."
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {decodeError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-500/10 p-6 rounded-2xl border border-red-500/30 space-y-3"
                            >
                                <div className="flex items-center gap-2 text-red-400">
                                    <Activity className="w-5 h-5" />
                                    <h4 className="font-mono text-sm font-bold uppercase tracking-wider">Diagnostic Interrupted</h4>
                                </div>
                                <p className="text-xs text-red-300 leading-7 font-mono">
                                    {decodeError}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                    Note: Make sure your GEMINI_API_KEY environment variable is configured in the AI Studio platform Secrets dashboard.
                                </p>
                            </motion.div>
                        )}

                        {!isDecoding && !decodedResult && !decodeError && (
                            <div className="bg-[#07090E] border border-white/5 p-12 rounded-[2.5rem] text-left space-y-4 shadow-2xl min-h-[420px] flex flex-col justify-center items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <HelpCircle className="w-8 h-8 text-slate-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest font-bold">Awaiting Lab Specimen</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans font-light">
                                        Your somatic scan report will generate here once you enter your physical ailment and current lifestyle habits in the scanner console on the left.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isDecoding && decodedResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="p-6 bg-gradient-to-b from-[#0A0D14] to-[#040609] border border-indigo-500/20 rounded-[2rem] space-y-4 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase font-black">
                                                SOMATIC LAB REPORT COMPLETED
                                            </span>
                                        </div>
                                        <div className="flex gap-4 font-mono text-[8px] text-slate-500 uppercase tracking-wider">
                                            <span>COEFF: 0.96</span>
                                            <span>DENIAL: CRITICAL</span>
                                            <span>DEC-ID: #{Math.floor(Math.random() * 9000 + 1000)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-start gap-4 pt-1">
                                        {renderHolographicFace()}
                                        <div className="space-y-1.5 flex-1">
                                            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block font-black">
                                                CORE SUBCONSCIOUS EMOTIONAL MATRIX
                                            </span>
                                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none">
                                                The Metaphorical Root Cause
                                            </h2>
                                            <p className="text-xs text-slate-200 leading-7 not-italic font-light">
                                                "{decodedResult.emotionalRoot}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[#07090E] p-5 border border-indigo-500/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] space-y-3">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-black">PHYSIOLOGICAL MECHANISM</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-7 font-sans font-light flex-1">
                                            {decodedResult.physiologicalDescription}
                                        </p>
                                        <div className="text-[8px] font-mono text-slate-500 uppercase">
                                            DIAGNOSTICS: PROFESSIONAL / MEDICAL TRUTH
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#110B03] to-[#040609] p-5 border border-amber-500/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] space-y-3">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                                        <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-black">DR. SARCASTICUS VERDICT</span>
                                            </div>
                                            <span className="text-[8px] font-mono text-amber-500/70 uppercase">Cynical Mode</span>
                                        </div>
                                        <div className="flex gap-3 items-start flex-1 py-1">
                                            {renderSarcasticusAvatar()}
                                            <div className="p-3 bg-[#040609] border border-amber-500/10 rounded-xl flex-1 text-xs text-amber-300 leading-7 font-sans not-italic relative">
                                                <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 bg-[#040609] border-l border-b border-amber-500/10 transform rotate-45" />
                                                "{decodedResult.sarcasticReview}"
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#07090E] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-mono uppercase tracking-wider font-black">
                                            <Compass className="w-4 h-4 text-indigo-400" />
                                            <span>Recommended Reflections</span>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {decodedResult.mindfulnessPrompts.map((p, idx) => (
                                                <li key={idx} className="text-xs text-slate-300 pl-3 border-l border-indigo-500/30 not-italic font-sans font-light leading-7">
                                                    "{p}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-mono uppercase tracking-wider font-black">
                                            <Dumbbell className="w-4 h-4 text-amber-500" />
                                            <span>Somatic Recovery Exercises</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {decodedResult.practicalTips.map((t, idx) => (
                                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-7 font-sans font-light">
                                                    <span className="text-indigo-400 font-mono font-bold shrink-0">[{idx + 1}]</span>
                                                    <span>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-mono text-slate-500">
                                        CYL-SCANNER VERSION: v4.12 | CALIBRATION SECURE
                                    </span>
                                    <button
                                        onClick={() => {
                                            setDecodedResult(null);
                                            setCustomSymptom('');
                                            setCustomHabits('');
                                        }}
                                        className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-[10px] text-slate-400 hover:text-white hover:border-white font-mono tracking-widest uppercase rounded-lg bg-white/5 transition-all cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset Decoder</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
};
