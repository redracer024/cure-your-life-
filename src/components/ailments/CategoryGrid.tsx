import React from 'react';
import { Compass, ChevronRight, Sparkles } from 'lucide-react';
import { CATEGORY_META, renderCategoryIcon } from './ailmentCategoryMeta';
import { CategoryBackground } from '../CategoryBackground';
import type { AilmentCore } from '../../types/dictionary';

interface CategoryGridProps {
    categories: string[];
    selectedCategory: string | null;
    setSelectedCategory: (cat: string) => void;
    browsableAilments: AilmentCore[];
    allAilments: AilmentCore[];
    selectedAilment: AilmentCore | null;
    setSelectedAilment: (ailment: AilmentCore | null) => void;
    onOpenQuiz: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    browsableAilments,
    allAilments,
    selectedAilment,
    setSelectedAilment,
    onOpenQuiz
}) => {
    return (
        <div className="space-y-3.5 relative">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400 uppercase tracking-wider font-black">
                <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>1. Choose Somatic Region Grouping</span>
            </div>

            {(() => {
                const allCat = categories.includes('All') ? 'All' : null;
                const realCats = categories.filter(c => c !== 'All');
                const renderCard = (cat: string) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META['All'];
                    const isSelected = selectedCategory === cat;
                    const count = cat === 'All'
                        ? allAilments.length
                        : allAilments.filter(a => a.category === cat).length;

                    return (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                if (selectedAilment && cat !== 'All' && selectedAilment.category !== cat) {
                                    setSelectedAilment(null);
                                }
                            }}
                            className={`category-card text-left p-5 rounded-[1.6rem] transition-all duration-500 relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[220px] ${isSelected
                                ? '-translate-y-1.5 border-[var(--system-color)] bg-black/75 shadow-[0_0_50px_var(--system-glow),inset_0_0_20px_rgba(255,255,255,0.02)] scale-[1.03]'
                                : 'border-white/5 bg-black/40 hover:bg-black/50 hover:-translate-y-1 hover:border-[var(--system-color)]/40'
                                }`}
                            style={{
                                '--system-color': meta.color,
                                '--system-glow': meta.glowColor
                            } as React.CSSProperties}
                        >
                            <CategoryBackground category={cat} isSelected={isSelected} color={meta.color} />

                            <div className="flex items-start justify-between w-full relative z-10">
                                <div className="icon-shell flex items-center justify-center shrink-0">
                                    {renderCategoryIcon(meta.iconName, "w-6 h-6", meta.color)}
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                    <span className="text-[11px] font-mono text-slate-500 font-bold tracking-wider group-hover:text-slate-400 transition-colors">
                                        {count} {count === 1 ? 'SYMPTOM' : 'SYMPTOMS'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10 w-full mt-4">
                                <h3 className={`text-base font-black uppercase tracking-tight font-display transition-colors ${isSelected ? 'text-[var(--system-color)]' : 'text-white group-hover:text-[var(--system-color)]'}`}>
                                    {cat}
                                </h3>
                                <p className="text-[11px] text-[#8A94A6] line-clamp-3 leading-7 font-sans font-light mt-1.5 group-hover:text-slate-300 transition-colors">
                                    {meta.desc}
                                </p>
                            </div>

                            <div className="flex items-center justify-end w-full relative z-10 mt-3 pt-2.5 border-t border-white/[0.03]">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${isSelected ? 'bg-[var(--system-color)]/20 text-[var(--system-color)] border border-[var(--system-color)]/30 shadow-[0_0_12px_var(--system-glow)]' : 'bg-white/5 border border-white/5 text-slate-500 group-hover:text-white group-hover:bg-[var(--system-color)]/20 group-hover:border-[var(--system-color)]/40 group-hover:shadow-[0_0_12px_var(--system-glow)] group-hover:translate-x-1'}`}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </button>
                    );
                };

                return (
                    <>
                        {allCat && (
                            <div className="w-full">
                                {renderCard('All')}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                            {realCats.map(renderCard)}
                        </div>
                    </>
                );
            })()}

            <button
                onClick={onOpenQuiz}
                className="w-full p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-pink-950/20 hover:from-indigo-900/40 hover:via-purple-900/30 hover:to-pink-900/20 hover:border-indigo-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-indigo-300 transition-colors font-display">
                            Personality Pattern Quiz
                        </h3>
                        <p className="text-[11px] text-slate-500 font-sans font-light">
                            Which hidden pattern is your body living?
                        </p>
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                </div>
            </button>
        </div>
    );
};
