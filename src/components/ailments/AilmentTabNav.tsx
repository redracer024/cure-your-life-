import React from 'react';
import { SomaticShaderCanvas } from '../SomaticShaderCanvas';

interface AilmentTabNavProps {
    innerTab: string;
    goToTab: (tab: any) => void;
    enriched: any;
    hexToRgbNormalized: (hex: string, darken?: number) => [number, number, number];
}

export function AilmentTabNav({ innerTab, goToTab, enriched, hexToRgbNormalized }: AilmentTabNavProps) {
    const options = [
        {
            key: 'safety',
            image: '/tab-art/safety.png',
            label: 'Safety',
            sub: 'Red flags first',
            color: '#ef4444',
        },
        {
            key: 'tones',
            image: '/tab-art/interpretations.png',
            label: 'Interpretations',
            sub: 'Clinical, witty, brutal',
            color: '#a855f7',
        },
        {
            key: 'influence',
            image: '/tab-art/influence.png',
            label: 'Influence',
            sub: 'Eastern + symbolic map',
            color: '#f59e0b',
        },
        {
            key: 'reset',
            image: '/tab-art/reset.png',
            label: 'Reset',
            sub: '2-minute practice',
            color: '#10b981',
        },
    ] as const;

    return (
        <div className="perspective-1000 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 preserve-3d">
                {options.map((option) => {
                    const active = innerTab === option.key;
                    return (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => goToTab(option.key)}
                            className={`group relative h-[200px] md:h-[230px] transition-all duration-700 preserve-3d cursor-pointer ${active ? 'scale-105' : 'hover:scale-[1.02]'
                                }`}
                            style={{
                                transform: active ? 'rotateY(0deg) translateZ(20px)' : 'rotateY(-15deg)',
                            }}
                        >
                            {/* 3D Card Face */}
                            <div className={`absolute inset-0 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden bg-black/80 backface-hidden ${active
                                ? 'border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.15)]'
                                : 'border-white/10 group-hover:border-white/25'
                                }`}
                                style={{
                                    borderColor: active ? option.color : undefined,
                                    boxShadow: active ? `0 0 35px ${option.color}30` : undefined
                                }}>
                                <img
                                    src={option.image}
                                    alt=""
                                    aria-hidden="true"
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${active ? 'opacity-100 scale-110 saturate-150' : 'opacity-60 saturate-50 group-hover:opacity-80 group-hover:saturate-100'
                                        }`}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                {/* Shader Glow for Active Tab - Lightened */}
                                {active && (
                                    <div className="absolute inset-0 opacity-20 mix-blend-screen pointer-events-none">
                                        <SomaticShaderCanvas
                                            colorA={hexToRgbNormalized(option.color)}
                                            colorB={hexToRgbNormalized(option.color, 0.3)}
                                            intensity={0.6}
                                        />
                                    </div>
                                )}

                                {option.key === 'safety' && enriched.medical_safety?.critical_alerts?.length > 0 && (
                                    <span className="absolute top-5 right-5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
                                    </span>
                                )}

                                <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6">
                                    <div className={`text-sm md:text-base font-mono font-black uppercase tracking-[0.2em] transition-all duration-500 ${active ? 'text-white translate-y-0' : 'text-slate-400 translate-y-1'
                                        }`}>
                                        {option.label}
                                    </div>
                                    <div className={`text-[10px] md:text-[11px] mt-1 font-mono uppercase tracking-wider transition-all duration-500 ${active ? 'text-slate-200 opacity-100' : 'text-slate-500 opacity-0'
                                        }`}>
                                        {option.sub}
                                    </div>
                                </div>
                            </div>

                            {/* 3D Side Depth Effect */}
                            <div className="absolute inset-y-0 -right-2 w-4 bg-white/5 rounded-r-[2rem] origin-left transform rotateY(90deg) -z-10" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
