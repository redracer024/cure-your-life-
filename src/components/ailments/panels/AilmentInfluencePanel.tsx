import React from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { TruncatedText } from '../TruncatedText';
import { softenMedicalClaims, getStructuredInfluenceText, getStructuredResetText } from '../../../lib/ailmentHelpers';

interface AilmentInfluencePanelProps {
    enriched: any;
}

export function AilmentInfluencePanel({ enriched }: AilmentInfluencePanelProps) {
    return (
        <motion.div
            key="influence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-[#FF8A00] uppercase font-black">
                    <Layers className="w-4 h-4 text-[#FF8A00]" />
                    <span>Influence Layers</span>
                </div>
                <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">TCM BREATH / QI HIERARCHY</span>
            </div>

            <div className="grid grid-cols-1 gap-6 items-stretch">
                {/* Layer 1 */}
                {[1, 2, 3, 4, 5].map((layerNum) => {
                    const layer = enriched.structuredContent?.influenceLayers?.[layerNum - 1];
                    const layerColor = layerNum === 1 ? '#00D2FF' : layerNum === 2 ? '#a855f7' : layerNum === 3 ? '#FF8A00' : layerNum === 4 ? '#ef4444' : '#10b981';
                    const layerBg = layerNum === 1 ? 'from-blue-950/35' : layerNum === 2 ? 'from-purple-950/35' : layerNum === 3 ? 'from-amber-950/35' : layerNum === 4 ? 'from-red-950/35' : 'from-emerald-950/35';

                    return (
                        <div key={layerNum} className={`bg-gradient-to-br ${layerBg} via-black/80 to-[#05070B] border border-white/10 hover:border-white/30 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(0,0,0,0.3)] transition-all duration-500 premium-3d-card hover:scale-[1.018] group relative overflow-hidden backdrop-blur-xl`}>
                            <div className="absolute -right-12 -top-12 w-28 h-28 opacity-10 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: layerColor }} />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-black" style={{ color: layerColor }}>L{layerNum}</span>
                                    <span className="text-xs font-mono uppercase tracking-widest font-black text-white">{layer?.title || `Layer ${layerNum}`}</span>
                                </div>
                                <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase shrink-0 font-bold" style={{ color: layerColor }}>{layer?.tag || 'Somatic Layer'}</span>
                            </div>
                            <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-6 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm relative z-10">
                                <TruncatedText text={softenMedicalClaims(getStructuredInfluenceText(enriched, layerNum, layerNum === 1 ? enriched.physiologicalDescription : layerNum === 2 ? enriched.emotionalRoot : layerNum === 3 ? enriched.sarcasticAdvice : layerNum === 4 ? enriched.metaphor : getStructuredResetText(enriched)))} maxLen={1200} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
