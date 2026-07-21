import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { TruncatedText } from '../TruncatedText';
import { softenMedicalClaims } from '../../../lib/ailmentHelpers';

interface AilmentTonePanelProps {
    enriched: any;
}

export function AilmentTonePanel({ enriched }: AilmentTonePanelProps) {
    return (
        <motion.div
            key="tones"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-purple-400 uppercase font-black">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Somatic Tone Perspectives</span>
                </div>
                <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">ALL THREE TONES AVAILABLE FOR COMPARISON</span>
            </div>

            <div className="grid grid-cols-1 gap-6 items-stretch">
                {/* Card 1: Clinical (Blue theme) */}
                <div className="bg-gradient-to-br from-blue-950/35 via-black/80 to-[#05070B] border border-blue-400/25 hover:border-blue-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(59,130,246,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(59,130,246,0.18)] group relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#00D2FF] bg-blue-950/40 border border-blue-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                    Clinical
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500">BIOLOGY & SCIENCE</span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">Anatomical System Mechanism</h4>
                            <div className="text-sm text-[#E6ECF3] bg-white/[0.035] border border-white/10 p-5 md:p-6 rounded-[1.35rem] font-mono shadow-[inset_0_0_22px_rgba(255,255,255,0.025)] backdrop-blur-sm">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.clinical.mechanism || enriched.physiologicalDescription)} maxLen={720} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-mono text-[#00D2FF] uppercase font-bold block">Intervention Checklist</span>
                            <ul className="space-y-2">
                                {(enriched.tones?.clinical.protocol || [enriched.physicalTherapyTip]).map((step: string, idx: number) => (
                                    <li key={idx} className="text-sm text-[#E6ECF3] leading-7 flex items-start gap-2 pl-1 font-sans font-light">
                                        <span className="text-[#00D2FF] font-bold mt-0.5">✔</span>
                                        <span className="block flex-1"><TruncatedText text={softenMedicalClaims(step)} maxLen={900} /></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-2 shrink-0">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                            MEDICAL SOURCE CITATIONS
                        </span>
                        <div className="space-y-1">
                            {(enriched.tones?.clinical.citations || [
                                "Somatic Medicine & Biofeedback Journal (Vol 14, Issue 2)",
                                "Review of Psychosomatic Fascial Guarding Patterns (2023)"
                            ]).map((citation: string, idx: number) => (
                                <div key={idx} className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 truncate">
                                    <BookOpen className="w-3 h-3 text-slate-600 shrink-0" />
                                    <span className="truncate">{citation}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card 2: Witty (Purple/Indigo theme) */}
                <div className="bg-gradient-to-br from-purple-950/35 via-black/80 to-[#05070B] border border-purple-400/25 hover:border-purple-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(168,85,247,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(168,85,247,0.18)] group relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#B15CFF] bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                    Witty
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500">CHAOS WAREHOUSE</span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">
                                {enriched.tones?.witty.metaphorTitle || "The Internal Defense Guard"}
                            </h4>
                            <div className="text-sm text-[#E6ECF3] not-italic bg-black/40 border border-white/5 p-5 md:p-6 rounded-2xl font-sans">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.witty.metaphorText || enriched.metaphor)} maxLen={720} />
                            </div>
                        </div>

                        {enriched.tones?.witty.visualWarehouseDescription && (
                            <div className="p-4 bg-black/40 rounded-xl border border-indigo-500/10 text-[11px] text-[#B15CFF] leading-7 font-mono">
                                <span className="text-[8px] text-[#8A94A6] font-bold block mb-1">SYSTEM SCHEMATIC:</span>
                                <TruncatedText text={softenMedicalClaims(enriched.tones.witty.visualWarehouseDescription)} maxLen={900} />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-3 items-start shrink-0 font-sans">
                        <Sparkles className="w-5 h-5 text-[#B15CFF] shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-1 w-full overflow-hidden">
                            <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">DR. SARCASTICUS REVELATION</span>
                            <div className="text-[11px] text-[#E6ECF3] leading-7 font-sans font-light">
                                <TruncatedText text={softenMedicalClaims(enriched.tones?.witty.wittyAdvice || enriched.sarcasticAdvice)} maxLen={520} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Brutal (Red theme) */}
                <div className="bg-gradient-to-br from-red-950/35 via-black/80 to-[#05070B] border border-red-400/25 hover:border-red-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(239,68,68,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(239,68,68,0.18)] group relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono tracking-widest text-[#FF3B3B] bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full uppercase font-black shadow-[0_0_18px_rgba(255,255,255,0.05)]">
                                    Brutal
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500">THE REALITY NEEDED</span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">The Reality Check</h4>
                            <div className="bg-red-500/10 border border-red-500/20 p-5 md:p-6 rounded-2xl relative overflow-hidden">
                                <div className="text-xs text-red-100 font-mono">
                                    <TruncatedText text={softenMedicalClaims(enriched.tones?.brutal.realityCheck || enriched.sarcasticAdvice || 'You are actively pacing yourself toward exhaustion.')} maxLen={720} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-mono text-[#FF3B3B] uppercase font-bold block">
                                {enriched.tones?.brutal.protocolTitle || "THE UNCOMPROMISING PROTOCOL"}
                            </span>
                            <ol className="space-y-2 font-sans">
                                {(enriched.tones?.brutal.protocolSteps || [
                                    enriched.physicalTherapyTip,
                                    "Stop checking emails in the middle of the night. It is a false fire alarm.",
                                    "Drink a massive glass of water. Unclench your jaw. Go rest your nervous system."
                                ]).map((step: string, idx: number) => (
                                    <li key={idx} className="flex gap-2 items-start bg-black/40 p-2.5 border border-red-500/10 rounded-xl">
                                        <span className="flex items-center justify-center shrink-0 w-4 h-4 rounded bg-red-950 border border-red-500/20 text-[8px] font-mono text-red-400 font-bold font-display">
                                            0{idx + 1}
                                        </span>
                                        <div className="text-xs text-red-200 leading-7 font-sans font-light flex-1">
                                            <TruncatedText text={softenMedicalClaims(step)} maxLen={900} />
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 shrink-0">
                        <div className="text-[8px] font-mono text-[#FF3B3B] tracking-widest font-black uppercase text-left font-bold">
                            🚨 ACTION PROTOCOL LIVE
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
