import React from 'react';
import { Search } from 'lucide-react';

interface DictionarySearchHeaderProps {
    selectedCategory: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const DictionarySearchHeader: React.FC<DictionarySearchHeaderProps> = ({
    selectedCategory,
    searchQuery,
    setSearchQuery
}) => {
    return (
        <div className={`${selectedCategory ? "hidden" : ""} glass-panel p-6 md:p-8 rounded-[2.5rem] space-y-6 relative z-10`}>
            <div className="relative font-mono">
                <Search className="w-4 h-4 text-indigo-400 absolute left-4 top-4" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search symptoms..."
                    className="w-full bg-black/40 text-white placeholder-slate-500 text-xs px-11 py-4 rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none transition-all font-mono shadow-inner"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white text-[11px] font-bold"
                    >
                        CLEAR
                    </button>
                )}
            </div>
        </div>
    );
};
