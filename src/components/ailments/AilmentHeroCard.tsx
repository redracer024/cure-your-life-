import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SomaticShaderCanvas } from '../SomaticShaderCanvas';
import { triggerHapticPattern, getSymptomHapticPattern } from '../../lib/ailmentHelpers';
import { getCategoryImage } from './ailmentCardImages';

interface AilmentHeroCardProps {
    enriched: any;
    isSelected: boolean;
    onSelect: () => void;
    categoryMeta: any;
    hexToRgbNormalized: (hex: string, darken?: number) => [number, number, number];
}

export function AilmentHeroCard({ enriched, isSelected, onSelect, categoryMeta, hexToRgbNormalized }: AilmentHeroCardProps) {
    return (
        <button
            type="button"
            onClick={() => { triggerHapticPattern(getSymptomHapticPattern(enriched)); onSelect(); }}
            className="w-full text-left py-4 md:py-5 px-5 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
            {/* Real category image layers for symptom result cards */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <img
                    src={getCategoryImage(enriched.category)}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-90 blur-[6px] scale-[1.12] saturate-150 contrast-125 brightness-125 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.16]"
                />
                <img
                    src={getCategoryImage(enriched.category)}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 saturate-125 contrast-110 brightness-110 transition-all duration-700 group-hover:opacity-90"
                    style={{
                        WebkitMaskImage: "radial-gradient(circle at 58% 48%, rgba(0,0,0,1) 0%, rgba(0,0,0,.75) 34%, rgba(0,0,0,.22) 68%, rgba(0,0,0,0) 100%)",
                        maskImage: "radial-gradient(circle at 58% 48%, rgba(0,0,0,1) 0%, rgba(0,0,0,.75) 34%, rgba(0,0,0,.22) 68%, rgba(0,0,0,0) 100%)",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05070b]/72 via-[#05070b]/24 to-[#05070b]/32" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" />
            </div>

            {/* Subtle decorative background glow to make the entry feel cinematic */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

            <div className="space-y-1 flex-1 w-full relative z-10">
                {/* Symptom Name */}
                <h3
                    className={`text-2xl md:text-4xl font-black uppercase tracking-tight transition-all leading-tight bg-clip-text text-transparent ${isSelected ? '' : 'group-hover:opacity-100 opacity-90'
                        }`}
                    style={{
                        backgroundImage: `linear-gradient(90deg, ${categoryMeta.color} 0%, transparent 120%)`
                    }}
                >
                    {enriched.name}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                    {enriched.tags?.slice(0, 3).map((t: string) => (
                        <span key={t} className="text-[8px] font-mono text-[#8A94A6]/80 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded-md">
                            #{t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Right column with clear "Decode" button */}
            <div className="flex items-center gap-4 md:gap-5 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0 relative z-10">

                {/* Clear "Decode Signal" Pill Button with GLSL Shader */}
                <div className="flex flex-col items-center gap-1 select-none shrink-0 min-w-[140px]">
                    <div className={`group/btn relative w-full py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-500 border text-[11px] font-mono font-black uppercase tracking-widest overflow-hidden ${isSelected
                        ? 'border-white/40 text-white shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                        : 'border-white/10 text-slate-300 group-hover:border-white/30 group-hover:text-white'
                        }`}>
                        {/* Shader Background */}
                        <div className={`absolute -inset-2 -z-10 transition-all duration-700 ${isSelected ? 'opacity-100 scale-110 rotate-6' : 'opacity-40 group-hover/btn:opacity-80 group-hover/btn:scale-110 group-hover/btn:rotate-3'
                            }`}>
                            <SomaticShaderCanvas
                                colorA={hexToRgbNormalized(categoryMeta.color)}
                                colorB={hexToRgbNormalized(categoryMeta.color, 0.4)}
                                intensity={isSelected ? 1.4 : 0.8}
                            />
                        </div>

                        {/* Button Content Overlay */}
                        <div className="absolute inset-[1px] rounded-[11px] bg-black/60 group-hover/btn:bg-black/40 transition-colors duration-500 -z-10" />

                        <span className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            {isSelected ? 'Close Panel' : 'Decode Signal'}
                        </span>
                        <ChevronRight className={`relative z-10 w-3.5 h-3.5 transition-transform duration-500 ${isSelected ? 'transform rotate-180' : 'group-hover/btn:translate-x-1'
                            }`} />
                    </div>
                </div>
            </div>
        </button>
    );
}
