import React from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AilmentSafetyPanelProps {
    enriched: any;
    isDisclaimerExpanded: boolean;
    setIsDisclaimerExpanded: (expanded: boolean) => void;
}

export function AilmentSafetyPanel({ enriched, isDisclaimerExpanded, setIsDisclaimerExpanded }: AilmentSafetyPanelProps) {
    return (
        <motion.div
            key="safety"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {/* Serious integrated medical warning for high-risk symptoms */}
            {(enriched.id === 'diabetes' || (enriched.riskLevel && (enriched.riskLevel.toLowerCase().includes('medical') || enriched.riskLevel.toLowerCase().includes('high')))) && (
                <div className="bg-red-950/15 border border-red-500/15 p-4 md:px-6 rounded-2xl flex flex-col gap-3 text-xs text-red-200 shadow-lg backdrop-blur-md relative overflow-hidden shrink-0 w-full transition-all duration-300">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-red-500/30" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                        <div className="flex gap-3 items-center">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                            <div className="flex flex-wrap items-center gap-x-2.5">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-red-400 font-black">
                                    ⚠ Safety Protocol Active
                                </span>
                                <span className="text-slate-300 text-[11px] font-sans">
                                    This app does not diagnose, treat, or cure disease.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
                            className="text-[11px] font-mono font-black text-red-400 hover:text-red-300 underline underline-offset-4 cursor-pointer transition-all self-start sm:self-auto"
                        >
                            {isDisclaimerExpanded ? '[Hide full disclaimer]' : '[View full disclaimer]'}
                        </button>
                    </div>

                    {/* Collapsible Content */}
                    <AnimatePresence initial={false}>
                        {isDisclaimerExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden space-y-2 border-t border-red-500/10 pt-3"
                            >
                                <p className="leading-7 text-slate-300 font-sans">
                                    It explains possible mind-body patterns and lifestyle-related mechanisms for educational reflection. Always consult a licensed medical professional for diagnosis, medication, labs, and treatment.
                                </p>
                                <p className="text-[11px] text-red-300/85 leading-7 font-mono font-bold">
                                    <strong>DIABETES PROTOCOL:</strong> Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Medical Safety Protocols */}
            <div className="bg-gradient-to-br from-red-950/35 via-black/80 to-[#05070B] border border-red-400/25 hover:border-red-300/45 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(239,68,68,0.13)] transition-all duration-300 premium-3d-card hover:scale-[1.018] hover:shadow-[0_0_55px_rgba(239,68,68,0.18)] group relative overflow-hidden backdrop-blur-xl">
                <div className="absolute -right-12 -top-12 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 border-b border-red-500/10 pb-3 relative z-10">
                    <Shield className="w-5 h-5 text-red-400" />
                    <div>
                        <h4 className="text-sm font-black font-mono text-white uppercase tracking-wider"> Standards</h4>
                        <p className="text-[11px] text-slate-500 font-mono lowercase">Risk Level: {enriched.riskLevel}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Left Column: Alerts */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-[10px] font-mono text-red-400 uppercase font-black block">🚨 CRITICAL RED FLAG ALERTS</span>
                            <ul className="space-y-2 list-disc pl-4 text-slate-300 font-sans font-light leading-7">
                                {(enriched.medical_safety?.critical_alerts || [
                                    "Sudden, severe, or excruciating pain with no obvious cause",
                                    "Pain that begins after a major physical injury or trauma",
                                    "Pain accompanied by fever, chills, night sweats, or unexplained weight loss"
                                ]).map((alert: string, idx: number) => (
                                    <li key={idx}>{alert}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl space-y-1">
                            <span className="text-[10px] font-mono text-red-400 font-bold block">SEEK IMMEDIATE EMERGENCY CARE IF:</span>
                            <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[11px] font-sans font-light leading-7">
                                {(enriched.medical_safety?.seek_immediate_care_if || [
                                    "You experience sudden, unbearable pain or pain following a major injury"
                                ]).map((item: string, idx: number) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Guidance */}
                    <div className="space-y-4">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-1">
                            <span className="text-[10px] font-mono text-amber-400 font-bold block">SCHEDULE AN APPOINTMENT IF:</span>
                            <ul className="space-y-1 list-disc pl-4 text-slate-300 text-[11px] font-sans font-light leading-7">
                                {(enriched.medical_safety?.schedule_care_if || [
                                    "Your pain is persistent, gradually worsening, or lasts longer than 2-3 weeks"
                                ]).map((item: string, idx: number) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-1.5 font-sans font-light leading-7 text-[#8A94A6]">
                            <span className="text-[10px] font-mono text-[#8A94A6] uppercase font-bold block">Self-Care Threshold</span>
                            <p className="text-[11px]">
                                {enriched.medical_safety?.self_care_allowed_if || "Gentle movement and temperature therapy are appropriate for transient tension."}
                            </p>
                            <p className="text-[11px] not-italic pt-1 text-slate-500">
                                {enriched.medical_safety?.do_not_ignore}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono border-t border-white/5 pt-4">
                    <strong>Disclaimer:</strong> {enriched.medical_safety?.disclaimer || "This content is for reference only. Please seek medical guidance."}
                </div>
            </div>
        </motion.div>
    );
}
