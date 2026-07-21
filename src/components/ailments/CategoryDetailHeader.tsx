import React from 'react';
import { CATEGORY_META } from './ailmentCategoryMeta';

interface CategoryDetailHeaderProps {
    selectedCategory: string;
    filteredCount: number;
}

export const CategoryDetailHeader: React.FC<CategoryDetailHeaderProps> = ({
    selectedCategory,
    filteredCount
}) => {
    const meta = CATEGORY_META[selectedCategory] || CATEGORY_META['All'];
    const activeColor = meta.color;

    return (
        <div
            className="relative rounded-[2.5rem] p-6 mb-4 overflow-hidden border transition-all duration-500 backdrop-blur-xl"
            style={{
                backgroundColor: 'rgba(5, 7, 11, 0.55)',
                borderColor: `${activeColor}25`,
                boxShadow: `0 0 35px ${activeColor}12`
            }}
        >
            <div
                className="absolute inset-0 pointer-events-none opacity-20 z-0"
                style={{ background: `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 60%)` }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center w-full">
                <div className="space-y-3.5 flex flex-col items-center w-full">
                    <div className="flex items-center justify-center gap-3">
                        <span
                            className="text-[11px] font-mono tracking-widest uppercase px-3 py-1 rounded-full font-black border transition-all duration-300"
                            style={{
                                color: activeColor,
                                borderColor: `${activeColor}40`,
                                backgroundColor: `${activeColor}15`
                            }}
                        >
                            Somatic System
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            {filteredCount} {filteredCount === 1 ? 'Symptom' : 'Symptoms'} Found
                        </span>
                    </div>
                    <h2
                        className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-display bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                        style={{
                            backgroundImage: `linear-gradient(to top, transparent -20%, #ffffff 80%)`,
                            WebkitTextStroke: `1.5px ${activeColor}80`
                        }}
                    >
                        {selectedCategory}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300 font-sans font-light leading-7 max-w-xl mx-auto">
                        {meta.desc}
                    </p>
                </div>
            </div>
        </div>
    );
};
