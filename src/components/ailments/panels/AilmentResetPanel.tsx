import React from 'react';
import { Feather } from 'lucide-react';
import { motion } from 'motion/react';
import SomaticBreathingRegulator from '../../breathing/SomaticBreathingRegulator';
import { TruncatedText } from '../TruncatedText';
import { softenMedicalClaims, getStructuredResetText } from '../../../lib/ailmentHelpers';

interface AilmentResetPanelProps {
    enriched: any;
    onJournalRedirect: () => void;
}

export function AilmentResetPanel({ enriched, onJournalRedirect }: AilmentResetPanelProps) {
    return (
        <motion.div
            key="reset"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <SomaticBreathingRegulator />

            <div className="bg-gradient-to-br from-emerald-950/35 via-black/80 to-[#05070B] border border-white/10 hover:border-white/30 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(0,0,0,0.3)] transition-all duration-500 premium-3d-card hover:scale-[1.018] group relative overflow-hidden backdrop-blur-xl">
                <div className="absolute -right-12 -top-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
                    <Feather className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-black font-mono text-white uppercase tracking-widest">Additional Reset Protocols</h4>
                </div>
                <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-6 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm relative z-10">
                    <TruncatedText text={softenMedicalClaims(getStructuredResetText(enriched))} maxLen={1200} />
                </div>
            </div>

            {/* Expanded Card Footer Action Bar */}
            <div className="pt-6 border-t border-[#1E2430] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                <button
                    type="button"
                    onClick={onJournalRedirect}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                    <Feather className="w-4 h-4 text-amber-300" />
                    <span>Log in Somatic Journal Ledger</span>
                </button>

                <span className="text-slate-500 text-[11px]">Active Calibration: CYL-{enriched.id} | System Homeostasis Ok</span>
            </div>
        </motion.div>
    );
}
