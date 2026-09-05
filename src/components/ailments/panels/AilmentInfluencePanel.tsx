import React from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { TruncatedText } from '../TruncatedText';
import { LensGlossaryText } from '../../lenses/LensGlossaryText';
import { softenMedicalClaims } from '../../../lib/ailmentHelpers';

interface AilmentInfluencePanelProps {
    enriched: any;
    onOpenLenses?: () => void;
}

interface LayerData {
    title?: string;
    tag?: string;
    paragraphs?: string[];
    body?: string;
    text?: string;
    description?: string;
}

function getLayerText(layer: LayerData | undefined): string {
    if (!layer) return '';
    const content = layer.paragraphs || layer.body || layer.text || layer.description;
    if (Array.isArray(content)) return content.join('\n\n');
    return typeof content === 'string' ? content : '';
}

export function AilmentInfluencePanel({ enriched, onOpenLenses }: AilmentInfluencePanelProps) {
    const layers: LayerData[] = enriched.structuredContent?.influenceLayers || [];
    const layerCount = layers.length;

    if (layerCount === 0) {
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
                </div>
                <div className="text-sm text-[#8A94A6] italic p-4">No influence layers available for this condition.</div>
            </motion.div>
        );
    }

    if (layerCount === 2) {
        const layer1 = layers[0];
        const layer2 = layers[1];
        const text1 = softenMedicalClaims(getLayerText(layer1));
        const text2 = softenMedicalClaims(getLayerText(layer2));

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

                <div className="bg-gradient-to-br from-purple-950/35 via-black/80 to-[#05070B] border border-white/10 hover:border-white/30 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(0,0,0,0.3)] transition-all duration-500 premium-3d-card hover:scale-[1.018] group relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -right-12 -top-12 w-28 h-28 opacity-10 rounded-full blur-xl pointer-events-none bg-[#a855f7]" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-black text-[#a855f7]">✦</span>
                            <span className="text-xs font-mono uppercase tracking-widest font-black text-white">The Deeper Context</span>
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {layer1 && (
                            <div>
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#00D2FF] mb-2">{layer1.title || 'TCM Framework'}</h4>
                                <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-4 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm">
                                    <TruncatedText
                                    text={text1}
                                    maxLen={1200}
                                    textRenderer={(t) => <LensGlossaryText text={t} onOpenLenses={onOpenLenses} />}
                                />
                                </div>
                            </div>
                        )}
                        {layer2 && (
                            <div>
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7] mb-2">{layer2.title || 'Jungian Shadow'}</h4>
                                <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-4 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm">
                                    <TruncatedText
                                    text={text2}
                                    maxLen={1200}
                                    textRenderer={(t) => <LensGlossaryText text={t} onOpenLenses={onOpenLenses} />}
                                />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    const mindLayers = layers.slice(0, 2);
    const somaticLayers = layers.slice(2, 4);

    const renderCard = (title: string, cardLayers: LayerData[], gradientFrom: string, accentColor: string) => (
        <div className={`bg-gradient-to-br ${gradientFrom} via-black/80 to-[#05070B] border border-white/10 hover:border-white/30 p-6 md:p-8 rounded-[2.2rem] flex flex-col justify-between space-y-6 shadow-[0_0_45px_rgba(0,0,0,0.3)] transition-all duration-500 premium-3d-card hover:scale-[1.018] group relative overflow-hidden backdrop-blur-xl`}>
            <div className="absolute -right-12 -top-12 w-28 h-28 opacity-10 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: accentColor }} />
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-black" style={{ color: accentColor }}>✦</span>
                    <span className="text-xs font-mono uppercase tracking-widest font-black text-white">{title}</span>
                </div>
            </div>
            <div className="space-y-4 relative z-10">
                {cardLayers.map((layer, idx) => {
                    const layerColor = idx === 0 ? '#00D2FF' : '#a855f7';
                    const text = softenMedicalClaims(getLayerText(layer));
                    return (
                        <div key={idx}>
                            <h4 className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: layerColor }}>{layer.title || `Section ${idx + 1}`}</h4>
                            <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-4 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm">
                                <TruncatedText
                                    text={text}
                                    maxLen={1200}
                                    textRenderer={(t) => <LensGlossaryText text={t} onOpenLenses={onOpenLenses} />}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

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
                {renderCard('Mind & Symbolism', mindLayers, 'from-purple-950/35', '#a855f7')}
                {somaticLayers.length > 0 && renderCard('Somatic Mechanics', somaticLayers, 'from-amber-950/35', '#FF8A00')}
            </div>
        </motion.div>
    );
}
